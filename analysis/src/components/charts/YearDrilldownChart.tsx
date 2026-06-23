import { useState } from 'react';
import { PLAYS_VS_TIME_INFO } from '../../content/siteContent';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import type { AlbumStats, ArtistStats, SortMetric, SongStats } from '../../types';
import { Select } from '@/components/ui/select';
import { MetricTabs } from './MetricTabs';
import { MobileRankedList } from './MobileRankedList';
import { RankedBarPlot } from './RankedBarPlot';
import { VisualizationShell } from './VisualizationShell';
import { DataTable } from '../DataTable';
import { useVisualizationView } from '@/hooks/useVisualizationView';

interface YearDrilldownChartProps {
  title: string;
  years: number[];
  dataByPlays: Record<number, SongStats[] | ArtistStats[] | AlbumStats[]>;
  dataByTime: Record<number, SongStats[] | ArtistStats[] | AlbumStats[]>;
  labelKey: 'trackName' | 'artistName' | 'albumName';
  theme: Theme;
  compact: boolean;
}

export function YearDrilldownChart({
  title,
  years,
  dataByPlays,
  dataByTime,
  labelKey,
  theme,
  compact,
}: YearDrilldownChartProps) {
  const defaultYear = years[years.length - 1] ?? new Date().getFullYear();
  const [year, setYear] = useState(defaultYear);
  const [sortMetric, setSortMetric] = useState<SortMetric>('plays');
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);

  const rows = (sortMetric === 'plays' ? dataByPlays[year] : dataByTime[year]) ?? [];

  const labels = rows.map((row) => {
    if (labelKey === 'trackName') {
      return (row as SongStats).trackName;
    }
    if (labelKey === 'artistName') {
      return (row as ArtistStats).artistName;
    }
    return (row as AlbumStats).albumName;
  });

  const values = rows.map((row) => {
    if (sortMetric === 'plays') {
      return 'numPlays' in row ? row.numPlays : row.listenCount;
    }
    return row.totalHours;
  });

  const hover = rows.map((row) => {
    const label = (() => {
      if (labelKey === 'trackName') return (row as SongStats).trackName;
      if (labelKey === 'artistName') return (row as ArtistStats).artistName;
      return (row as AlbumStats).albumName;
    })();

    if (sortMetric === 'plays') {
      return `${label}<br>${formatHours(row.totalHours)} total`;
    }

    const plays = 'numPlays' in row ? row.numPlays : row.listenCount;
    return `${label}<br>${plays.toLocaleString()} plays`;
  });

  const mobileItems = rows.map((row) => {
    const primary = (() => {
      if (labelKey === 'trackName') return (row as SongStats).trackName;
      if (labelKey === 'artistName') return (row as ArtistStats).artistName;
      return (row as AlbumStats).albumName;
    })();

    const plays = 'numPlays' in row ? row.numPlays : row.listenCount;

    return {
      primary,
      value: sortMetric === 'plays' ? plays : row.totalHours,
      valueText:
        sortMetric === 'plays'
          ? plays.toLocaleString()
          : formatHours(row.totalHours),
      meta:
        sortMetric === 'plays'
          ? `${formatHours(row.totalHours)} total`
          : `${plays.toLocaleString()} plays`,
    };
  });

  return (
    <VisualizationShell
      title={title}
      subtitle="Pick a year and metric to explore yearly rankings."
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      chartZoomed={chartZoomed}
      onChartReset={resetChartView}
    >
      <MetricTabs
        active={sortMetric === 'time' ? 'time' : 'plays'}
        onChange={(value) => setSortMetric(value)}
        playsInfo={PLAYS_VS_TIME_INFO.plays}
        timeInfo={PLAYS_VS_TIME_INFO.time}
      />

      <div className="flex items-center gap-2 mt-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Year</span>
          <Select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {viewMode === 'chart' ? (
        <RankedBarPlot
          ref={plotRef}
          labels={labels}
          values={values}
          hover={hover}
          xTitle={sortMetric === 'plays' ? 'Plays' : 'Hours'}
          theme={theme}
          compact={compact}
          onZoomChange={setChartZoomed}
        />
      ) : null}

      {viewMode === 'grid' ? (
        <MobileRankedList
          metricLabel={sortMetric === 'plays' ? 'Plays' : 'Hours'}
          items={mobileItems}
        />
      ) : null}

      {viewMode === 'table' && labelKey === 'trackName' ? (
        <DataTable
          rows={rows as SongStats[]}
          rowKey={(row) => `${row.trackName}-${row.artistName}`}
          columns={[
            { key: 'trackName', label: 'Track' },
            { key: 'artistName', label: 'Artist' },
            { key: 'numPlays', label: 'Plays', align: 'right' },
            {
              key: 'totalHours',
              label: 'Playtime',
              align: 'right',
              render: (row) => formatHours(row.totalHours),
            },
          ]}
          searchPlaceholder="Search rankings…"
        />
      ) : null}
      {viewMode === 'table' && labelKey === 'artistName' ? (
        <DataTable
          rows={rows as ArtistStats[]}
          rowKey={(row) => row.artistName}
          columns={[
            { key: 'artistName', label: 'Artist' },
            { key: 'listenCount', label: 'Plays', align: 'right' },
            {
              key: 'totalHours',
              label: 'Playtime',
              align: 'right',
              render: (row) => formatHours(row.totalHours),
            },
          ]}
          searchPlaceholder="Search rankings…"
        />
      ) : null}
      {viewMode === 'table' && labelKey === 'albumName' ? (
        <DataTable
          rows={rows as AlbumStats[]}
          rowKey={(row) => `${row.albumName}-${row.artistName}`}
          columns={[
            { key: 'albumName', label: 'Album' },
            { key: 'artistName', label: 'Artist' },
            { key: 'numPlays', label: 'Plays', align: 'right' },
            {
              key: 'totalHours',
              label: 'Playtime',
              align: 'right',
              render: (row) => formatHours(row.totalHours),
            },
          ]}
          searchPlaceholder="Search rankings…"
        />
      ) : null}
    </VisualizationShell>
  );
}
