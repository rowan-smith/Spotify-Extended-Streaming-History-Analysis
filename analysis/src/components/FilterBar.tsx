import { useState } from 'react';
import {
  TOP_N_OPTIONS,
  MIN_DURATION_OPTIONS,
  WRAPPED_CUTOFF_DAY,
  WRAPPED_CUTOFF_MONTH,
} from '../analysis/filterPresets';
import {
  applyPreset,
  applyQuickYearRange,
  countActiveFilters,
  createDefaultFilters,
  markCustomPreset,
} from '../analysis/filters';
import {
  FILTER_OPTION_INFO,
  FILTER_PRESET_INFO,
  SPOTIFY_NEWSROOM_WRAPPED,
  WRAPPED_LIMITATIONS,
} from '../content/siteContent';
import { monthName } from '../utils/formatting';
import type { AnalysisFilters, FilterBounds } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: AnalysisFilters;
  bounds: FilterBounds;
  filteredPlays: number;
  totalPlays: number;
  onChange: (filters: AnalysisFilters) => void;
}

const ADVANCED_STORAGE_KEY = 'filter-bar-advanced-open';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

function yearOptions(min: number, max: number): number[] {
  const years: number[] = [];
  for (let year = max; year >= min; year -= 1) {
    years.push(year);
  }
  return years;
}

function readAdvancedOpen(): boolean {
  return sessionStorage.getItem(ADVANCED_STORAGE_KEY) === 'true';
}

function quickYearValue(
  filters: AnalysisFilters,
  bounds: FilterBounds,
): 'all' | 'custom' | string {
  const from = filters.yearFrom ?? bounds.yearMin;
  const to = filters.yearTo ?? bounds.yearMax;

  if (from === bounds.yearMin && to === bounds.yearMax) {
    return 'all';
  }
  if (from === to) {
    return String(from);
  }
  return 'custom';
}

function wrappedYearLabel(filters: AnalysisFilters, bounds: FilterBounds): string {
  const from = filters.yearFrom ?? bounds.yearMin;
  const to = filters.yearTo ?? bounds.yearMax;

  if (from === to) {
    return `, ${from}`;
  }

  return ` (${from}–${to})`;
}

