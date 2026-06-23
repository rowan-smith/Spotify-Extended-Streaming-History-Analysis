import { useMemo } from 'react';
import { buildArtistMetricItems } from '../../analysis/metricDisplay';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { songsForArtist } from '../../analysis/rankedListBreakdown';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult, RankingMetric } from '../../types';

interface ShowsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showYearlyTopBreakdown: boolean;
  spanLabel: string;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function ShowsTab({
  analysis,
  topNLabel,
  years,
  showYearlyTopBreakdown,
  spanLabel,
  rankingMetric,
  theme,
  compact,
}: ShowsTabProps) {
  const shows =
    rankingMetric === 'plays' ? analysis.topArtistsByPlays : analysis.topArtistsByTime;
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);

  const showMetrics = useMemo(
    () => buildArtistMetricItems(analysis.artistMetrics, 'show'),
    [analysis.artistMetrics],
  );

  const showListItems = useMemo(
    () =>
      shows.map((show) => ({
        primary: show.artistName,
        rowKey: show.artistName,
        value: rankingMetric === 'plays' ? show.listenCount : show.totalHours,
        valueText:
          rankingMetric === 'plays'
            ? show.listenCount.toLocaleString()
            : formatHours(show.totalHours),
        meta:
          rankingMetric === 'plays'
            ? formatHours(show.totalHours)
            : `${show.listenCount.toLocaleString()} plays`,
        breakdown: songsForArtist(analysis.records, show.artistName, rankingMetric),
        breakdownLabel: 'Episodes from this show',
        hideArtistInBreakdown: true,
      })),
    [analysis.records, shows, rankingMetric],
  );

  return (
    <div className="grid gap-6 min-w-0">
      <MetricGrid
        title="Show metrics"
        subtitle="Show-level patterns from your filtered podcast history."
        metrics={showMetrics}
      />

      <RankedBarChart
        title={`Top ${topNLabel} shows by ${rankingMetric === 'plays' ? 'plays' : 'playtime'}`}
        subtitle={compact ? 'Ranked list optimised for smaller screens.' : undefined}
        labels={shows.map((show) => show.artistName)}
        values={shows.map((show) =>
          rankingMetric === 'plays' ? show.listenCount : show.totalHours,
        )}
        hover={shows.map((show) =>
          rankingMetric === 'plays'
            ? formatHours(show.totalHours)
            : `${show.listenCount.toLocaleString()} plays`,
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
            rankingMetric={rankingMetric}
            items={showListItems}
          />
        }
      />

      {showYearlyTopBreakdown ? (
        <YearDrilldownChart
          title="Top show by year"
          years={years}
          spanLabel={spanLabel}
          dataByPlays={analysis.topArtistsByYear}
          dataByTime={analysis.topArtistsByYearByTime}
          labelKey="artistName"
          rankingMetric={rankingMetric}
          records={analysis.records}
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}
