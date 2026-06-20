import {
  TOP_N_OPTIONS,
  MIN_DURATION_OPTIONS,
  applyPreset,
  countActiveFilters,
  createDefaultFilters,
  markCustomPreset,
} from '../analysis/filters';
import { FILTER_OPTION_INFO, FILTER_PRESET_INFO } from '../content/siteContent';
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

function yearOptions(min: number, max: number): number[] {
  const years: number[] = [];
  for (let year = min; year <= max; year += 1) {
    years.push(year);
  }
  return years;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function FilterBar({
  filters,
  bounds,
  filteredPlays,
  totalPlays,
  onChange,
}: FilterBarProps) {
  const years = yearOptions(bounds.yearMin, bounds.yearMax);
  const activeCount = countActiveFilters(filters, bounds);

  function update(next: AnalysisFilters) {
    onChange(next.preset === 'custom' ? next : markCustomPreset(next));
  }

  return (
    <section className="filter-bar" aria-label="Analysis filters">
      <div className="filter-bar__header">
        <div>
          <h2>Explore your data</h2>
          <p>
            Showing {filteredPlays.toLocaleString()} of {totalPlays.toLocaleString()} plays
            {activeCount > 0 ? ` · ${activeCount} filter${activeCount === 1 ? '' : 's'} active` : ''}
          </p>
        </div>
        <div className="filter-bar__header-actions">
          <button
            type="button"
            className={`button button--ghost${filters.mode === 'basic' ? ' button--toggle-active' : ''}`}
            onClick={() => onChange({ ...filters, mode: 'basic' })}
          >
            Basic
          </button>
          <button
            type="button"
            className={`button button--ghost${filters.mode === 'advanced' ? ' button--toggle-active' : ''}`}
            onClick={() => onChange({ ...filters, mode: 'advanced' })}
          >
            Advanced
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onChange(createDefaultFilters(bounds.yearMin, bounds.yearMax))}
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="filter-bar__presets">
        {(['default', 'wrapped', 'custom'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            className={`preset-chip${filters.preset === preset ? ' preset-chip--active' : ''}`}
            onClick={() =>
              onChange(
                preset === 'custom'
                  ? { ...filters, preset: 'custom' }
                  : applyPreset(preset, filters, bounds),
              )
            }
            title={FILTER_PRESET_INFO[preset]}
          >
            {preset === 'default' ? 'Default' : preset === 'wrapped' ? 'Wrapped-like' : 'Custom'}
            <InfoTooltip text={FILTER_PRESET_INFO[preset]} label={`${preset} preset`} />
          </button>
        ))}
      </div>

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

        {filters.mode === 'advanced' ? (
          <>
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
                onChange={(event) =>
                  update({ ...filters, includeMusic: event.target.checked })
                }
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
                checked={filters.combineRanking}
                onChange={(event) =>
                  update({ ...filters, combineRanking: event.target.checked })
                }
              />
              <span>
                Combined ranking (Explore)
                <InfoTooltip text={FILTER_OPTION_INFO.combineRanking} />
              </span>
            </label>
          </>
        ) : null}
      </div>
    </section>
  );
}
