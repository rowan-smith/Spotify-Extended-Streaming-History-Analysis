import JSZip from 'jszip';
import { computeInsights } from './insights';
import { computeSongMetrics, computeArtistMetrics, computeAlbumMetrics } from './domainMetrics';
import {
  buildDiscoveryDays,
  buildDiscoveryHistory,
  buildSkipRankings,
} from './exploration';
import { normalizeRawRecord, parseTimestamp } from './normalizeRecord';
import { sortSongs, sortArtists, sortAlbums, topSongs, topArtists, topAlbums } from './aggregation';
import { computeOverview } from './overview';
import {
  aggregationMapsFromRecords,
  emptyRecordScan,
  hoursByDateFromScan,
  hoursByMonthFromScan,
  hoursByYearFromScan,
  monthlyHistoryByYearFromScan,
  playtimeByYearMonthFromScan,
  playsByDateFromScan,
  playsByDayOfMonthFromScan,
  playsByDayOfWeekFromScan,
  playsByHourFromScan,
  playsByMonthFromScan,
  playsByYearFromScan,
  scanRecords,
  topAlbumsByYearFromScan,
  topArtistsByYearFromScan,
  topSongsByYearFromScan,
} from './recordScan';
import type {
  AnalysisResult,
  ContentKind,
  RawRecord,
  StreamRecord,
} from '../types';

export interface LoadProgress {
  phase: 'reading' | 'parsing' | 'cleaning' | 'deduping' | 'done';
  message: string;
  current?: number;
  total?: number;
}

function reportProgress(
  onProgress: ((progress: LoadProgress) => void) | undefined,
  progress: LoadProgress,
) {
  onProgress?.(progress);
}

function rawRecordsFromParsed(parsed: RawRecord[] | RawRecord): RawRecord[] {
  if (Array.isArray(parsed)) {
    return parsed.map((record) => normalizeRawRecord(record));
  }
  return [normalizeRawRecord(parsed)];
}

