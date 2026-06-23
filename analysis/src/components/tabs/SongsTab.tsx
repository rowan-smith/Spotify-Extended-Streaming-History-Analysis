import { useMemo } from 'react';
import { buildSongMetricItems } from '../../analysis/metricDisplay';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { DataTable } from '../DataTable';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult, RankingMetric } from '../../types';

interface SongsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showYearlyTopBreakdown: boolean;
  spanLabel: string;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function SongsTab({
  analysis,
  topNLabel,
  years,
  showYearlyTopBreakdown,
  spanLabel,
  rankingMetric,
  theme,
  compact,
}: SongsTabProps) {
  const songs = rankingMetric === 'plays' ? analysis.topSongsByPlays : analysis.topSongsByTime;
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

  const title = `Top ${topNLabel} songs by ${rankingMetric === 'plays' ? 'plays' : 'playtime'}`;

  return (
    <div className="grid gap-6 min-w-0">
      <MetricGrid
        title="Song metrics"
        subtitle="Track-level patterns from your filtered history."
        metrics={songMetrics}
      />

      <RankedBarChart
        title={title}
        subtitle={compact ? 'Ranked list optimised for smaller screens.' : undefined}
        labels={songs.map((song) => song.trackName)}
        values={songs.map((song) => (rankingMetric === 'plays' ? song.numPlays : song.totalHours))}
        hover={songs.map((song) =>
          rankingMetric === 'plays'
            ? `${song.artistName}<br>${formatHours(song.totalHours)} total`
            : `${song.artistName}<br>${song.numPlays.toLocaleString()} plays`,
        )}
        xTitle={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
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
            metricLabel={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
            items={songs.map((song) => ({
              primary: song.trackName,
              secondary: song.artistName,
              value: rankingMetric === 'plays' ? song.numPlays : song.totalHours,
              valueText:
                rankingMetric === 'plays'
                  ? song.numPlays.toLocaleString()
                  : formatHours(song.totalHours),
              meta:
                rankingMetric === 'plays'
                  ? `${formatHours(song.totalHours)} total`
                  : `${song.numPlays.toLocaleString()} plays`,
            }))}
          />
        }
      />

      {showYearlyTopBreakdown ? (
        <YearDrilldownChart
          title="Top song by year"
          years={years}
          spanLabel={spanLabel}
          dataByPlays={analysis.topSongsByYear}
          dataByTime={analysis.topSongsByYearByTime}
          labelKey="trackName"
          rankingMetric={rankingMetric}
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}
