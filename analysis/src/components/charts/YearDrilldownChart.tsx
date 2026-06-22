import { useState } from 'react';
import Plot from '../../charts/Plot';
import {
  getPlotTheme,
  horizontalBarChart,
  rankedBarChartLayout,
} from '../../charts/plotHelpers';
import { PLAYS_VS_TIME_INFO } from '../../content/siteContent';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import type { AlbumStats, ArtistStats, SortMetric, SongStats } from '../../types';
import { Select } from '@/components/ui/select';
import { ChartCard } from './ChartCard';
import { MetricTabs } from './MetricTabs';
import { MobileRankedList } from './MobileRankedList';

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
  const [year, setYear] = useState(years[years.length - 1] ?? new Date().getFullYear());
  const [sortMetric, setSortMetric] = useState<SortMetric>('plays');
  const plotTheme = getPlotTheme(theme === 'dark');

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

  const chartLayout = rankedBarChartLayout(labels.length, compact);

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
    <ChartCard title={title} subtitle="Pick a year and metric to explore yearly rankings.">
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

      {compact ? (
        <MobileRankedList
          metricLabel={sortMetric === 'plays' ? 'Plays' : 'Hours'}
          items={mobileItems}
        />
      ) : (
        <Plot
          data={[
            horizontalBarChart(
              labels,
              values,
              hover,
              sortMetric === 'plays' ? 'Plays' : 'Hours',
              {
                inlineLabels: chartLayout.inlineLabels,
                accent: plotTheme.accent,
              },
            ),
          ]}
          layout={{
            ...plotTheme.layout,
            height: chartLayout.height,
            bargap: labels.length > 30 ? 0.08 : 0.15,
            xaxis: {
              title: { text: sortMetric === 'plays' ? 'Plays' : 'Hours' },
              gridcolor: plotTheme.grid,
            },
            yaxis: {
              automargin: !chartLayout.inlineLabels,
              showticklabels: !chartLayout.inlineLabels,
              tickfont: labels.length > 40 ? { size: 10 } : undefined,
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      )}
    </ChartCard>
  );
}
