import type { AnalysisFilters, StreamRecord } from '../types';

export const DEFAULT_TOP_N = 10;
export const TOP_N_OPTIONS = [10, 20, 50];

export function createDefaultFilters(yearMin: number, yearMax: number): AnalysisFilters {
  return {
    yearFrom: yearMin,
    yearTo: yearMax,
    search: '',
    topN: DEFAULT_TOP_N,
    hideSkipped: false,
  };
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

  return records.filter((record) => {
    const year = record.ts.getUTCFullYear();

    if (filters.yearFrom !== null && year < yearFrom) {
      return false;
    }
    if (filters.yearTo !== null && year > yearTo) {
      return false;
    }
    if (filters.hideSkipped && record.skipped) {
      return false;
    }
    if (search) {
      const haystack = `${record.trackName} ${record.artistName} ${record.albumName}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export function countActiveFilters(
  filters: AnalysisFilters,
  bounds: { yearMin: number; yearMax: number },
): number {
  let count = 0;

  if (filters.yearFrom !== null && filters.yearFrom !== bounds.yearMin) {
    count += 1;
  }
  if (filters.yearTo !== null && filters.yearTo !== bounds.yearMax) {
    count += 1;
  }
  if (filters.search.trim()) {
    count += 1;
  }
  if (filters.topN !== DEFAULT_TOP_N) {
    count += 1;
  }
  if (filters.hideSkipped) {
    count += 1;
  }

  return count;
}
