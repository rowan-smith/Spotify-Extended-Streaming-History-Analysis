import { formatHourLabelLocal } from '../utils/formatting';
import type {
  AlbumStats,
  ArtistStats,
  SongStats,
  SortMetric,
  StreamRecord,
  TimelinePoint,
  YearSeries,
} from '../types';
import {
  aggregateAlbums,
  aggregateArtists,
  aggregateSongs,
  songKey,
  sortSongs,
  topAlbums,
  topArtists,
  topSongs,
} from './aggregation';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

type SongBucket = Map<string, SongStats>;

interface TimelineBucket {
  plays: number;
  hours: number;
  songs: SongBucket;
}

interface WeekdayBucket {
  plays: number;
  songs: Map<string, { trackName: string; artistName: string; numPlays: number }>;
}

function emptyTimelineBucket(): TimelineBucket {
  return { plays: 0, hours: 0, songs: new Map() };
}

function emptyWeekdayBucket(): WeekdayBucket {
  return { plays: 0, songs: new Map() };
}

function localDateKey(ts: Date): string {
  const year = ts.getFullYear();
  const month = String(ts.getMonth() + 1).padStart(2, '0');
  const day = String(ts.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localHour(ts: Date): number {
  return ts.getHours();
}

function topSongFromMap(songs: SongBucket, metric: SortMetric): SongStats | undefined {
  return sortSongs([...songs.values()], metric === 'combined' ? 'plays' : metric)[0];
}

function touchSong(bucket: SongBucket, record: StreamRecord): void {
  const key = songKey(record.trackName, record.artistName);
  const song = bucket.get(key);
  if (song) {
    song.numPlays += 1;
    song.totalMsPlayed += record.msPlayed;
    song.totalHours = song.totalMsPlayed / 3_600_000;
  } else {
    bucket.set(key, {
      trackName: record.trackName,
      artistName: record.artistName,
      numPlays: 1,
      totalMsPlayed: record.msPlayed,
      totalHours: record.msPlayed / 3_600_000,
    });
  }
}

function touchTimelineBucket(bucket: TimelineBucket, record: StreamRecord): void {
  bucket.plays += 1;
  bucket.hours += record.msPlayed / 3_600_000;
  touchSong(bucket.songs, record);
}

function touchArtistMap(map: Map<string, ArtistStats>, record: StreamRecord): void {
  const existing = map.get(record.artistName);
  if (existing) {
    existing.listenCount += 1;
    existing.totalMsPlayed += record.msPlayed;
    existing.totalHours = existing.totalMsPlayed / 3_600_000;
  } else {
    map.set(record.artistName, {
      artistName: record.artistName,
      listenCount: 1,
      totalMsPlayed: record.msPlayed,
      totalHours: record.msPlayed / 3_600_000,
    });
  }
}

function touchAlbumMap(map: Map<string, AlbumStats>, record: StreamRecord): void {
  if (record.contentKind !== 'music') {
    return;
  }

  const key = `${record.albumName}\0${record.artistName}`;
  const existing = map.get(key);
  if (existing) {
    existing.numPlays += 1;
    existing.totalMsPlayed += record.msPlayed;
    existing.totalHours = existing.totalMsPlayed / 3_600_000;
  } else {
    map.set(key, {
      albumName: record.albumName,
      artistName: record.artistName,
      numPlays: 1,
      totalMsPlayed: record.msPlayed,
      totalHours: record.msPlayed / 3_600_000,
    });
  }
}

function timelineFromBuckets(
  entries: Iterable<[number | string, TimelineBucket]>,
  metric: SortMetric,
  labelForKey: (key: number | string) => string,
): TimelinePoint[] {
  return [...entries]
    .sort(([left], [right]) => {
      if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
      }
      return String(left).localeCompare(String(right));
    })
    .map(([key, bucket]) => {
      const topSong = topSongFromMap(bucket.songs, metric);
      return {
        label: labelForKey(key),
        sortKey: key,
        value: metric === 'plays' ? bucket.plays : bucket.hours,
        topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
      };
    });
}

export interface RecordScan {
  songMap: Map<string, SongStats>;
  artistMap: Map<string, ArtistStats>;
  albumMap: Map<string, AlbumStats>;
  yearBuckets: Map<number, TimelineBucket>;
  dayBuckets: Map<string, TimelineBucket>;
  yearMonthBuckets: Map<string, TimelineBucket>;
  monthlyHoursByYear: Map<number, Map<string, number>>;
  monthSeasonality: TimelineBucket[];
  dayOfMonth: TimelineBucket[];
  hourDistribution: TimelineBucket[];
  dayOfWeek: WeekdayBucket[];
  yearSongMaps: Map<number, Map<string, SongStats>>;
  yearArtistMaps: Map<number, Map<string, ArtistStats>>;
  yearAlbumMaps: Map<number, Map<string, AlbumStats>>;
  availableYears: number[];
}

export function scanRecords(records: StreamRecord[]): RecordScan {
  const songMap = new Map<string, SongStats>();
  const artistMap = new Map<string, ArtistStats>();
  const albumMap = new Map<string, AlbumStats>();
  const yearBuckets = new Map<number, TimelineBucket>();
  const dayBuckets = new Map<string, TimelineBucket>();
  const yearMonthBuckets = new Map<string, TimelineBucket>();
  const monthlyHoursByYear = new Map<number, Map<string, number>>();
  const monthSeasonality = Array.from({ length: 12 }, () => emptyTimelineBucket());
  const dayOfMonth = Array.from({ length: 31 }, () => emptyTimelineBucket());
  const hourDistribution = Array.from({ length: 24 }, () => emptyTimelineBucket());
  const dayOfWeek = Array.from({ length: 7 }, () => emptyWeekdayBucket());
  const yearSongMaps = new Map<number, Map<string, SongStats>>();
  const yearArtistMaps = new Map<number, Map<string, ArtistStats>>();
  const yearAlbumMaps = new Map<number, Map<string, AlbumStats>>();
  const availableYearSet = new Set<number>();

  for (const record of records) {
    touchSong(songMap, record);
    touchArtistMap(artistMap, record);
    touchAlbumMap(albumMap, record);

    const utcYear = record.ts.getUTCFullYear();
    const utcMonth = record.ts.getUTCMonth();
    const utcDate = record.ts.getUTCDate();
    availableYearSet.add(utcYear);

    const yearBucket = yearBuckets.get(utcYear) ?? emptyTimelineBucket();
    touchTimelineBucket(yearBucket, record);
    yearBuckets.set(utcYear, yearBucket);

    const day = localDateKey(record.ts);
    const dayBucket = dayBuckets.get(day) ?? emptyTimelineBucket();
    touchTimelineBucket(dayBucket, record);
    dayBuckets.set(day, dayBucket);

    const yearMonthKey = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}`;
    const yearMonthBucket = yearMonthBuckets.get(yearMonthKey) ?? emptyTimelineBucket();
    touchTimelineBucket(yearMonthBucket, record);
    yearMonthBuckets.set(yearMonthKey, yearMonthBucket);

    const months = monthlyHoursByYear.get(utcYear) ?? new Map<string, number>();
    const monthKey = String(utcMonth + 1).padStart(2, '0');
    months.set(monthKey, (months.get(monthKey) ?? 0) + record.msPlayed / 3_600_000);
    monthlyHoursByYear.set(utcYear, months);

    touchTimelineBucket(monthSeasonality[utcMonth], record);
    touchTimelineBucket(dayOfMonth[utcDate - 1], record);
    touchTimelineBucket(hourDistribution[localHour(record.ts)], record);

    const weekdayBucket = dayOfWeek[record.ts.getDay()];
    weekdayBucket.plays += 1;
    const weekdaySongKey = songKey(record.trackName, record.artistName);
    const weekdaySong = weekdayBucket.songs.get(weekdaySongKey);
    if (weekdaySong) {
      weekdaySong.numPlays += 1;
    } else {
      weekdayBucket.songs.set(weekdaySongKey, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
      });
    }

    const yearSongs = yearSongMaps.get(utcYear) ?? new Map<string, SongStats>();
    touchSong(yearSongs, record);
    yearSongMaps.set(utcYear, yearSongs);

    const yearArtists = yearArtistMaps.get(utcYear) ?? new Map<string, ArtistStats>();
    touchArtistMap(yearArtists, record);
    yearArtistMaps.set(utcYear, yearArtists);

    const yearAlbums = yearAlbumMaps.get(utcYear) ?? new Map<string, AlbumStats>();
    touchAlbumMap(yearAlbums, record);
    yearAlbumMaps.set(utcYear, yearAlbums);
  }

  return {
    songMap,
    artistMap,
    albumMap,
    yearBuckets,
    dayBuckets,
    yearMonthBuckets,
    monthlyHoursByYear,
    monthSeasonality,
    dayOfMonth,
    hourDistribution,
    dayOfWeek,
    yearSongMaps,
    yearArtistMaps,
    yearAlbumMaps,
    availableYears: [...availableYearSet].sort((a, b) => a - b),
  };
}

export function playsByYearFromScan(scan: RecordScan): TimelinePoint[] {
  return timelineFromBuckets(scan.yearBuckets.entries(), 'plays', (key) => String(key));
}

export function hoursByYearFromScan(scan: RecordScan): TimelinePoint[] {
  return timelineFromBuckets(scan.yearBuckets.entries(), 'time', (key) => String(key));
}

export function playsByDateFromScan(scan: RecordScan): TimelinePoint[] {
  return timelineFromBuckets(scan.dayBuckets.entries(), 'plays', (key) => String(key));
}

export function hoursByDateFromScan(scan: RecordScan): TimelinePoint[] {
  return timelineFromBuckets(scan.dayBuckets.entries(), 'time', (key) => String(key));
}

export function playtimeByYearMonthFromScan(scan: RecordScan): TimelinePoint[] {
  return [...scan.yearMonthBuckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, bucket]) => {
      const [year, month] = key.split('-');
      const topSong = topSongFromMap(bucket.songs, 'time');
      return {
        label: `${year} · ${MONTH_NAMES[Number(month) - 1]}`,
        sortKey: key,
        value: bucket.hours,
        topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
      };
    });
}

export function monthlyHistoryByYearFromScan(scan: RecordScan): YearSeries[] {
  return [...scan.monthlyHoursByYear.entries()]
    .sort(([left], [right]) => left - right)
    .map(([year, months]) => ({
      year,
      points: [...months.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([month, hours]) => ({
          label: `${year}-${month}`,
          sortKey: `${year}-${month}`,
          value: hours,
        })),
    }));
}

export function playsByMonthFromScan(scan: RecordScan): TimelinePoint[] {
  return scan.monthSeasonality.map((bucket, index) => {
    const topSong = topSongFromMap(bucket.songs, 'plays');
    return {
      label: MONTH_NAMES[index],
      sortKey: index + 1,
      value: bucket.plays,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function hoursByMonthFromScan(scan: RecordScan): TimelinePoint[] {
  return scan.monthSeasonality.map((bucket, index) => {
    const topSong = topSongFromMap(bucket.songs, 'time');
    return {
      label: MONTH_NAMES[index],
      sortKey: index + 1,
      value: bucket.hours,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function playsByDayOfMonthFromScan(scan: RecordScan): TimelinePoint[] {
  return scan.dayOfMonth.map((bucket, index) => {
    const topSong = topSongFromMap(bucket.songs, 'plays');
    return {
      label: String(index + 1),
      sortKey: index + 1,
      value: bucket.plays,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function playsByHourFromScan(scan: RecordScan): TimelinePoint[] {
  return scan.hourDistribution.map((bucket, hour) => {
    const topSong = topSongFromMap(bucket.songs, 'plays');
    return {
      label: formatHourLabelLocal(hour),
      sortKey: hour,
      value: bucket.plays,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function playsByDayOfWeekFromScan(scan: RecordScan): TimelinePoint[] {
  return scan.dayOfWeek.map((bucket, weekday) => {
    const topSong = [...bucket.songs.values()].sort((left, right) => right.numPlays - left.numPlays)[0];
    return {
      label: WEEKDAY_NAMES[weekday],
      sortKey: weekday,
      value: bucket.plays,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

function topByYearFromMaps<T extends SongStats | ArtistStats | AlbumStats>(
  yearMaps: Map<number, Map<string, T>>,
  kind: 'songs' | 'artists' | 'albums',
  sortBy: SortMetric,
  limit: number,
): Record<number, T[]> {
  const result: Record<number, T[]> = {};

  for (const [year, map] of yearMaps.entries()) {
    if (kind === 'songs') {
      result[year] = topSongs(map as Map<string, SongStats>, sortBy, limit) as T[];
    } else if (kind === 'artists') {
      result[year] = topArtists(map as Map<string, ArtistStats>, sortBy, limit) as T[];
    } else {
      result[year] = topAlbums(map as Map<string, AlbumStats>, sortBy, limit) as T[];
    }
  }

  return result;
}

export function topSongsByYearFromScan(scan: RecordScan, sortBy: SortMetric, limit: number) {
  return topByYearFromMaps(scan.yearSongMaps, 'songs', sortBy, limit);
}

export function topArtistsByYearFromScan(scan: RecordScan, sortBy: SortMetric, limit: number) {
  return topByYearFromMaps(scan.yearArtistMaps, 'artists', sortBy, limit);
}

export function topAlbumsByYearFromScan(scan: RecordScan, sortBy: SortMetric, limit: number) {
  return topByYearFromMaps(scan.yearAlbumMaps, 'albums', sortBy, limit);
}

/** Empty scan for zero-record analysis. */
export function emptyRecordScan(): RecordScan {
  return {
    songMap: new Map(),
    artistMap: new Map(),
    albumMap: new Map(),
    yearBuckets: new Map(),
    dayBuckets: new Map(),
    yearMonthBuckets: new Map(),
    monthlyHoursByYear: new Map(),
    monthSeasonality: Array.from({ length: 12 }, () => emptyTimelineBucket()),
    dayOfMonth: Array.from({ length: 31 }, () => emptyTimelineBucket()),
    hourDistribution: Array.from({ length: 24 }, () => emptyTimelineBucket()),
    dayOfWeek: Array.from({ length: 7 }, () => emptyWeekdayBucket()),
    yearSongMaps: new Map(),
    yearArtistMaps: new Map(),
    yearAlbumMaps: new Map(),
    availableYears: [],
  };
}

/** Rebuild aggregation maps from records when scan is skipped (e.g. empty input). */
export function aggregationMapsFromRecords(records: StreamRecord[]) {
  return {
    songMap: aggregateSongs(records),
    artistMap: aggregateArtists(records),
    albumMap: aggregateAlbums(records),
  };
}
