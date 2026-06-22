import JSZip from 'jszip';
import { buildCombinedSongs, computeInsights } from './insights';
import { normalizeRawRecord, parseTimestamp } from './normalizeRecord';
import { formatHourLabelLocal } from '../utils/formatting';
import type {
  AlbumStats,
  AnalysisResult,
  ArtistStats,
  ContentKind,
  OverviewStats,
  RawRecord,
  SongStats,
  SortMetric,
  StreamRecord,
  TimelinePoint,
  YearSeries,
} from '../types';

export const SESSION_GAP_MS = 30 * 60 * 1000;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

async function loadRecordsFromZip(file: File): Promise<StreamRecord[]> {
  try {
    const zip = await JSZip.loadAsync(file);

    const filePaths = Object.keys(zip.files);
    const jsonPaths = filePaths.filter((p) => p.toLowerCase().endsWith('.json'));

    if (jsonPaths.length === 0) {
      throw new Error('No .json files found in the zip archive.');
    }

    let allRecords: StreamRecord[] = [];

    for (const path of jsonPaths) {
      const entry = zip.files[path];
      if (entry.dir) continue;

      const text = await entry.async('string');
      const parsed = JSON.parse(text) as RawRecord[] | RawRecord;

      const rawRecords: RawRecord[] = [];

      if (Array.isArray(parsed)) {
        for (const record of parsed) {
          rawRecords.push(normalizeRawRecord(record));
        }
      } else {
        rawRecords.push(normalizeRawRecord(parsed));
      }

      const cleaned = cleanRecords(rawRecords);
      allRecords = allRecords.concat(cleaned);
    }

    if (allRecords.length === 0) {
      throw new Error('No streaming records found inside the uploaded zip archive.');
    }

    return dedupeRecords(allRecords);
  } catch (cause) {
    throw new Error(
      `Zip error: ${cause instanceof Error ? cause.message : cause}`,
    );
  }
}

export async function parseJsonFiles(files: File[]): Promise<RawRecord[]> {
  const records: RawRecord[] = [];

  for (const file of files) {
    const text = await file.text();
    const parsed = JSON.parse(text) as RawRecord[] | RawRecord;

    if (Array.isArray(parsed)) {
      for (const record of parsed) {
        records.push(normalizeRawRecord(record));
      }
    } else {
      records.push(normalizeRawRecord(parsed));
    }
  }

  return records;
}

function isTruthyFlag(value: boolean | string | null | undefined): boolean {
  return value === true || value === 'True' || value === 'true';
}

function classifyContent(row: RawRecord): ContentKind | null {
  if (row.audiobook_title || row.audiobook_uri) {
    return 'audiobook';
  }
  if (row.episode_name || row.episode_show_name) {
    return 'podcast';
  }
  if (row.master_metadata_track_name || row.trackName) {
    return 'music';
  }
  return null;
}

export function cleanRecords(raw: RawRecord[]): StreamRecord[] {
  const cleaned: StreamRecord[] = [];

  for (const row of raw) {
    const contentKind = classifyContent(row);
    if (!contentKind) {
      continue;
    }

    const trackName =
      contentKind === 'podcast'
        ? (row.episode_name ?? 'Unknown episode')
        : contentKind === 'audiobook'
          ? (row.audiobook_title ?? 'Unknown audiobook')
          : (row.master_metadata_track_name ?? row.trackName);

    if (!trackName) {
      continue;
    }

    const artistName =
      contentKind === 'podcast'
        ? (row.episode_show_name ?? row.master_metadata_album_artist_name ?? 'Unknown show')
        : contentKind === 'audiobook'
          ? 'Audiobook'
          : (row.master_metadata_album_artist_name ?? row.artistName ?? 'Unknown Artist');

    const tsValue = row.ts ?? row.endTime;
    if (!tsValue) {
      continue;
    }

    cleaned.push({
      ts: parseTimestamp(tsValue),
      trackName,
      artistName,
      albumName: row.master_metadata_album_album_name ?? row.albumName ?? 'Unknown Album',
      msPlayed: row.ms_played ?? row.msPlayed ?? 0,
      skipped: isTruthyFlag(row.skipped),
      incognito: isTruthyFlag(row.incognito_mode),
      reasonEnd: row.reason_end ?? '',
      contentKind,
    });
  }

  return dedupeRecords(cleaned);
}

