import { useState } from 'react';
import {
  TOP_N_OPTIONS,
  MIN_DURATION_OPTIONS,
  WRAPPED_CUTOFF_DAY,
  WRAPPED_CUTOFF_MONTH,
  applyPreset,
  applyQuickYearRange,
  countActiveFilters,
  createDefaultFilters,
  markCustomPreset,
} from '../analysis/filters';
import {
  FILTER_OPTION_INFO,
  FILTER_PRESET_INFO,
  WRAPPED_LIMITATIONS,
} from '../content/siteContent';
import { monthName } from '../utils/formatting';
import type { AnalysisFilters, FilterBounds } from '../types';
import { InfoTooltip } from './InfoTooltip';

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
  for (let year = min; year <= max; year += 1) {
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
    <section className="filter-bar" aria-label="Analysis filters">
      <div className="filter-bar__header">
        <h2>Explore your data</h2>
        <p className="filter-bar__status">
          Showing {filteredPlays.toLocaleString()} of {totalPlays.toLocaleString()} plays
          {filters.preset === 'custom' ? ' · Custom filters' : null}
          {activeCount > 0
            ? ` · ${activeCount} active filter${activeCount === 1 ? '' : 's'}`
            : null}
        </p>
      </div>

      <div className="filter-bar__quick">
        <div className="filter-bar__quick-group" role="group" aria-label="Filter preset">
          {(['default', 'wrapped'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              className={`preset-chip${filters.preset === preset ? ' preset-chip--active' : ''}`}
              onClick={() => onChange(applyPreset(preset, filters, bounds))}
              title={FILTER_PRESET_INFO[preset]}
            >
              {preset === 'default' ? 'Default' : 'Wrapped'}
              <InfoTooltip text={FILTER_PRESET_INFO[preset]} label={`${preset} preset`} />
            </button>
          ))}
        </div>

        <span className="filter-bar__quick-divider" aria-hidden="true" />

        <label className="filter-bar__year">
          <span className="filter-bar__year-label">Year</span>
          <select
            className="filter-bar__year-select"
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
          </select>
        </label>

        <div className="filter-bar__quick-actions">
          <button
            type="button"
            className="button button--ghost filter-bar__reset"
            onClick={() => onChange(createDefaultFilters(bounds.yearMin, bounds.yearMax))}
          >
            Reset
          </button>
          <button
            type="button"
            className={`filter-bar__advanced-toggle${advancedOpen ? ' filter-bar__advanced-toggle--open' : ''}`}
            onClick={toggleAdvanced}
            aria-expanded={advancedOpen}
          >
            Advanced
            {advancedActiveCount > 0 && !advancedOpen ? (
              <span className="filter-bar__advanced-badge">{advancedActiveCount}</span>
            ) : null}
          </button>
        </div>
      </div>

      {filters.preset === 'wrapped' ? (
        <div className="filter-bar__preset-note">
          <p>
            Jan 1–{monthName(WRAPPED_CUTOFF_MONTH)} {WRAPPED_CUTOFF_DAY}
            {wrappedYearLabel(filters, bounds)}
            {' · ranked by plays · private sessions excluded'}
          </p>
          <p className="filter-bar__preset-footnote">{WRAPPED_LIMITATIONS}</p>
        </div>
      ) : null}

      {advancedOpen ? (
        <div className="filter-bar__advanced">
          <div className="filter-bar__controls">
            <label className="filter-control">
              <span>From year</span>
              <select
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
              </select>
            </label>

            <label className="filter-control">
              <span>To year</span>
              <select
                value={filters.yearTo ?? bounds.yearMax}
                onChange={(event) => update({ ...filters, yearTo: Number(event.target.value) })}
              >
                {years.map((year) => (
                  <option key={`to-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-control">
              <span>
                From month
                <InfoTooltip text={FILTER_OPTION_INFO.monthFrom} />
              </span>
              <select
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
              </select>
            </label>

            <label className="filter-control">
              <span>
                To month
                <InfoTooltip text={FILTER_OPTION_INFO.monthTo} />
              </span>
              <select
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
              </select>
            </label>

            <label className="filter-control filter-control--grow">
              <span>Search track, artist, or album</span>
              <input
                type="search"
                value={filters.search}
                placeholder="Start typing to filter…"
                onChange={(event) => update({ ...filters, search: event.target.value })}
              />
            </label>

            <label className="filter-control">
              <span>Top results</span>
              <select
                value={filters.topN}
                onChange={(event) => update({ ...filters, topN: Number(event.target.value) })}
              >
                {TOP_N_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    Top {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-control filter-control--checkbox">
              <input
                type="checkbox"
                checked={filters.hideSkipped}
                onChange={(event) => update({ ...filters, hideSkipped: event.target.checked })}
              />
              <span>
                Hide skipped plays
                <InfoTooltip text={FILTER_OPTION_INFO.hideSkipped} />
              </span>
            </label>

            <label className="filter-control">
              <span>
                Min listen duration
                <InfoTooltip text={FILTER_OPTION_INFO.minDuration} />
              </span>
              <select
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
              </select>
            </label>

            <label className="filter-control filter-control--checkbox">
              <input
                type="checkbox"
                checked={filters.includeMusic}
                onChange={(event) => update({ ...filters, includeMusic: event.target.checked })}
              />
              <span>
                Music
                <InfoTooltip text={FILTER_OPTION_INFO.includeMusic} />
              </span>
            </label>

            <label className="filter-control filter-control--checkbox">
              <input
                type="checkbox"
                checked={filters.includePodcasts}
                onChange={(event) =>
                  update({ ...filters, includePodcasts: event.target.checked })
                }
              />
              <span>
                Podcasts
                <InfoTooltip text={FILTER_OPTION_INFO.includePodcasts} />
              </span>
            </label>

            <label className="filter-control filter-control--checkbox">
              <input
                type="checkbox"
                checked={filters.includeAudiobooks}
                onChange={(event) =>
                  update({ ...filters, includeAudiobooks: event.target.checked })
                }
              />
              <span>
                Audiobooks
                <InfoTooltip text={FILTER_OPTION_INFO.includeAudiobooks} />
              </span>
            </label>

            <label className="filter-control filter-control--checkbox">
              <input
                type="checkbox"
                checked={filters.excludeIncognito}
                onChange={(event) =>
                  update({ ...filters, excludeIncognito: event.target.checked })
                }
              />
              <span>
                Exclude private sessions
                <InfoTooltip text={FILTER_OPTION_INFO.excludeIncognito} />
              </span>
            </label>

            <label className="filter-control filter-control--checkbox">
              <input
                type="checkbox"
                checked={filters.combineRanking}
                onChange={(event) =>
                  update({ ...filters, combineRanking: event.target.checked })
                }
              />
              <span>
                Combined ranking (Browse)
                <InfoTooltip text={FILTER_OPTION_INFO.combineRanking} />
              </span>
            </label>
          </div>
        </div>
      ) : null}
    </section>
  );
}
