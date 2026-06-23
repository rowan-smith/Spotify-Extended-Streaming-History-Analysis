import { songKey } from './aggregation';
import type {
  DiscoveryDayStats,
  DiscoveryEntry,
  SongSkipStats,
  StreamRecord,
  TimelinePoint,
} from '../types';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Minimum completed plays before a track can appear in least-skipped rankings. */
export const MIN_PLAYS_FOR_LEAST_SKIPPED = 3;

function localWeekday(ts: Date): number {
  return ts.getDay();
}

export function buildDayOfWeekDistribution(records: StreamRecord[]): TimelinePoint[] {
  const counts = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    value: 0,
    songs: new Map<string, { trackName: string; artistName: string; numPlays: number }>(),
  }));

  for (const record of records) {
    const bucket = counts[localWeekday(record.ts)];
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
      });
    }
  }

  return counts.map((bucket) => {
    const topSong = [...bucket.songs.values()].sort((a, b) => b.numPlays - a.numPlays)[0];
    return {
      label: WEEKDAY_NAMES[bucket.weekday],
      sortKey: bucket.weekday,
      value: bucket.value,
      topItem: topSong ? `${topSong.trackName} · ${topSong.artistName}` : undefined,
    };
  });
}

export function buildSkipRankings(
  records: StreamRecord[],
  limit: number,
): { mostSkipped: SongSkipStats[]; leastSkipped: SongSkipStats[] } {
  const map = new Map<
    string,
    { trackName: string; artistName: string; totalPlays: number; skipCount: number }
  >();

  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    const entry = map.get(key) ?? {
      trackName: record.trackName,
      artistName: record.artistName,
      totalPlays: 0,
      skipCount: 0,
    };
    entry.totalPlays += 1;
    if (record.skipped) {
      entry.skipCount += 1;
    }
    map.set(key, entry);
  }

  const stats: SongSkipStats[] = [...map.values()].map((entry) => ({
    trackName: entry.trackName,
    artistName: entry.artistName,
    totalPlays: entry.totalPlays,
    skipCount: entry.skipCount,
    skipRate: entry.totalPlays > 0 ? entry.skipCount / entry.totalPlays : 0,
  }));

  const mostSkipped = stats
    .filter((entry) => entry.skipCount > 0)
    .sort(
      (a, b) =>
        b.skipCount - a.skipCount ||
        b.skipRate - a.skipRate ||
        b.totalPlays - a.totalPlays,
    )
    .slice(0, limit);

  const leastSkipped = stats
    .filter(
      (entry) =>
        entry.totalPlays >= MIN_PLAYS_FOR_LEAST_SKIPPED && entry.skipCount < entry.totalPlays,
    )
    .sort(
      (a, b) =>
        a.skipRate - b.skipRate ||
        b.totalPlays - a.totalPlays ||
        a.skipCount - b.skipCount,
    )
    .slice(0, limit);

  return { mostSkipped, leastSkipped };
}

export function buildDiscoveryHistory(records: StreamRecord[]): DiscoveryEntry[] {
  const seen = new Set<string>();
  const discoveries: DiscoveryEntry[] = [];

  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    discoveries.push({
      trackName: record.trackName,
      artistName: record.artistName,
      discoveredAt: record.ts,
    });
  }

  return discoveries;
}

export function buildDiscoveryDays(records: StreamRecord[], limit: number): DiscoveryDayStats[] {
  const seen = new Set<string>();
  const discoveriesByDay = new Map<string, string[]>();

  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const day = record.ts.toISOString().slice(0, 10);
    const discoveries = discoveriesByDay.get(day) ?? [];
    discoveries.push(record.trackName);
    discoveriesByDay.set(day, discoveries);
  }

  return [...discoveriesByDay.entries()]
    .map(([day, tracks]) => ({
      day,
      discoveries: tracks.length,
      topDiscovery: tracks[0],
    }))
    .sort((a, b) => b.discoveries - a.discoveries || a.day.localeCompare(b.day))
    .slice(0, limit);
}
