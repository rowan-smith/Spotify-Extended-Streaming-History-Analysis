import type { InsightFact, SongStats, StreamRecord } from '../types';
import { songKey } from './processData';

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

function dateKey(ts: Date): string {
  return ts.toISOString().slice(0, 10);
}

export function computeInsights(records: StreamRecord[]): InsightFact[] {
  if (records.length === 0) {
    return [];
  }

  const facts: InsightFact[] = [];

  const repeatMap = new Map<string, { count: number; trackName: string; artistName: string }>();
  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    const existing = repeatMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      repeatMap.set(key, {
        count: 1,
        trackName: record.trackName,
        artistName: record.artistName,
      });
    }
  }

  const mostRepeated = [...repeatMap.values()].sort((a, b) => b.count - a.count)[0];
  if (mostRepeated && mostRepeated.count > 1) {
    facts.push({
      title: 'Most repeated track',
      value: `${mostRepeated.count.toLocaleString()} plays`,
      detail: `${mostRepeated.trackName} — ${mostRepeated.artistName}`,
    });
  }

  const monthCounts = Array.from({ length: 12 }, () => 0);
  for (const record of records) {
    monthCounts[record.ts.getUTCMonth()] += 1;
  }
  const peakMonthIndex = monthCounts.indexOf(Math.max(...monthCounts));
  facts.push({
    title: 'Busiest month (all years)',
    value: MONTH_NAMES[peakMonthIndex],
    detail: `${monthCounts[peakMonthIndex].toLocaleString()} plays across every ${MONTH_NAMES[peakMonthIndex]} in your history.`,
  });

  const weekdayCounts = Array.from({ length: 7 }, () => 0);
  for (const record of records) {
    weekdayCounts[record.ts.getUTCDay()] += 1;
  }
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const peakWeekday = weekdayCounts.indexOf(Math.max(...weekdayCounts));
  facts.push({
    title: 'Favorite weekday',
    value: weekdayNames[peakWeekday],
    detail: `${weekdayCounts[peakWeekday].toLocaleString()} plays land on this day of the week.`,
  });

  const streaks = computeLongestStreak(records);
  if (streaks.days > 1) {
    facts.push({
      title: 'Longest listening streak',
      value: `${streaks.days} days`,
      detail: `From ${streaks.start} through ${streaks.end} with at least one play each day.`,
    });
  }

  const binge = computeBiggestBingeDay(records);
  if (binge) {
    facts.push({
      title: 'Biggest binge day',
      value: `${binge.plays.toLocaleString()} plays`,
      detail: `${binge.day} — top track: ${binge.topTrack}`,
    });
  }

  const seasonal = computeSeasonalFavorite(records);
  if (seasonal) {
    facts.push({
      title: 'Seasonal favorite',
      value: seasonal.trackName,
      detail: `Peaks in ${seasonal.season}: ${seasonal.plays.toLocaleString()} plays that season.`,
    });
  }

  const skipMood = computeSkipRate(records);
  facts.push({
    title: 'Skip mood',
    value: skipMood.label,
    detail: skipMood.detail,
  });

  const discovery = computeDiscoveryRate(repeatMap);
  facts.push({
    title: 'Discovery rate',
    value: `${discovery.toFixed(0)}% one-and-done`,
    detail: 'Share of unique tracks you only played once in this filtered set.',
  });

  return facts;
}

function computeLongestStreak(records: StreamRecord[]): {
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

function computeBiggestBingeDay(records: StreamRecord[]): {
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

function seasonForMonth(month: number): string {
  if (month <= 1 || month >= 11) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

function computeSeasonalFavorite(records: StreamRecord[]): {
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

function computeSkipRate(records: StreamRecord[]): { label: string; detail: string } {
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
      detail: `${(ratio * 100).toFixed(0)}% skip rate — you sample freely but still finish plenty.`,
    };
  }
  return {
    label: 'Restless curator',
    detail: `${(ratio * 100).toFixed(0)}% of plays were skips — lots of short auditions.`,
  };
}

function computeDiscoveryRate(
  repeatMap: Map<string, { count: number; trackName: string; artistName: string }>,
): number {
  const oneTimers = [...repeatMap.values()].filter((entry) => entry.count === 1).length;
  return repeatMap.size > 0 ? (oneTimers / repeatMap.size) * 100 : 0;
}

export function buildCombinedSongs(songs: SongStats[]): SongStats[] {
  if (songs.length === 0) {
    return [];
  }

  const maxPlays = Math.max(...songs.map((song) => song.numPlays), 1);
  const maxHours = Math.max(...songs.map((song) => song.totalHours), 1);

  return [...songs]
    .map((song) => ({
      song,
      score: (song.numPlays / maxPlays) * 0.5 + (song.totalHours / maxHours) * 0.5,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.song);
}
