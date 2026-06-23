import { useMemo } from 'react';
import { buildSongMetricItems } from '../../analysis/metricDisplay';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult, RankingMetric } from '../../types';

interface EpisodesTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showYearlyTopBreakdown: boolean;
  spanLabel: string;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function EpisodesTab({
  analysis,
  topNLabel,
  years,
  showYearlyTopBreakdown,
  spanLabel,
  rankingMetric,
  theme,
  compact,
}: EpisodesTabProps) {
  const episodes =
    rankingMetric === 'plays' ? analysis.topSongsByPlays : analysis.topSongsByTime;
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);

  const episodeMetrics = useMemo(
    () => buildSongMetricItems(analysis.songMetrics, 'episode'),
    [analysis.songMetrics],
  );

  return (
    <div className="grid gap-6 min-w-0">
      <MetricGrid
        title="Episode metrics"
        subtitle="Episode-level patterns from your filtered podcast history."
        metrics={episodeMetrics}
      />

      <RankedBarChart
        title={`Top ${topNLabel} episodes by ${rankingMetric === 'plays' ? 'plays' : 'playtime'}`}
        subtitle={compact ? 'Ranked list optimised for smaller screens.' : undefined}
        labels={episodes.map((episode) => episode.trackName)}
        values={episodes.map((episode) =>
          rankingMetric === 'plays' ? episode.numPlays : episode.totalHours,
        )}
        hover={episodes.map((episode) =>
          rankingMetric === 'plays'
            ? `${episode.artistName}<br>${formatHours(episode.totalHours)} total`
            : `${episode.artistName}<br>${episode.numPlays.toLocaleString()} plays`,
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
        listView={
          <MobileRankedList
            metricLabel={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
            items={episodes.map((episode) => ({
              primary: episode.trackName,
              secondary: episode.artistName,
              value: rankingMetric === 'plays' ? episode.numPlays : episode.totalHours,
              valueText:
                rankingMetric === 'plays'
                  ? episode.numPlays.toLocaleString()
                  : formatHours(episode.totalHours),
              meta:
                rankingMetric === 'plays'
                  ? `${formatHours(episode.totalHours)} total`
                  : `${episode.numPlays.toLocaleString()} plays`,
            }))}
          />
        }
      />

      {showYearlyTopBreakdown ? (
        <YearDrilldownChart
          title="Top episode by year"
          years={years}
          spanLabel={spanLabel}
          dataByPlays={analysis.topSongsByYear}
          dataByTime={analysis.topSongsByYearByTime}
          labelKey="trackName"
          rankingMetric={rankingMetric}
          records={analysis.records}
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}
