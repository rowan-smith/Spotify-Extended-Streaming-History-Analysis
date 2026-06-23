import { describe, it, expect } from 'vitest';
import {
  createDefaultFilters,
  applyPreset,
  getWrappedYear,
  filterRecords,
  countActiveFilters,
  shouldShowPaceMetrics,
  markCustomPreset,
  applyQuickYearRange,
  getFilterContext,
} from '../../analysis/src/analysis/filters';
import { DEFAULT_TOP_N, WRAPPED_TOP_N } from '../../analysis/src/analysis/filterPresets';
import type { FilterBounds, StreamRecord } from '../../analysis/src/types';

const bounds: FilterBounds = { yearMin: 2020, yearMax: 2024 };

function record(overrides: Partial<StreamRecord> = {}): StreamRecord {
  return {
    ts: new Date('2024-06-15T14:00:00Z'),
    trackName: 'Test Song',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    msPlayed: 120000,
    skipped: false,
    incognito: false,
    reasonEnd: 'trackdone',
    contentKind: 'music',
    ...overrides,
  };
}

describe('createDefaultFilters', () => {
  it('creates filters with default preset', () => {
    const filters = createDefaultFilters(2020, 2024);
    expect(filters.preset).toBe('default');
    expect(filters.yearFrom).toBe(2020);
    expect(filters.yearTo).toBe(2024);
    expect(filters.mode).toBe('basic');
    expect(filters.hideSkipped).toBe(true);
    expect(filters.includeMusic).toBe(true);
    expect(filters.includePodcasts).toBe(false);
  });
});

describe('applyPreset', () => {
  it('applies default preset', () => {
    const current = createDefaultFilters(2020, 2024);
    const result = applyPreset('default', current, bounds);
    expect(result.preset).toBe('default');
    expect(result.topN).toBe(DEFAULT_TOP_N);
  });

  it('applies wrapped preset', () => {
    const current = createDefaultFilters(2020, 2024);
    const result = applyPreset('wrapped', current, bounds);
    expect(result.preset).toBe('wrapped');
    expect(result.yearFrom).toBe(2024);
    expect(result.yearTo).toBe(2024);
    expect(result.includeMusic).toBe(true);
    expect(result.includePodcasts).toBe(false);
    expect(result.topN).toBe(WRAPPED_TOP_N);
  });

  it('marks custom preset without changes', () => {
    const current = createDefaultFilters(2020, 2024);
    const result = applyPreset('custom', current, bounds);
    expect(result.preset).toBe('custom');
  });
});

describe('getWrappedYear', () => {
  it('returns the latest year in the data', () => {
    expect(getWrappedYear(bounds)).toBe(2024);
  });

  it('returns yearMax when data spans a single year', () => {
    const singleYearBounds: FilterBounds = { yearMin: 2022, yearMax: 2022 };
    expect(getWrappedYear(singleYearBounds)).toBe(2022);
  });
});

describe('filterRecords', () => {
  it('passes through with default filters', () => {
    const filters = createDefaultFilters(2020, 2024);
    const records = [record()];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
  });

  it('filters out skipped records', () => {
    const filters = { ...createDefaultFilters(2020, 2024), hideSkipped: true };
    const records = [
      record({ skipped: false }),
      record({ skipped: true }),
    ];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].skipped).toBe(false);
  });

  it('filters out incognito records', () => {
    const filters = { ...createDefaultFilters(2020, 2024), excludeIncognito: true };
    const records = [
      record({ incognito: false }),
      record({ incognito: true }),
    ];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].incognito).toBe(false);
  });

  it('filters by content kind', () => {
    const filters = { ...createDefaultFilters(2020, 2024), includeMusic: false, includePodcasts: true };
    const records = [
      record({ contentKind: 'music' }),
      record({ contentKind: 'podcast' }),
    ];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].contentKind).toBe('podcast');
  });

  it('filters by minimum duration (inclusive)', () => {
    const filters = { ...createDefaultFilters(2020, 2024), minMsPlayed: 100000, minMsPlayedExclusive: false };
    const records = [
      record({ msPlayed: 100000 }),
      record({ msPlayed: 99999 }),
    ];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].msPlayed).toBe(100000);
  });

  it('filters by minimum duration (exclusive)', () => {
    const filters = { ...createDefaultFilters(2020, 2024), minMsPlayed: 100000, minMsPlayedExclusive: true };
    const records = [
      record({ msPlayed: 100000 }),
      record({ msPlayed: 100001 }),
    ];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].msPlayed).toBe(100001);
  });

  it('filters by year range', () => {
    const filters = { ...createDefaultFilters(2023, 2023) };
    const records = [
      record({ ts: new Date('2022-06-15') }),
      record({ ts: new Date('2023-06-15') }),
      record({ ts: new Date('2024-06-15') }),
    ];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].ts.getFullYear()).toBe(2023);
  });

  it('filters by search', () => {
    const filters = { ...createDefaultFilters(2020, 2024), search: 'UniqueSong' };
    const records = [
      record({ trackName: 'UniqueSong' }),
      record({ trackName: 'OtherSong' }),
    ];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].trackName).toBe('UniqueSong');
  });

  it('returns empty array when nothing matches', () => {
    const filters = { ...createDefaultFilters(2020, 2024), search: 'zzzNoMatch111' };
    const records = [record()];
    const result = filterRecords(records, filters);
    expect(result).toHaveLength(0);
  });
});

