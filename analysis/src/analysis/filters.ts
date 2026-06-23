import type {
  AnalysisFilters,
  FilterBounds,
  FilterContext,
  RankingMetric,
  StreamRecord,
} from '../types';
import {
  DEFAULT_TOP_N,
  PRESET_DEFAULT,
  PRESET_WRAPPED,
  WRAPPED_TOP_N,
} from './filterPresets';

/** Latest year present in the user's streaming history. */
export function getWrappedYear(bounds: FilterBounds): number {
  return bounds.yearMax;
}

export function buildWrappedFilters(bounds: FilterBounds, year: number): AnalysisFilters {
  const clampedYear = Math.max(bounds.yearMin, Math.min(bounds.yearMax, year));

  return {
    preset: 'custom',
    mode: 'basic',
    yearFrom: clampedYear,
    yearTo: clampedYear,
    search: '',
    rankingMetric: 'plays',
    ...PRESET_WRAPPED,
  };
}

export function createDefaultFilters(yearMin: number, yearMax: number): AnalysisFilters {
  return {
    preset: 'default',
    mode: 'basic',
    yearFrom: yearMin,
    yearTo: yearMax,
    search: '',
    topN: DEFAULT_TOP_N,
    ...PRESET_DEFAULT,
    combineRanking: false,
    rankingMetric: 'plays',
  };
}

export function effectiveRankingMetric(filters: AnalysisFilters): RankingMetric {
  return filters.rankingMetric;
}

export function applyPreset(
  preset: AnalysisFilters['preset'],
  current: AnalysisFilters,
  bounds: FilterBounds,
): AnalysisFilters {
  if (preset === 'custom') {
    return { ...current, preset: 'custom' };
  }

  return {
    ...current,
    preset: 'default',
    ...PRESET_DEFAULT,
    topN: current.topN === WRAPPED_TOP_N ? DEFAULT_TOP_N : current.topN,
    yearFrom: current.yearFrom ?? bounds.yearMin,
    yearTo: current.yearTo ?? bounds.yearMax,
  };
}

/** Update year range from the quick picker without dropping default preset rules. */
export function applyQuickYearRange(
  filters: AnalysisFilters,
  yearFrom: number,
  yearTo: number,
): AnalysisFilters {
  if (filters.preset === 'default') {
    return {
      ...filters,
      preset: 'default',
      ...PRESET_DEFAULT,
      topN: filters.topN === WRAPPED_TOP_N ? DEFAULT_TOP_N : filters.topN,
      yearFrom,
      yearTo,
    };
  }

  return {
    ...filters,
    preset: 'custom',
    yearFrom,
    yearTo,
  };
}

export function rankingsTopN(filters: AnalysisFilters): number {
  return filters.topN;
}

function recordMonthIndex(record: StreamRecord): number {
  return record.ts.getFullYear() * 12 + record.ts.getMonth();
}

function filterMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function recordDayIndex(record: StreamRecord): number {
  return (
    record.ts.getFullYear() * 372 +
    record.ts.getMonth() * 31 +
    record.ts.getDate()
  );
}

function filterDayIndex(year: number, month: number, day: number): number {
  return year * 372 + (month - 1) * 31 + day;
}

export function getFilterContext(filters: AnalysisFilters): FilterContext {
  const yearFrom = filters.yearFrom;
  const yearTo = filters.yearTo;
  const singleYear = yearFrom !== null && yearTo !== null && yearFrom === yearTo;
  const multiYear = yearFrom !== null && yearTo !== null && yearTo > yearFrom;

  let spanLabel = 'selected range';
  if (singleYear && filters.monthFrom && filters.monthTo) {
    const fromLabel = filters.dayFrom
      ? `${filters.monthFrom}/${filters.dayFrom}`
      : String(filters.monthFrom);
    const toLabel = filters.dayTo
      ? `${filters.monthTo}/${filters.dayTo}`
      : String(filters.monthTo);
    spanLabel = `${yearFrom} (${fromLabel}–${toLabel})`;
  } else if (singleYear) {
    spanLabel = String(yearFrom);
  } else if (yearFrom !== null && yearTo !== null) {
    spanLabel = `${yearFrom}–${yearTo}`;
  }

  return { singleYear, multiYear, spanLabel };
}

