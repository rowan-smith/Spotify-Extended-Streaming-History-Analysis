import type { AnalysisFilters, FilterBounds, FilterContext, StreamRecord } from '../types';

export const DEFAULT_TOP_N = 10;
export const TOP_N_OPTIONS = [10, 20, 50];
export const MIN_DURATION_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '30 seconds', value: 30_000 },
  { label: '1 minute', value: 60_000 },
];

const PRESET_DEFAULT = {
  hideSkipped: true,
  minMsPlayed: 30_000,
  includeMusic: true,
  includePodcasts: false,
  includeAudiobooks: false,
} as const;

const PRESET_WRAPPED = {
  hideSkipped: true,
  minMsPlayed: 30_000,
  includeMusic: true,
  includePodcasts: false,
  includeAudiobooks: false,
} as const;

export function createDefaultFilters(yearMin: number, yearMax: number): AnalysisFilters {
  return {
    preset: 'default',
    mode: 'basic',
    yearFrom: yearMin,
    yearTo: yearMax,
    monthFrom: null,
    monthTo: null,
    search: '',
    topN: DEFAULT_TOP_N,
    ...PRESET_DEFAULT,
    combineRanking: false,
  };
}

export function applyPreset(
  preset: AnalysisFilters['preset'],
  current: AnalysisFilters,
  bounds: FilterBounds,
): AnalysisFilters {
  if (preset === 'custom') {
    return { ...current, preset: 'custom' };
  }

  const presetValues = preset === 'wrapped' ? PRESET_WRAPPED : PRESET_DEFAULT;
  return {
    ...current,
    preset,
    ...presetValues,
    yearFrom: current.yearFrom ?? bounds.yearMin,
    yearTo: current.yearTo ?? bounds.yearMax,
  };
}

function recordMonthIndex(record: StreamRecord): number {
  return record.ts.getUTCFullYear() * 12 + record.ts.getUTCMonth();
}

function filterMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export function getFilterContext(filters: AnalysisFilters): FilterContext {
  const yearFrom = filters.yearFrom;
  const yearTo = filters.yearTo;
  const singleYear = yearFrom !== null && yearTo !== null && yearFrom === yearTo;
  const multiYear = yearFrom !== null && yearTo !== null && yearTo > yearFrom;

  let spanLabel = 'selected range';
  if (singleYear && filters.monthFrom && filters.monthTo) {
    spanLabel = `${yearFrom} (${filters.monthFrom}–${filters.monthTo})`;
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

  return records.filter((record) => {
    const year = record.ts.getUTCFullYear();
    const monthIndex = recordMonthIndex(record);

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
    if (filters.hideSkipped && record.skipped) {
      return false;
    }
    if (filters.minMsPlayed > 0 && record.msPlayed < filters.minMsPlayed) {
      return false;
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
  if (!filters.includeMusic || filters.includePodcasts || filters.includeAudiobooks) {
    count += 1;
  }
  if (filters.combineRanking) {
    count += 1;
  }

  return count;
}

export function markCustomPreset(filters: AnalysisFilters): AnalysisFilters {
  if (filters.preset === 'custom') {
    return filters;
  }
  return { ...filters, preset: 'custom' };
}