describe('countActiveFilters', () => {
  it('returns 0 for default preset with min/max bounds', () => {
    const filters = createDefaultFilters(2020, 2024);
    expect(countActiveFilters(filters, bounds)).toBe(0);
  });

  it('counts non-default preset', () => {
    const filters = { ...createDefaultFilters(2020, 2024), preset: 'wrapped' as const };
    expect(countActiveFilters(filters, bounds)).toBeGreaterThan(0);
  });
});

describe('shouldShowPaceMetrics', () => {
  it('returns true for current year range', () => {
    const currentYear = new Date().getFullYear();
    const filters = createDefaultFilters(currentYear, currentYear);
    expect(shouldShowPaceMetrics(filters)).toBe(true);
  });

  it('returns false for wrapped preset', () => {
    const currentYear = new Date().getFullYear();
    const filters = { ...createDefaultFilters(currentYear, currentYear), preset: 'wrapped' as const };
    expect(shouldShowPaceMetrics(filters)).toBe(false);
  });

  it('returns false for past years', () => {
    const filters = createDefaultFilters(2020, 2020);
    expect(shouldShowPaceMetrics(filters)).toBe(false);
  });
});

describe('markCustomPreset', () => {
  it('marks custom preset', () => {
    const filters = createDefaultFilters(2020, 2024);
    const result = markCustomPreset(filters);
    expect(result.preset).toBe('custom');
  });

  it('does not change already custom', () => {
    const filters = { ...createDefaultFilters(2020, 2024), preset: 'custom' as const };
    const result = markCustomPreset(filters);
    expect(result.preset).toBe('custom');
  });
});

describe('applyQuickYearRange', () => {
  it('wraps wrapped preset', () => {
    const filters = { ...createDefaultFilters(2020, 2024), preset: 'wrapped' as const };
    const result = applyQuickYearRange(filters, 2022, 2023);
    expect(result.yearFrom).toBe(2022);
    expect(result.yearTo).toBe(2023);
    expect(result.preset).toBe('wrapped');
  });

  it('wraps default preset', () => {
    const filters = createDefaultFilters(2020, 2024);
    const result = applyQuickYearRange(filters, 2021, 2022);
    expect(result.yearFrom).toBe(2021);
    expect(result.yearTo).toBe(2022);
    expect(result.preset).toBe('default');
  });

  it('marks custom when already custom', () => {
    const filters = { ...createDefaultFilters(2020, 2024), preset: 'custom' as const };
    const result = applyQuickYearRange(filters, 2023, 2023);
    expect(result.preset).toBe('custom');
  });
});

describe('getFilterContext', () => {
  it('detects single year', () => {
    const filters = createDefaultFilters(2023, 2023);
    const ctx = getFilterContext(filters);
    expect(ctx.singleYear).toBe(true);
    expect(ctx.multiYear).toBe(false);
    expect(ctx.spanLabel).toBe('2023');
  });

  it('detects multi year', () => {
    const filters = createDefaultFilters(2022, 2024);
    const ctx = getFilterContext(filters);
    expect(ctx.singleYear).toBe(false);
    expect(ctx.multiYear).toBe(true);
    expect(ctx.spanLabel).toBe('2022–2024');
  });
});
