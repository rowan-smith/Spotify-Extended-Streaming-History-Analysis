import type { OverviewStats, StreamRecord } from '../types';
import { formatHourLabelLocal } from '../utils/formatting';

export const SESSION_GAP_MS = 30 * 60 * 1000;

function localDateKey(ts: Date): string {
  const year = ts.getFullYear();
  const month = String(ts.getMonth() + 1).padStart(2, '0');
  const day = String(ts.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localHour(ts: Date): number {
  return ts.getHours();
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

export function computeOverview(records: StreamRecord[]): OverviewStats {
  const totalMs = records.reduce((sum, record) => sum + record.msPlayed, 0);
  const uniqueSongs = new Set(records.map((record) => `${record.trackName}\0${record.artistName}`));
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
