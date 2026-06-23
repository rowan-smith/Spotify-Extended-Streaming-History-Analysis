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

interface AudiobooksTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showYearlyTopBreakdown: boolean;
  spanLabel: string;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function AudiobooksTab({
  analysis,
  topNLabel,
  years,
  showYearlyTopBreakdown,
  spanLabel,
  rankingMetric,
  theme,
  compact,
}: AudiobooksTabProps) {
  const audiobooks =
    rankingMetric === 'plays' ? analysis.topSongsByPlays : analysis.topSongsByTime;
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);

  const audiobookMetrics = useMemo(
    () => buildSongMetricItems(analysis.songMetrics),
    [analysis.songMetrics],
  );

  return (
    <div className="grid gap-6 min-w-0">
      <MetricGrid
        title="Audiobook metrics"
        subtitle="Title-level patterns from your filtered audiobook history."
        metrics={audiobookMetrics}
      />

      <RankedBarChart
        title={`Top ${topNLabel} audiobooks by ${rankingMetric === 'plays' ? 'plays' : 'playtime'}`}
        subtitle={compact ? 'Ranked list optimised for smaller screens.' : undefined}
        labels={audiobooks.map((audiobook) => audiobook.trackName)}
        values={audiobooks.map((audiobook) =>
          rankingMetric === 'plays' ? audiobook.numPlays : audiobook.totalHours,
        )}
        hover={audiobooks.map((audiobook) =>
          rankingMetric === 'plays'
            ? `${formatHours(audiobook.totalHours)} total`
            : `${audiobook.numPlays.toLocaleString()} plays`,
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
            items={audiobooks.map((audiobook) => ({
              primary: audiobook.trackName,
              value: rankingMetric === 'plays' ? audiobook.numPlays : audiobook.totalHours,
              valueText:
                rankingMetric === 'plays'
                  ? audiobook.numPlays.toLocaleString()
                  : formatHours(audiobook.totalHours),
              meta:
                rankingMetric === 'plays'
                  ? `${formatHours(audiobook.totalHours)} total`
                  : `${audiobook.numPlays.toLocaleString()} plays`,
            }))}
          />
        }
      />

      {showYearlyTopBreakdown ? (
        <YearDrilldownChart
          title="Top audiobook by year"
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
