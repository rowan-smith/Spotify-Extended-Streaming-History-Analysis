import type { InsightFact, SongStats, StreamRecord } from '../types';
import { formatLocalDate } from '../utils/formatting';
import { songKey } from './aggregation';
import {
  computeBiggestBingeDay,
  computeBestDiscoveryDay,
  computeDiscoveryRate,
  computeLongestStreak,
  computeSeasonalFavorite,
  computeSkipRate,
} from './insightHelpers';

const WEEKDAY_PLURALS = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
];

export const SUMMARY_INSIGHT_PRIORITY = [
  'Most repeated track',
  'Biggest binge day',
  'Best discovery day',
  'Seasonal favorite',
] as const;

export function getSummaryInsights(insights: InsightFact[]): InsightFact[] {
  const picked: InsightFact[] = [];

  for (const title of SUMMARY_INSIGHT_PRIORITY) {
    const fact = insights.find((item) => item.title === title);
    if (fact) {
      picked.push(fact);
    }
    if (picked.length >= 4) {
      break;
    }
  }

  return picked;
}

function formatInsightDate(isoDate: string): string {
  return formatLocalDate(new Date(`${isoDate}T12:00:00`));
}

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
      detail: `${mostRepeated.trackName} · ${mostRepeated.artistName}`,
    });
  }

  const monthCounts = Array.from({ length: 12 }, () => 0);
  for (const record of records) {
    monthCounts[record.ts.getUTCMonth()] += 1;
  }
  const peakMonthIndex = monthCounts.indexOf(Math.max(...monthCounts));
  facts.push({
    title: 'Busiest month in range',
    value: MONTH_NAMES[peakMonthIndex],
    detail: `${monthCounts[peakMonthIndex].toLocaleString()} plays during ${MONTH_NAMES[peakMonthIndex]}.`,
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
    detail: `${weekdayCounts[peakWeekday].toLocaleString()} plays on ${WEEKDAY_PLURALS[peakWeekday]}.`,
  });

  const streaks = computeLongestStreak(records);
  if (streaks.days > 1) {
    facts.push({
      title: 'Longest listening streak',
      value: `${streaks.days} days`,
      detail: `${formatInsightDate(streaks.start)} – ${formatInsightDate(streaks.end)} · listened every day.`,
    });
  }

  const binge = computeBiggestBingeDay(records);
  if (binge) {
    facts.push({
      title: 'Biggest binge day',
      value: `${binge.plays.toLocaleString()} plays`,
      detail: `${formatInsightDate(binge.day)} · top track ${binge.topTrack}`,
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

  const bestDiscoveryDay = computeBestDiscoveryDay(records);
  if (bestDiscoveryDay) {
    facts.push({
      title: 'Best discovery day',
      value: `${bestDiscoveryDay.discoveries} new tracks`,
      detail: `${formatInsightDate(bestDiscoveryDay.day)} · first discovery was ${bestDiscoveryDay.topDiscovery}`,
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