function dedupeRecords(records: StreamRecord[]): StreamRecord[] {
  const seen = new Set<string>();
  const deduped: StreamRecord[] = [];

  for (const record of records) {
    const key = [
      record.ts.toISOString(),
      record.trackName,
      record.artistName,
      record.msPlayed,
    ].join('\0');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(record);
  }

  return deduped.sort((a, b) => a.ts.getTime() - b.ts.getTime());
}

export function songKey(trackName: string, artistName: string): string {
  return `${trackName}\0${artistName}`;
}

export function aggregateSongs(records: StreamRecord[]): Map<string, SongStats> {
  const map = new Map<string, SongStats>();

  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    const existing = map.get(key);

    if (existing) {
      existing.numPlays += 1;
      existing.totalMsPlayed += record.msPlayed;
      existing.totalHours = existing.totalMsPlayed / 3_600_000;
    } else {
      map.set(key, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }
  }

  return map;
}

export function aggregateArtists(records: StreamRecord[]): Map<string, ArtistStats> {
  const map = new Map<string, ArtistStats>();

  for (const record of records) {
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

  return map;
}

export function aggregateAlbums(records: StreamRecord[]): Map<string, AlbumStats> {
  const map = new Map<string, AlbumStats>();

  for (const record of records) {
    if (record.contentKind !== 'music') {
      continue;
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

  return map;
}

function sortSongs(items: SongStats[], sortBy: SortMetric): SongStats[] {
  if (sortBy === 'combined') {
    return buildCombinedSongs(items);
  }
  return [...items].sort((a, b) =>
    sortBy === 'plays' ? b.numPlays - a.numPlays : b.totalHours - a.totalHours,
  );
}

function sortArtists(items: ArtistStats[], sortBy: SortMetric): ArtistStats[] {
  if (sortBy === 'combined') {
    const maxPlays = Math.max(...items.map((item) => item.listenCount), 1);
    const maxHours = Math.max(...items.map((item) => item.totalHours), 1);
    return [...items]
      .map((item) => ({
        ...item,
        combinedScore:
          (item.listenCount / maxPlays) * 0.5 + (item.totalHours / maxHours) * 0.5,
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .map(({ combinedScore: _removed, ...item }) => item);
  }
  return [...items].sort((a, b) =>
    sortBy === 'plays' ? b.listenCount - a.listenCount : b.totalHours - a.totalHours,
  );
}

export function topSongs(
  map: Map<string, SongStats>,
  sortBy: SortMetric,
  limit: number,
): SongStats[] {
  return sortSongs([...map.values()], sortBy).slice(0, limit);
}

export function topArtists(
  map: Map<string, ArtistStats>,
  sortBy: SortMetric,
  limit: number,
): ArtistStats[] {
  return sortArtists([...map.values()], sortBy).slice(0, limit);
}

function sortAlbums(items: AlbumStats[], sortBy: SortMetric): AlbumStats[] {
  return [...items].sort((a, b) =>
    sortBy === 'plays' ? b.numPlays - a.numPlays : b.totalHours - a.totalHours,
  );
}

export function topAlbums(
  map: Map<string, AlbumStats>,
  sortBy: SortMetric,
  limit: number,
): AlbumStats[] {
  return sortAlbums([...map.values()], sortBy).slice(0, limit);
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

function topSongFromMap(songs: Map<string, SongStats>, metric: SortMetric): SongStats | undefined {
  return sortSongs([...songs.values()], metric === 'combined' ? 'plays' : metric)[0];
}

function buildYearTimeline(records: StreamRecord[], metric: SortMetric): TimelinePoint[] {
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

function buildDailyTimeline(records: StreamRecord[], metric: SortMetric): TimelinePoint[] {
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

function buildYearMonthTimeline(records: StreamRecord[]): TimelinePoint[] {
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

function buildMonthlyHistoryByYear(records: StreamRecord[]): YearSeries[] {
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

function buildMonthSeasonality(records: StreamRecord[], metric: SortMetric): TimelinePoint[] {
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

function buildDayOfMonthSeasonality(records: StreamRecord[]): TimelinePoint[] {
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

function buildHourDistribution(records: StreamRecord[]): TimelinePoint[] {
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

function buildTopByYear<T extends SongStats | ArtistStats | AlbumStats>(
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

function computeFutureMetrics(records: StreamRecord[]): {
  paceVsLastYear: string | null;
  beatRecord: string | null;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(currentYear, 0, 0).getTime()) / 86_400_000,
  );
  const daysLeft = Math.max(
    1,
    Math.floor((new Date(currentYear, 11, 31).getTime() - now.getTime()) / 86_400_000),
  );

  const playsByYear = new Map<number, number>();
  for (const record of records) {
    const year = record.ts.getUTCFullYear();
    playsByYear.set(year, (playsByYear.get(year) ?? 0) + 1);
  }

  const thisYearPlays = playsByYear.get(currentYear) ?? 0;
  const lastYearPlays = playsByYear.get(currentYear - 1) ?? 0;

  let paceVsLastYear: string | null = null;
  if (lastYearPlays > 0 && dayOfYear > 0) {
    const projected = (thisYearPlays / dayOfYear) * 365;
    if (projected < lastYearPlays) {
      const needed = Math.ceil((lastYearPlays - thisYearPlays) / daysLeft);
      paceVsLastYear = `${needed.toLocaleString()} plays/day to match ${currentYear - 1}`;
    } else {
      paceVsLastYear = `On pace to beat ${currentYear - 1} (${Math.round(projected).toLocaleString()} projected)`;
    }
  }

  let beatRecord: string | null = null;
  const yearlyTotals = [...playsByYear.entries()].filter(([year]) => year <= currentYear);
  if (yearlyTotals.length > 0) {
    const recordEntry = yearlyTotals.reduce((best, entry) => (entry[1] > best[1] ? entry : best));
    const recordTotal = recordEntry[0] === currentYear ? recordEntry[1] : recordEntry[1];
    const recordYear = recordEntry[0];

    if (recordYear !== currentYear || thisYearPlays < recordTotal) {
      const target = Math.max(recordTotal, recordEntry[1]);
      if (thisYearPlays < target) {
        const needed = Math.ceil((target - thisYearPlays) / daysLeft);
        beatRecord = `${needed.toLocaleString()} plays/day for ${daysLeft} days to beat your record (${target.toLocaleString()} in ${recordYear === currentYear ? 'prior peak' : recordYear})`;
      }
    }
  }

  return { paceVsLastYear, beatRecord };
}

function computeOverview(records: StreamRecord[]): OverviewStats {
  const totalMs = records.reduce((sum, record) => sum + record.msPlayed, 0);
  const uniqueSongs = new Set(records.map((record) => songKey(record.trackName, record.artistName)));
  const uniqueArtists = new Set(records.map((record) => record.artistName));

  const completedByDay = new Map<string, number>();
  const skippedByDay = new Map<string, number>();
  let completed = 0;
  let skipped = 0;

  for (const record of records) {
    const day = localDateKey(record.ts);

    if (record.reasonEnd === 'trackdone') {
      completed += 1;
      completedByDay.set(day, (completedByDay.get(day) ?? 0) + 1);
    }

    if (record.skipped) {
      skipped += 1;
      skippedByDay.set(day, (skippedByDay.get(day) ?? 0) + 1);
    }
  }

  let sessionCount = 0;
  let sessionTotalMs = records[0]?.msPlayed ?? 0;
  let currentSessionMs = records[0]?.msPlayed ?? 0;

  for (let index = 1; index < records.length; index += 1) {
    const gap = records[index].ts.getTime() - records[index - 1].ts.getTime();

    if (gap > SESSION_GAP_MS) {
      sessionCount += 1;
      sessionTotalMs += currentSessionMs;
      currentSessionMs = records[index].msPlayed;
    } else {
      currentSessionMs += records[index].msPlayed;
    }
  }

  if (records.length > 0) {
    sessionCount += 1;
    sessionTotalMs += currentSessionMs;
  }

  const hourCounts = new Map<number, number>();
  for (const record of records) {
    const hour = localHour(record.ts);
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  let peakHour = 0;
  let peakCount = -1;
  for (const [hour, count] of hourCounts.entries()) {
    if (count > peakCount) {
      peakHour = hour;
      peakCount = count;
    }
  }

  const dayCount = new Set(records.map((record) => localDateKey(record.ts))).size;
  const fallbackYear = new Date().getFullYear();
  const future = computeFutureMetrics(records);

  return {
    totalPlays: records.length,
    totalHours: totalMs / 3_600_000,
    uniqueSongs: uniqueSongs.size,
    uniqueArtists: uniqueArtists.size,
    earliest: records[0] ?? null,
    latest: records[records.length - 1] ?? null,
    yearMin: records[0]?.ts.getUTCFullYear() ?? fallbackYear,
    yearMax: records[records.length - 1]?.ts.getUTCFullYear() ?? fallbackYear,
    totalCompleted: completed,
    totalSkipped: skipped,
    avgCompletedPerDay:
      dayCount > 0
        ? [...completedByDay.values()].reduce((sum, value) => sum + value, 0) / dayCount
        : 0,
    avgSkippedPerDay:
      dayCount > 0
        ? [...skippedByDay.values()].reduce((sum, value) => sum + value, 0) / dayCount
        : 0,
    avgPlaysPerDay: dayCount > 0 ? records.length / dayCount : 0,
    skipToCompleteRatio: completed > 0 ? skipped / completed : 0,
    avgSessionSeconds: sessionCount > 0 ? sessionTotalMs / sessionCount / 1000 : 0,
    peakHourLabel: formatHourLabelLocal(peakHour),
    paceVsLastYear: future.paceVsLastYear,
    beatRecord: future.beatRecord,
  };
}

export function analyzeRecords(records: StreamRecord[], topN = 10): AnalysisResult {
  const songMap = aggregateSongs(records);
  const artistMap = aggregateArtists(records);
  const albumMap = aggregateAlbums(records);
  const allSongs = sortSongs([...songMap.values()], 'plays');
  const allArtists = sortArtists([...artistMap.values()], 'plays');
  const allAlbums = sortAlbums([...albumMap.values()], 'plays');
  const availableYears = [...new Set(records.map((record) => record.ts.getUTCFullYear()))].sort(
    (a, b) => a - b,
  );

  return {
    records,
    overview: computeOverview(records),
    insights: computeInsights(records),
    allSongs,
    allArtists,
    allAlbums,
    topSongsByPlays: topSongs(songMap, 'plays', topN),
    topSongsByTime: topSongs(songMap, 'time', topN),
    topArtistsByPlays: topArtists(artistMap, 'plays', topN),
    topArtistsByTime: topArtists(artistMap, 'time', topN),
    topAlbumsByPlays: topAlbums(albumMap, 'plays', topN),
    topAlbumsByTime: topAlbums(albumMap, 'time', topN),
    combinedSongs: topSongs(songMap, 'combined', topN),
    combinedArtists: topArtists(artistMap, 'combined', topN),
    playsByYear: buildYearTimeline(records, 'plays'),
    hoursByYear: buildYearTimeline(records, 'time'),
    playsByDate: buildDailyTimeline(records, 'plays'),
    hoursByDate: buildDailyTimeline(records, 'time'),
    playtimeByYearMonth: buildYearMonthTimeline(records),
    monthlyHistoryByYear: buildMonthlyHistoryByYear(records),
    playsByMonth: buildMonthSeasonality(records, 'plays'),
    hoursByMonth: buildMonthSeasonality(records, 'time'),
    playsByDayOfMonth: buildDayOfMonthSeasonality(records),
    playsByHour: buildHourDistribution(records),
    topSongsByYear: buildTopByYear(records, 'songs', 'plays', topN),
    topSongsByYearByTime: buildTopByYear(records, 'songs', 'time', topN),
    topArtistsByYear: buildTopByYear(records, 'artists', 'plays', topN),
    topArtistsByYearByTime: buildTopByYear(records, 'artists', 'time', topN),
    topAlbumsByYear: buildTopByYear(records, 'albums', 'plays', topN),
    topAlbumsByYearByTime: buildTopByYear(records, 'albums', 'time', topN),
    availableYears,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} hr`;
  }
  return `${(hours / 24).toFixed(1)} days`;
}

export async function loadRecordsFromFiles(files: File[]): Promise<StreamRecord[]> {
  const allRecords: StreamRecord[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const zipRecords = await loadRecordsFromZip(file);
      for (const record of zipRecords) {
        allRecords.push(record);
      }
    } else if (file.name.toLowerCase().endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text) as RawRecord[] | RawRecord;

      const rawRecords: RawRecord[] = [];
      if (Array.isArray(parsed)) {
        for (const record of parsed) {
          rawRecords.push(normalizeRawRecord(record));
        }
      } else {
        rawRecords.push(normalizeRawRecord(parsed));
      }

      const cleaned = cleanRecords(rawRecords);
      for (const record of cleaned) {
        allRecords.push(record);
      }
    }
  }

  const deduped = dedupeRecords(allRecords);

  if (deduped.length === 0) {
    throw new Error(
      'No streaming records found. Use Extended Streaming History JSON files (Streaming_History_*.json), legacy endTime exports, or a Spotify data zip archive.',
    );
  }

  return deduped;
}

/** @deprecated Use loadRecordsFromFiles + analyzeRecords instead */
export async function analyzeFiles(files: File[]): Promise<AnalysisResult> {
  const records = await loadRecordsFromFiles(files);
  return analyzeRecords(records);
}