async function loadRecordsFromZip(
  file: File,
  onProgress?: (progress: LoadProgress) => void,
): Promise<StreamRecord[]> {
  try {
    const zip = await JSZip.loadAsync(file);
    reportProgress(onProgress, {
      phase: 'reading',
      message: 'Reading zip archive…',
    });

    const filePaths = Object.keys(zip.files);
    const jsonPaths = filePaths.filter((p) => p.toLowerCase().endsWith('.json'));

    if (jsonPaths.length === 0) {
      throw new Error('No .json files found in the zip archive.');
    }

    let parsedCount = 0;
    const parsedFiles = await Promise.all(
      jsonPaths.map(async (path) => {
        const entry = zip.files[path];
        if (entry.dir) {
          return [] as StreamRecord[];
        }

        const text = await entry.async('string');
        const parsed = JSON.parse(text) as RawRecord[] | RawRecord;
        const cleaned = cleanRecords(rawRecordsFromParsed(parsed), { skipDedupe: true });
        parsedCount += 1;
        reportProgress(onProgress, {
          phase: 'parsing',
          message: `Parsed ${parsedCount} of ${jsonPaths.length} JSON files…`,
          current: parsedCount,
          total: jsonPaths.length,
        });
        return cleaned;
      }),
    );

    const allRecords = parsedFiles.flat();

    if (allRecords.length === 0) {
      throw new Error('No streaming records found inside the uploaded zip archive.');
    }

    return allRecords;
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

export function cleanRecords(
  raw: RawRecord[],
  options?: { skipDedupe?: boolean },
): StreamRecord[] {
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

  if (options?.skipDedupe) {
    return cleaned;
  }

  return dedupeRecords(cleaned);
}

export interface LoadedDataSummary {
  recordCount: number;
  yearMin: number;
  yearMax: number;
}

export function summarizeLoadedRecords(records: StreamRecord[]): LoadedDataSummary {
  const yearMin = records[0]?.ts.getUTCFullYear() ?? new Date().getFullYear();
  const yearMax = records[records.length - 1]?.ts.getUTCFullYear() ?? yearMin;
  return {
    recordCount: records.length,
    yearMin,
    yearMax,
  };
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

export function analyzeRecords(
  records: StreamRecord[],
  topN = 10,
  skipSourceRecords?: StreamRecord[],
): AnalysisResult {
  const scan = records.length > 0 ? scanRecords(records) : emptyRecordScan();
  const { songMap, artistMap, albumMap } =
    records.length > 0
      ? scan
      : aggregationMapsFromRecords(records);
  const allSongs = sortSongs([...songMap.values()], 'plays');
  const allArtists = sortArtists([...artistMap.values()], 'plays');
  const allAlbums = sortAlbums([...albumMap.values()], 'plays');
  const skipRecords = skipSourceRecords ?? records;
  const skipRankings = buildSkipRankings(skipRecords, topN);

  return {
    records,
    overview: computeOverview(records),
    insights: computeInsights(records),
    songMetrics: computeSongMetrics(records, allSongs),
    artistMetrics: computeArtistMetrics(records, allArtists),
    albumMetrics: computeAlbumMetrics(records, allAlbums),
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
    playsByYear: playsByYearFromScan(scan),
    hoursByYear: hoursByYearFromScan(scan),
    playsByDate: playsByDateFromScan(scan),
    hoursByDate: hoursByDateFromScan(scan),
    playtimeByYearMonth: playtimeByYearMonthFromScan(scan),
    monthlyHistoryByYear: monthlyHistoryByYearFromScan(scan),
    playsByMonth: playsByMonthFromScan(scan),
    hoursByMonth: hoursByMonthFromScan(scan),
    playsByDayOfMonth: playsByDayOfMonthFromScan(scan),
    playsByHour: playsByHourFromScan(scan),
    playsByDayOfWeek: playsByDayOfWeekFromScan(scan),
    mostSkippedSongs: skipRankings.mostSkipped,
    leastSkippedSongs: skipRankings.leastSkipped,
    discoveryHistory: buildDiscoveryHistory(records),
    discoveryDays: buildDiscoveryDays(records, topN),
    topSongsByYear: topSongsByYearFromScan(scan, 'plays', topN),
    topSongsByYearByTime: topSongsByYearFromScan(scan, 'time', topN),
    topArtistsByYear: topArtistsByYearFromScan(scan, 'plays', topN),
    topArtistsByYearByTime: topArtistsByYearFromScan(scan, 'time', topN),
    topAlbumsByYear: topAlbumsByYearFromScan(scan, 'plays', topN),
    topAlbumsByYearByTime: topAlbumsByYearFromScan(scan, 'time', topN),
    availableYears: scan.availableYears,
  };
}

export async function loadRecordsFromFiles(
  files: File[],
  onProgress?: (progress: LoadProgress) => void,
): Promise<StreamRecord[]> {
  reportProgress(onProgress, {
    phase: 'reading',
    message: `Reading ${files.length} file${files.length === 1 ? '' : 's'}…`,
    current: 0,
    total: files.length,
  });

  let readCount = 0;
  const batches = await Promise.all(
    files.map(async (file) => {
      let batch: StreamRecord[] = [];

      if (file.name.toLowerCase().endsWith('.zip')) {
        batch = await loadRecordsFromZip(file, onProgress);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text) as RawRecord[] | RawRecord;
        batch = cleanRecords(rawRecordsFromParsed(parsed), { skipDedupe: true });
      }

      readCount += 1;
      reportProgress(onProgress, {
        phase: 'reading',
        message: `Read ${readCount} of ${files.length} file${files.length === 1 ? '' : 's'}…`,
        current: readCount,
        total: files.length,
      });
      return batch;
    }),
  );

  reportProgress(onProgress, {
    phase: 'deduping',
    message: 'Deduplicating and sorting plays…',
  });

  const deduped = dedupeRecords(batches.flat());

  if (deduped.length === 0) {
    throw new Error(
      'No streaming records found. Use Extended Streaming History JSON files (Streaming_History_*.json), legacy endTime exports, or a Spotify data zip archive.',
    );
  }

  reportProgress(onProgress, {
    phase: 'done',
    message: `Loaded ${deduped.length.toLocaleString()} plays.`,
  });

  return deduped;
}

/** @deprecated Use loadRecordsFromFiles + analyzeRecords instead */
export async function analyzeFiles(files: File[]): Promise<AnalysisResult> {
  const records = await loadRecordsFromFiles(files);
  return analyzeRecords(records);
}
