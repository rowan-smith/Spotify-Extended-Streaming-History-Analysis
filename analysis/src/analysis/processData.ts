import JSZip from 'jszip';
import { computeInsights } from './insights';
import { computeSongMetrics, computeArtistMetrics, computeAlbumMetrics } from './domainMetrics';
import {
  buildDiscoveryDays,
  buildDiscoveryHistory,
  buildDayOfWeekDistribution,
  buildSkipRankings,
} from './exploration';
import { normalizeRawRecord, parseTimestamp } from './normalizeRecord';
import { sortSongs, sortArtists, sortAlbums, topSongs, topArtists, topAlbums, aggregateSongs, aggregateArtists, aggregateAlbums } from './aggregation';
import { computeOverview } from './overview';
import { buildYearTimeline, buildDailyTimeline, buildYearMonthTimeline, buildMonthlyHistoryByYear, buildMonthSeasonality, buildDayOfMonthSeasonality, buildHourDistribution, buildTopByYear } from './timeline';
import type {
  AnalysisResult,
  ContentKind,
  RawRecord,
  StreamRecord,
} from '../types';

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

export function analyzeRecords(
  records: StreamRecord[],
  topN = 10,
  skipSourceRecords?: StreamRecord[],
): AnalysisResult {
  const songMap = aggregateSongs(records);
  const artistMap = aggregateArtists(records);
  const albumMap = aggregateAlbums(records);
  const allSongs = sortSongs([...songMap.values()], 'plays');
  const allArtists = sortArtists([...artistMap.values()], 'plays');
  const allAlbums = sortAlbums([...albumMap.values()], 'plays');
  const availableYears = [...new Set(records.map((record) => record.ts.getUTCFullYear()))].sort(
    (a, b) => a - b,
  );
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
    playsByDayOfWeek: buildDayOfWeekDistribution(records),
    mostSkippedSongs: skipRankings.mostSkipped,
    leastSkippedSongs: skipRankings.leastSkipped,
    discoveryHistory: buildDiscoveryHistory(records),
    discoveryDays: buildDiscoveryDays(records, topN),
    topSongsByYear: buildTopByYear(records, 'songs', 'plays', topN),
    topSongsByYearByTime: buildTopByYear(records, 'songs', 'time', topN),
    topArtistsByYear: buildTopByYear(records, 'artists', 'plays', topN),
    topArtistsByYearByTime: buildTopByYear(records, 'artists', 'time', topN),
    topAlbumsByYear: buildTopByYear(records, 'albums', 'plays', topN),
    topAlbumsByYearByTime: buildTopByYear(records, 'albums', 'time', topN),
    availableYears,
  };
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
