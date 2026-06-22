import { formatHourLabelLocal } from '../utils/formatting';
import type { SongStats, SortMetric, StreamRecord, TimelinePoint, YearSeries } from '../types';
import { aggregateAlbums, aggregateArtists, aggregateSongs, songKey, sortSongs, topAlbums, topArtists, topSongs } from './aggregation';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function topSongFromMap(songs: Map<string, SongStats>, metric: SortMetric): SongStats | undefined {
  return sortSongs([...songs.values()], metric === 'combined' ? 'plays' : metric)[0];
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

export function buildYearTimeline(records: StreamRecord[], metric: SortMetric): TimelinePoint[] {
  const yearMap = new Map<number, { value: number; songs: Map<string, SongStats> }>();

  for (const record of records) {
    const year = record.ts.getUTCFullYear();
    const bucket = yearMap.get(year) ?? { value: 0, songs: new Map<string, SongStats>() };
    bucket.value += metric === 'plays' ? 1 : record.msPlayed / 3_600_000;

    const key = songKey(record.trackName, record.artistName);
    const song = bucket.songs.get(key);
    if (song) {
      song.numPlays += 1;
      song.totalMsPlayed += record.msPlayed;
      song.totalHours = song.totalMsPlayed / 3_600_000;
    } else {
      bucket.songs.set(key, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }

    yearMap.set(year, bucket);
  }

  return [...yearMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, bucket]) => {
      const topSong = topSongFromMap(bucket.songs, metric);
      return {
        label: String(year),
        value: bucket.value,
        sortKey: year,
        topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
      };
    });
}

export function buildDailyTimeline(records: StreamRecord[], metric: SortMetric): TimelinePoint[] {
  const dayMap = new Map<string, { value: number; songs: Map<string, SongStats> }>();

  for (const record of records) {
    const day = localDateKey(record.ts);
    const bucket = dayMap.get(day) ?? { value: 0, songs: new Map<string, SongStats>() };
    bucket.value += metric === 'plays' ? 1 : record.msPlayed / 3_600_000;

    const key = songKey(record.trackName, record.artistName);
    const song = bucket.songs.get(key);
    if (song) {
      song.numPlays += 1;
      song.totalMsPlayed += record.msPlayed;
      song.totalHours = song.totalMsPlayed / 3_600_000;
    } else {
      bucket.songs.set(key, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }

    dayMap.set(day, bucket);
  }

  return [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, bucket]) => {
      const topSong = topSongFromMap(bucket.songs, metric);
      return {
        label: day,
        sortKey: day,
        value: bucket.value,
        topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
      };
    });
}

