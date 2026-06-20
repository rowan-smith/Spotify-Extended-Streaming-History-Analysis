import { TOP_N_OPTIONS, countActiveFilters, createDefaultFilters } from '../analysis/filters';
import type { AnalysisFilters } from '../types';

interface FilterBarProps {
  filters: AnalysisFilters;
  bounds: { yearMin: number; yearMax: number };
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

export function FilterBar({
  filters,
  bounds,
  filteredPlays,
  totalPlays,
  onChange,
}: FilterBarProps) {
  const years = yearOptions(bounds.yearMin, bounds.yearMax);
  const activeCount = countActiveFilters(filters, bounds);

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
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onChange(createDefaultFilters(bounds.yearMin, bounds.yearMax))}
        >
          Reset filters
        </button>
      </div>

      <div className="filter-bar__controls">
        <label className="filter-control">
          <span>From year</span>
          <select
            value={filters.yearFrom ?? bounds.yearMin}
            onChange={(event) =>
              onChange({ ...filters, yearFrom: Number(event.target.value) })
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
            onChange={(event) =>
              onChange({ ...filters, yearTo: Number(event.target.value) })
            }
          >
            {years.map((year) => (
              <option key={`to-${year}`} value={year}>
                {year}
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
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </label>

        <label className="filter-control">
          <span>Top results</span>
          <select
            value={filters.topN}
            onChange={(event) => onChange({ ...filters, topN: Number(event.target.value) })}
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
            onChange={(event) =>
              onChange({ ...filters, hideSkipped: event.target.checked })
            }
          />
          <span>Hide skipped plays</span>
        </label>
      </div>
    </section>
  );
}
