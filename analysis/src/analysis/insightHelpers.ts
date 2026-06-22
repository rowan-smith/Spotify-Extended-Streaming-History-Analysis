import { songKey } from './aggregation';

function dateKey(ts: Date): string {
  return ts.toISOString().slice(0, 10);
}

function seasonForMonth(month: number): string {
  if (month <= 1 || month >= 11) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

export function computeLongestStreak(records: { ts: Date }[]): {
  days: number;
  start: string;
  end: string;
} {
  const days = [...new Set(records.map((record) => dateKey(record.ts)))].sort();
  let best = { days: 1, start: days[0] ?? '', end: days[0] ?? '' };
  let currentStart = days[0] ?? '';
  let currentLen = 1;

  for (let index = 1; index < days.length; index += 1) {
    const prev = new Date(`${days[index - 1]}T00:00:00Z`);
    const curr = new Date(`${days[index]}T00:00:00Z`);
    const diffDays = (curr.getTime() - prev.getTime()) / 86_400_000;

    if (diffDays === 1) {
      currentLen += 1;
      if (currentLen > best.days) {
        best = { days: currentLen, start: currentStart, end: days[index] };
      }
    } else {
      currentStart = days[index];
      currentLen = 1;
    }
  }

  return best;
}

export function computeBiggestBingeDay(records: { ts: Date; trackName: string; artistName: string }[]): {
  day: string;
  plays: number;
  topTrack: string;
} | null {
  const dayMap = new Map<string, Map<string, number>>();

  for (const record of records) {
    const day = dateKey(record.ts);
    const songs = dayMap.get(day) ?? new Map<string, number>();
    const key = songKey(record.trackName, record.artistName);
    songs.set(key, (songs.get(key) ?? 0) + 1);
    dayMap.set(day, songs);
  }

  let bestDay = '';
  let bestPlays = 0;
  let bestTrack = '';

  for (const [day, songs] of dayMap.entries()) {
    const plays = [...songs.values()].reduce((sum, value) => sum + value, 0);
    if (plays > bestPlays) {
      bestPlays = plays;
      bestDay = day;
      const topEntry = [...songs.entries()].sort((a, b) => b[1] - a[1])[0];
      bestTrack = topEntry?.[0].split('\0')[0] ?? 'Unknown';
    }
  }

  return bestPlays > 0 ? { day: bestDay, plays: bestPlays, topTrack: bestTrack } : null;
}

export function computeSeasonalFavorite(records: { ts: Date; trackName: string; artistName: string }[]): {
  trackName: string;
  season: string;
  plays: number;
} | null {
  const trackSeasons = new Map<string, Map<string, number>>();

  for (const record of records) {
    const season = seasonForMonth(record.ts.getUTCMonth());
    const key = songKey(record.trackName, record.artistName);
    const seasons = trackSeasons.get(key) ?? new Map<string, number>();
    seasons.set(season, (seasons.get(season) ?? 0) + 1);
    trackSeasons.set(key, seasons);
  }

  let best: { trackName: string; season: string; plays: number } | null = null;

  for (const [key, seasons] of trackSeasons.entries()) {
    for (const [season, plays] of seasons.entries()) {
      if (!best || plays > best.plays) {
        best = { trackName: key.split('\0')[0], season, plays };
      }
    }
  }

  return best;
}

export function computeBestDiscoveryDay(records: { ts: Date; trackName: string; artistName: string }[]): {
  day: string;
  discoveries: number;
  topDiscovery: string;
} | null {
  const seen = new Set<string>();
  const discoveriesByDay = new Map<string, string[]>();

  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    if (!seen.has(key)) {
      seen.add(key);
      const day = dateKey(record.ts);
      const discoveries = discoveriesByDay.get(day) ?? [];
      discoveries.push(record.trackName);
      discoveriesByDay.set(day, discoveries);
    }
  }

  let bestDay = '';
  let bestCount = 0;

  for (const [day, discoveries] of discoveriesByDay.entries()) {
    if (discoveries.length > bestCount) {
      bestCount = discoveries.length;
      bestDay = day;
    }
  }

  if (bestCount === 0) return null;

  const topDiscovery = discoveriesByDay.get(bestDay)![0];
  return { day: bestDay, discoveries: bestCount, topDiscovery };
}

export function computeSkipRate(records: { skipped: boolean }[]): { label: string; detail: string } {
  const skipped = records.filter((record) => record.skipped).length;
  const ratio = records.length > 0 ? skipped / records.length : 0;

  if (ratio < 0.15) {
    return {
      label: 'Committed listener',
      detail: `Only ${(ratio * 100).toFixed(0)}% of plays were skips in this range.`,
    };
  }
  if (ratio < 0.35) {
    return {
      label: 'Balanced explorer',
      detail: `${(ratio * 100).toFixed(0)}% skip rate. You sample freely but still finish plenty.`,
    };
  }
  return {
    label: 'Restless curator',
    detail: `${(ratio * 100).toFixed(0)}% of plays were skips. Lots of short auditions.`,
  };
}

export function computeDiscoveryRate(
  repeatMap: Map<string, { count: number; trackName: string; artistName: string }>,
): number {
  const oneTimers = [...repeatMap.values()].filter((entry) => entry.count === 1).length;
  return repeatMap.size > 0 ? (oneTimers / repeatMap.size) * 100 : 0;
}