export function buildYearMonthTimeline(records: StreamRecord[]): TimelinePoint[] {
  const monthMap = new Map<string, { value: number; songs: Map<string, SongStats> }>();

  for (const record of records) {
    const key = `${record.ts.getUTCFullYear()}-${String(record.ts.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = monthMap.get(key) ?? { value: 0, songs: new Map<string, SongStats>() };
    bucket.value += record.msPlayed / 3_600_000;

    const songKeyValue = songKey(record.trackName, record.artistName);
    const song = bucket.songs.get(songKeyValue);
    if (song) {
      song.numPlays += 1;
      song.totalMsPlayed += record.msPlayed;
      song.totalHours = song.totalMsPlayed / 3_600_000;
    } else {
      bucket.songs.set(songKeyValue, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }

    monthMap.set(key, bucket);
  }

  return [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, bucket]) => {
      const [year, month] = key.split('-');
      const topSong = topSongFromMap(bucket.songs, 'time');
      return {
        label: `${year} · ${MONTH_NAMES[Number(month) - 1]}`,
        sortKey: key,
        value: bucket.value,
        topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
      };
    });
}

export function buildMonthlyHistoryByYear(records: StreamRecord[]): YearSeries[] {
  const yearMap = new Map<number, Map<string, number>>();

  for (const record of records) {
    const year = record.ts.getUTCFullYear();
    const month = String(record.ts.getUTCMonth() + 1).padStart(2, '0');
    const months = yearMap.get(year) ?? new Map<string, number>();
    months.set(month, (months.get(month) ?? 0) + record.msPlayed / 3_600_000);
    yearMap.set(year, months);
  }

  return [...yearMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, months]) => ({
      year,
      points: [...months.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, hours]) => ({
          label: `${year}-${month}`,
          sortKey: `${year}-${month}`,
          value: hours,
        })),
    }));
}

export function buildMonthSeasonality(records: StreamRecord[], metric: SortMetric): TimelinePoint[] {
  const counts = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    value: 0,
    songs: new Map<string, SongStats>(),
  }));

  for (const record of records) {
    const bucket = counts[record.ts.getUTCMonth()];
    bucket.value += metric === 'plays' ? 1 : record.msPlayed / 3_600_000;

    const key = songKey(record.trackName, record.artistName);
    const song = bucket.songs.get(key);
    if (song) {
      song.numPlays += 1;
      song.totalMsPlayed += record.msPlayed;
      song.totalHours = song.totalMsPlayed / 3_600_000;
    } else {
      bucket.songs.set(key, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }
  }

  return counts.map((bucket) => {
    const topSong = topSongFromMap(bucket.songs, metric);
    return {
      label: MONTH_NAMES[bucket.month - 1],
      sortKey: bucket.month,
      value: bucket.value,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function buildDayOfMonthSeasonality(records: StreamRecord[]): TimelinePoint[] {
  const counts = Array.from({ length: 31 }, (_, index) => ({
    day: index + 1,
    value: 0,
    songs: new Map<string, SongStats>(),
  }));

  for (const record of records) {
    const dayIndex = record.ts.getUTCDate() - 1;
    const bucket = counts[dayIndex];
    bucket.value += 1;

    const key = songKey(record.trackName, record.artistName);
    const song = bucket.songs.get(key);
    if (song) {
      song.numPlays += 1;
    } else {
      bucket.songs.set(key, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }
  }

  return counts.map((bucket) => {
    const topSong = topSongFromMap(bucket.songs, 'plays');
    return {
      label: String(bucket.day),
      sortKey: bucket.day,
      value: bucket.value,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function buildHourDistribution(records: StreamRecord[]): TimelinePoint[] {
  const counts = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    value: 0,
    songs: new Map<string, SongStats>(),
  }));

  for (const record of records) {
    const bucket = counts[localHour(record.ts)];
    bucket.value += 1;

    const key = songKey(record.trackName, record.artistName);
    const song = bucket.songs.get(key);
    if (song) {
      song.numPlays += 1;
    } else {
      bucket.songs.set(key, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }
  }

  return counts.map((bucket) => {
    const topSong = topSongFromMap(bucket.songs, 'plays');
    return {
      label: formatHourLabelLocal(bucket.hour),
      sortKey: bucket.hour,
      value: bucket.value,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function buildTopByYear<T extends SongStats | import('../types').ArtistStats | import('../types').AlbumStats>(
  records: StreamRecord[],
  kind: 'songs' | 'artists' | 'albums',
  sortBy: SortMetric,
  limit: number,
): Record<number, T[]> {
  const years = new Map<number, StreamRecord[]>();

  for (const record of records) {
    const year = record.ts.getUTCFullYear();
    const bucket = years.get(year) ?? [];
    bucket.push(record);
    years.set(year, bucket);
  }

  const result: Record<number, T[]> = {};

  for (const [year, yearRecords] of years.entries()) {
    if (kind === 'songs') {
      result[year] = topSongs(aggregateSongs(yearRecords), sortBy, limit) as T[];
    } else if (kind === 'artists') {
      result[year] = topArtists(aggregateArtists(yearRecords), sortBy, limit) as T[];
    } else {
      result[year] = topAlbums(aggregateAlbums(yearRecords), sortBy, limit) as T[];
    }
  }

  return result;
}