export function FilterBar({
  filters,
  bounds,
  filteredPlays,
  totalPlays,
  onChange,
}: FilterBarProps) {
  const years = yearOptions(bounds.yearMin, bounds.yearMax);
  const activeCount = countActiveFilters(filters, bounds);
  const [advancedOpen, setAdvancedOpen] = useState(readAdvancedOpen);
  const yearValue = quickYearValue(filters, bounds);
  const advancedActiveCount = Math.max(0, activeCount - (filters.preset !== 'default' ? 1 : 0));

  function update(next: AnalysisFilters) {
    onChange(next.preset === 'custom' ? next : markCustomPreset(next));
  }

  function toggleAdvanced() {
    setAdvancedOpen((value) => {
      const next = !value;
      sessionStorage.setItem(ADVANCED_STORAGE_KEY, String(next));
      return next;
    });
  }

  function setQuickYear(value: string) {
    if (value === 'all') {
      onChange(applyQuickYearRange(filters, bounds.yearMin, bounds.yearMax));
      return;
    }
    if (value === 'custom') {
      setAdvancedOpen(true);
      sessionStorage.setItem(ADVANCED_STORAGE_KEY, 'true');
      return;
    }

    const year = Number(value);
    onChange(applyQuickYearRange(filters, year, year));
  }

  return (
    <section className="mb-4" aria-label="Analysis filters">
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 mb-3">
        <h2 className="text-lg font-semibold">Explore your data</h2>
        <p className="text-xs text-muted-foreground">
          Showing {filteredPlays.toLocaleString()} of {totalPlays.toLocaleString()} plays
          {filters.preset === 'custom' ? ' · Custom filters' : null}
          {activeCount > 0
            ? ` · ${activeCount} active filter${activeCount === 1 ? '' : 's'}`
            : null}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-3 sm:p-3">
        <h3 className="text-sm font-medium text-foreground mb-3">Filters</h3>

        <div className="sm:flex sm:flex-row sm:items-center sm:justify-between flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              value={[filters.preset]}
              onValueChange={(value) => {
                if (value.length > 0) onChange(applyPreset(value[0] as 'default' | 'wrapped', filters, bounds));
              }}
              aria-label="Filter preset"
            >
              {(['default', 'wrapped'] as const).map((preset) => (
                <ToggleGroupItem
                  key={preset}
                  value={preset}
                  className="h-10 sm:h-9 rounded-md text-xs"
                >
                  {preset === 'default' ? 'Default' : 'Wrapped'}
                  <InfoTooltip text={FILTER_PRESET_INFO[preset]} label={`${preset} preset`} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <span>Year</span>
              <Select
                value={yearValue}
                onChange={(event) => setQuickYear(event.target.value)}
                aria-label="Year selection"
              >
                <option value="all">
                  All years ({bounds.yearMin}–{bounds.yearMax})
                </option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                {yearValue === 'custom' ? <option value="custom">Custom range</option> : null}
              </Select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(createDefaultFilters(bounds.yearMin, bounds.yearMax))}
              className="bg-transparent border-none hover:bg-transparent underline-offset-4 hover:underline"
            >
              Reset
            </Button>
            <span className="w-px h-4 bg-border" aria-hidden="true" />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAdvanced}
              aria-expanded={advancedOpen}
              className="bg-transparent border-none hover:bg-transparent group"
            >
              <span className={cn('underline-offset-4 group-hover:underline', advancedOpen ? 'text-accent' : 'text-foreground')}>
                Advanced
              </span>
              <span className="text-xs ml-0.5">{advancedOpen ? '▴' : '▾'}</span>
              {advancedActiveCount > 0 && !advancedOpen ? (
                <Badge variant="accent">{advancedActiveCount}</Badge>
              ) : null}
            </Button>
          </div>
        </div>

        {advancedOpen ? (
          <>
            <hr className="my-3 border-border" />
            <h3 className="text-sm font-medium text-foreground mb-3">Advanced filters</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">From year</span>
                  <Select
                    value={filters.yearFrom ?? bounds.yearMin}
                    onChange={(event) =>
                      update({ ...filters, yearFrom: Number(event.target.value) })
                    }
                  >
                    {years.map((year) => (
                      <option key={`from-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">To year</span>
                  <Select
                    value={filters.yearTo ?? bounds.yearMax}
                    onChange={(event) => update({ ...filters, yearTo: Number(event.target.value) })}
                  >
                    {years.map((year) => (
                      <option key={`to-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    From month
                    <InfoTooltip text={FILTER_OPTION_INFO.monthFrom} />
                  </span>
                  <Select
                    value={filters.monthFrom ?? ''}
                    onChange={(event) =>
                      update({
                        ...filters,
                        monthFrom: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">Any</option>
                    {MONTH_OPTIONS.map((month) => (
                      <option key={`from-month-${month}`} value={month}>
                        {monthName(month)}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    To month
                    <InfoTooltip text={FILTER_OPTION_INFO.monthTo} />
                  </span>
                  <Select
                    value={filters.monthTo ?? ''}
                    onChange={(event) =>
                      update({
                        ...filters,
                        monthTo: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">Any</option>
                    {MONTH_OPTIONS.map((month) => (
                      <option key={`to-month-${month}`} value={month}>
                        {monthName(month)}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Search track, artist, or album</span>
                <Input
                  type="search"
                  className="h-8 px-2 text-xs"
                  value={filters.search}
                  placeholder="Start typing to filter…"
                  onChange={(event) => update({ ...filters, search: event.target.value })}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Top results</span>
                  <Select
                    value={filters.topN}
                    onChange={(event) => update({ ...filters, topN: Number(event.target.value) })}
                  >
                    {TOP_N_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        Top {value}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    Min listen duration
                    <InfoTooltip text={FILTER_OPTION_INFO.minDuration} />
                  </span>
                  <Select
                    value={filters.minMsPlayed}
                    onChange={(event) =>
                      update({ ...filters, minMsPlayed: Number(event.target.value) })
                    }
                  >
                    {MIN_DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={filters.hideSkipped}
                    onChange={(event) => update({ ...filters, hideSkipped: event.target.checked })}
                  />
                  <span className="flex items-center gap-1">
                    Hide skipped plays
                    <InfoTooltip text={FILTER_OPTION_INFO.hideSkipped} />
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={filters.includeMusic}
                    onChange={(event) => update({ ...filters, includeMusic: event.target.checked })}
                  />
                  <span className="flex items-center gap-1">
                    Music
                    <InfoTooltip text={FILTER_OPTION_INFO.includeMusic} />
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={filters.includePodcasts}
                    onChange={(event) =>
                      update({ ...filters, includePodcasts: event.target.checked })
                    }
                  />
                  <span className="flex items-center gap-1">
                    Podcasts
                    <InfoTooltip text={FILTER_OPTION_INFO.includePodcasts} />
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={filters.includeAudiobooks}
                    onChange={(event) =>
                      update({ ...filters, includeAudiobooks: event.target.checked })
                    }
                  />
                  <span className="flex items-center gap-1">
                    Audiobooks
                    <InfoTooltip text={FILTER_OPTION_INFO.includeAudiobooks} />
                  </span>
                </label>

              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <Checkbox
                  checked={filters.excludeIncognito}
                  onChange={(event) =>
                    update({ ...filters, excludeIncognito: event.target.checked })
                  }
                />
                <span className="flex items-center gap-1">
                  Exclude private sessions
                  <InfoTooltip text={FILTER_OPTION_INFO.excludeIncognito} />
                </span>
              </label>
            </div>
            </div>
          </>
        ) : null}
      </div>

      {filters.preset === 'wrapped' ? (
        <div className="mt-3 rounded-lg border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
          <p>
            Jan 1–{monthName(WRAPPED_CUTOFF_MONTH)} {WRAPPED_CUTOFF_DAY}
            {wrappedYearLabel(filters, bounds)}
            {' · ranked by plays · private sessions excluded'}
          </p>
          <p className="mt-1 leading-relaxed">{WRAPPED_LIMITATIONS} <a href={SPOTIFY_NEWSROOM_WRAPPED} target="_blank" rel="noreferrer">See more here.</a></p>
        </div>
      ) : null}
    </section>
  );
}