export function filterRecords(
  records: StreamRecord[],
  filters: AnalysisFilters,
): StreamRecord[] {
  const search = filters.search.trim().toLowerCase();
  const yearFrom = Math.min(
    filters.yearFrom ?? Number.NEGATIVE_INFINITY,
    filters.yearTo ?? Number.POSITIVE_INFINITY,
  );
  const yearTo = Math.max(
    filters.yearFrom ?? Number.NEGATIVE_INFINITY,
    filters.yearTo ?? Number.POSITIVE_INFINITY,
  );

  const monthFromIndex =
    filters.monthFrom !== null && filters.yearFrom !== null
      ? filterMonthIndex(filters.yearFrom, filters.monthFrom)
      : filters.yearFrom !== null
        ? filterMonthIndex(filters.yearFrom, 1)
        : null;
  const monthToIndex =
    filters.monthTo !== null && filters.yearTo !== null
      ? filterMonthIndex(filters.yearTo, filters.monthTo)
      : filters.yearTo !== null
        ? filterMonthIndex(filters.yearTo, 12)
        : null;

  const dayFromIndex =
    filters.dayFrom !== null && filters.monthFrom !== null && filters.yearFrom !== null
      ? filterDayIndex(filters.yearFrom, filters.monthFrom, filters.dayFrom)
      : null;
  const dayToIndex =
    filters.dayTo !== null && filters.monthTo !== null && filters.yearTo !== null
      ? filterDayIndex(filters.yearTo, filters.monthTo, filters.dayTo)
      : null;

  return records.filter((record) => {
    const year = record.ts.getFullYear();
    const monthIndex = recordMonthIndex(record);
    const dayIndex = recordDayIndex(record);

    if (filters.yearFrom !== null && year < yearFrom) {
      return false;
    }
    if (filters.yearTo !== null && year > yearTo) {
      return false;
    }
    if (monthFromIndex !== null && monthIndex < monthFromIndex) {
      return false;
    }
    if (monthToIndex !== null && monthIndex > monthToIndex) {
      return false;
    }
    if (dayFromIndex !== null && dayIndex < dayFromIndex) {
      return false;
    }
    if (dayToIndex !== null && dayIndex > dayToIndex) {
      return false;
    }
    if (filters.hideSkipped && record.skipped) {
      return false;
    }
    if (filters.excludeIncognito && record.incognito) {
      return false;
    }
    if (filters.minMsPlayed > 0) {
      const passesMinDuration = filters.minMsPlayedExclusive
        ? record.msPlayed > filters.minMsPlayed
        : record.msPlayed >= filters.minMsPlayed;
      if (!passesMinDuration) {
        return false;
      }
    }

    const kindAllowed =
      (record.contentKind === 'music' && filters.includeMusic) ||
      (record.contentKind === 'podcast' && filters.includePodcasts) ||
      (record.contentKind === 'audiobook' && filters.includeAudiobooks);

    if (!kindAllowed) {
      return false;
    }

    if (search) {
      const haystack =
        `${record.trackName} ${record.artistName} ${record.albumName}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export function countActiveFilters(
  filters: AnalysisFilters,
  bounds: FilterBounds,
): number {
  let count = 0;

  if (filters.preset !== 'default') {
    count += 1;
  }
  if (filters.yearFrom !== null && filters.yearFrom !== bounds.yearMin) {
    count += 1;
  }
  if (filters.yearTo !== null && filters.yearTo !== bounds.yearMax) {
    count += 1;
  }
  if (filters.monthFrom !== null || filters.monthTo !== null) {
    count += 1;
  }
  if (filters.dayFrom !== null || filters.dayTo !== null) {
    count += 1;
  }
  if (filters.search.trim()) {
    count += 1;
  }
  if (filters.topN !== DEFAULT_TOP_N) {
    count += 1;
  }
  if (filters.hideSkipped !== PRESET_DEFAULT.hideSkipped) {
    count += 1;
  }
  if (filters.minMsPlayed !== PRESET_DEFAULT.minMsPlayed) {
    count += 1;
  }
  if (filters.minMsPlayedExclusive !== PRESET_DEFAULT.minMsPlayedExclusive) {
    count += 1;
  }
  if (filters.excludeIncognito !== PRESET_DEFAULT.excludeIncognito) {
    count += 1;
  }
  if (!filters.includeMusic || filters.includePodcasts || filters.includeAudiobooks) {
    count += 1;
  }
  if (filters.combineRanking) {
    count += 1;
  }
  if (filters.rankingMetric !== 'plays') {
    count += 1;
  }

  return count;
}

export function shouldShowPaceMetrics(filters: AnalysisFilters): boolean {
  const currentYear = new Date().getFullYear();
  return filters.yearFrom === currentYear && filters.yearTo === currentYear;
}

/** Year-by-year #1 breakdowns only make sense across multiple calendar years. */
export function shouldShowYearlyTopBreakdown(
  filterContext: FilterContext,
  availableYears: number[],
): boolean {
  return !filterContext.singleYear && availableYears.length > 1;
}

export function markCustomPreset(filters: AnalysisFilters): AnalysisFilters {
  if (filters.preset === 'custom') {
    return filters;
  }
  return { ...filters, preset: 'custom' };
}
