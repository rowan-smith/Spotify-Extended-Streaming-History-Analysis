import type {
  AnalysisResult,
  ArtistStats,
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

export async function parseJsonFiles(files: File[]): Promise<RawRecord[]> {
  const records: RawRecord[] = [];

  for (const file of files) {
    const text = await file.text();
    const parsed = JSON.parse(text) as RawRecord[] | RawRecord;

    if (Array.isArray(parsed)) {
      for (const record of parsed) {
        records.push(record);
      }
    } else {
      records.push(parsed);
    }
  }

  return records;
}

function isTruthySkipped(value: RawRecord['skipped']): boolean {
  return value === true || value === 'True' || value === 'true';
}

export function cleanRecords(raw: RawRecord[]): StreamRecord[] {
  const cleaned: StreamRecord[] = [];

  for (const row of raw) {
    if (!row.master_metadata_track_name) {
      continue;
    }
    if (row.episode_name) {
      continue;
    }
    if (row.audiobook_title) {
      continue;
    }

    cleaned.push({
      ts: new Date(row.ts),
      trackName: row.master_metadata_track_name,
      artistName: row.master_metadata_album_artist_name ?? 'Unknown Artist',
      albumName: row.master_metadata_album_album_name ?? 'Unknown Album',
      msPlayed: row.ms_played,
      skipped: isTruthySkipped(row.skipped),
      reasonEnd: row.reason_end ?? '',
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

function sortSongs(items: SongStats[], sortBy: SortMetric): SongStats[] {
  return [...items].sort((a, b) =>
    sortBy === 'plays' ? b.numPlays - a.numPlays : b.totalHours - a.totalHours,
  );
}

function sortArtists(items: ArtistStats[], sortBy: SortMetric): ArtistStats[] {
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

function formatHourLabel(hour: number): string {
  const date = new Date(Date.UTC(2000, 0, 1, hour));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
    timeZone: 'UTC',
  });
}

function dateKey(ts: Date): string {
  return ts.toISOString().slice(0, 10);
}

function yearMonthKey(ts: Date): string {
  const year = ts.getUTCFullYear();
  const month = String(ts.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function topSongFromMap(songs: Map<string, SongStats>, metric: SortMetric): SongStats | undefined {
  return sortSongs([...songs.values()], metric)[0];
}

function buildYearTimeline(
  records: StreamRecord[],
  metric: SortMetric,
): TimelinePoint[] {
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
        topItem: topSong ? `${topSong.trackName} — ${topSong.artistName}` : undefined,
      };
    });
}

function buildDailyTimeline(
  records: StreamRecord[],
  metric: SortMetric,
): TimelinePoint[] {
  const dayMap = new Map<string, { value: number; songs: Map<string, SongStats> }>();

  for (const record of records) {
    const day = dateKey(record.ts);
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
        topItem: topSong ? `${topSong.trackName} — ${topSong.artistName}` : undefined,
      };
    });
}

function buildYearMonthTimeline(records: StreamRecord[]): TimelinePoint[] {
  const monthMap = new Map<string, { value: number; songs: Map<string, SongStats> }>();

  for (const record of records) {
    const key = yearMonthKey(record.ts);
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
        label: `${year} — ${MONTH_NAMES[Number(month) - 1]}`,
        sortKey: key,
        value: bucket.value,
        topItem: topSong ? `${topSong.trackName} — ${topSong.artistName}` : undefined,
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

function buildMonthSeasonality(
  records: StreamRecord[],
  metric: SortMetric,
): TimelinePoint[] {
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
      topItem: topSong ? `${topSong.trackName} — ${topSong.artistName}` : undefined,
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
      topItem: topSong ? `${topSong.trackName} — ${topSong.artistName}` : undefined,
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
    const bucket = counts[record.ts.getUTCHours()];
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
      label: formatHourLabel(bucket.hour),
      sortKey: bucket.hour,
      value: bucket.value,
      topItem: topSong ? `${topSong.trackName} — ${topSong.artistName}` : undefined,
    };
  });
}

function buildTopByYear<T extends SongStats | ArtistStats>(
  records: StreamRecord[],
  kind: 'songs' | 'artists',
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
    } else {
      result[year] = topArtists(aggregateArtists(yearRecords), sortBy, limit) as T[];
    }
  }

  return result;
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
    const day = dateKey(record.ts);

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
  let sessionTotalMs = 0;
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
    const hour = record.ts.getUTCHours();
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

  const dayCount = new Set(records.map((record) => dateKey(record.ts))).size;
  const fallbackYear = new Date().getUTCFullYear();

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
    skipToCompleteRatio: completed > 0 ? skipped / completed : 0,
    avgSessionSeconds: sessionCount > 0 ? sessionTotalMs / sessionCount / 1000 : 0,
    peakHourLabel: formatHourLabel(peakHour),
  };
}

export function analyzeRecords(records: StreamRecord[], topN = 10): AnalysisResult {
  const songMap = aggregateSongs(records);
  const artistMap = aggregateArtists(records);
  const availableYears = [...new Set(records.map((record) => record.ts.getUTCFullYear()))].sort(
    (a, b) => a - b,
  );

  return {
    records,
    overview: computeOverview(records),
    allSongs: sortSongs([...songMap.values()], 'plays'),
    allArtists: sortArtists([...artistMap.values()], 'plays'),
    topSongsByPlays: topSongs(songMap, 'plays', topN),
    topSongsByTime: topSongs(songMap, 'time', topN),
    topArtistsByPlays: topArtists(artistMap, 'plays', topN),
    topArtistsByTime: topArtists(artistMap, 'time', topN),
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
    availableYears,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
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
  const raw = await parseJsonFiles(files);
  const cleaned = cleanRecords(raw);

  if (cleaned.length === 0) {
    throw new Error(
      'No music streaming records found. Make sure you selected Extended Streaming History JSON files.',
    );
  }

  return cleaned;
}

/** @deprecated Use loadRecordsFromFiles + analyzeRecords instead */
export async function analyzeFiles(files: File[]): Promise<AnalysisResult> {
  const records = await loadRecordsFromFiles(files);
  return analyzeRecords(records);
}
