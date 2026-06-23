import { useMemo, useState } from 'react';
import { buildSongMetricItems } from '../../analysis/metricDisplay';
import { PLAYS_VS_TIME_INFO } from '../../content/siteContent';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MetricTabs } from '../charts/MetricTabs';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { DataTable } from '../DataTable';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult } from '../../types';

interface SongsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showMultiYearCharts: boolean;
  theme: Theme;
  compact: boolean;
}

export function SongsTab({
  analysis,
  topNLabel,
  years,
  showMultiYearCharts,
  theme,
  compact,
}: SongsTabProps) {
  const [metric, setMetric] = useState<'plays' | 'time'>('plays');
  const songs = metric === 'plays' ? analysis.topSongsByPlays : analysis.topSongsByTime;
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);

  const songMetrics = useMemo(
    () => buildSongMetricItems(analysis.songMetrics),
    [analysis.songMetrics],
  );

  const title = `Top ${topNLabel} songs by ${metric === 'plays' ? 'plays' : 'playtime'}`;

  return (
    <div className="grid gap-6 min-w-0">
      <MetricGrid
        title="Song metrics"
        subtitle="Track-level patterns from your filtered history."
        metrics={songMetrics}
      />
      <MetricTabs
        active={metric}
        onChange={setMetric}
        playsInfo={PLAYS_VS_TIME_INFO.plays}
        timeInfo={PLAYS_VS_TIME_INFO.time}
      />
      <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted px-4 py-3">
        {metric === 'plays' ? PLAYS_VS_TIME_INFO.plays : PLAYS_VS_TIME_INFO.time}
      </p>

      <RankedBarChart
        title={title}
        subtitle={compact ? 'Ranked list optimised for smaller screens.' : undefined}
        labels={songs.map((song) => song.trackName)}
        values={songs.map((song) => (metric === 'plays' ? song.numPlays : song.totalHours))}
        hover={songs.map((song) =>
          metric === 'plays'
            ? `${song.artistName}<br>${formatHours(song.totalHours)} total`
            : `${song.artistName}<br>${song.numPlays.toLocaleString()} plays`,
        )}
        xTitle={metric === 'plays' ? 'Plays' : 'Hours'}
        theme={theme}
        compact={compact}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        chartZoomed={chartZoomed}
        onChartReset={resetChartView}
        plotRef={plotRef}
        onZoomChange={setChartZoomed}
        tableView={
          <DataTable
            rows={songs}
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
            searchPlaceholder="Search songs or artists…"
          />
        }
        gridView={
          <MobileRankedList
            metricLabel={metric === 'plays' ? 'Plays' : 'Hours'}
            items={songs.map((song) => ({
              primary: song.trackName,
              secondary: song.artistName,
              value: metric === 'plays' ? song.numPlays : song.totalHours,
              valueText:
                metric === 'plays'
                  ? song.numPlays.toLocaleString()
                  : formatHours(song.totalHours),
              meta:
                metric === 'plays'
                  ? `${formatHours(song.totalHours)} total`
                  : `${song.numPlays.toLocaleString()} plays`,
            }))}
          />
        }
      />

      {showMultiYearCharts ? (
        <YearDrilldownChart
          title="Top songs by year"
          years={years}
          dataByPlays={analysis.topSongsByYear}
          dataByTime={analysis.topSongsByYearByTime}
          labelKey="trackName"
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}
