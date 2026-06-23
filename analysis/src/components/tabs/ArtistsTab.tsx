import { useMemo } from 'react';
import { buildArtistMetricItems } from '../../analysis/metricDisplay';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { DataTable } from '../DataTable';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult, RankingMetric } from '../../types';

interface ArtistsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showMultiYearCharts: boolean;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function ArtistsTab({
  analysis,
  topNLabel,
  years,
  showMultiYearCharts,
  rankingMetric,
  theme,
  compact,
}: ArtistsTabProps) {
  const artists = rankingMetric === 'plays' ? analysis.topArtistsByPlays : analysis.topArtistsByTime;
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);

  const artistMetrics = useMemo(
    () => buildArtistMetricItems(analysis.artistMetrics),
    [analysis.artistMetrics],
  );

  const title = `Top ${topNLabel} artists by ${rankingMetric === 'plays' ? 'plays' : 'playtime'}`;

  return (
    <div className="grid gap-6 min-w-0">
      <MetricGrid
        title="Artist metrics"
        subtitle="Artist-level patterns from your filtered history."
        metrics={artistMetrics}
      />

      <RankedBarChart
        title={title}
        subtitle={compact ? 'Ranked list optimised for smaller screens.' : undefined}
        labels={artists.map((artist) => artist.artistName)}
        values={artists.map((artist) =>
          rankingMetric === 'plays' ? artist.listenCount : artist.totalHours,
        )}
        hover={artists.map((artist) =>
          rankingMetric === 'plays'
            ? formatHours(artist.totalHours)
            : `${artist.listenCount.toLocaleString()} plays`,
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
            rows={artists}
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
            searchPlaceholder="Search artists…"
          />
        }
        gridView={
          <MobileRankedList
            metricLabel={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
            items={artists.map((artist) => ({
              primary: artist.artistName,
              value: rankingMetric === 'plays' ? artist.listenCount : artist.totalHours,
              valueText:
                rankingMetric === 'plays'
                  ? artist.listenCount.toLocaleString()
                  : formatHours(artist.totalHours),
              meta:
                rankingMetric === 'plays'
                  ? formatHours(artist.totalHours)
                  : `${artist.listenCount.toLocaleString()} plays`,
            }))}
          />
        }
      />

      {showMultiYearCharts ? (
        <YearDrilldownChart
          title="Top artists by year"
          years={years}
          dataByPlays={analysis.topArtistsByYear}
          dataByTime={analysis.topArtistsByYearByTime}
          labelKey="artistName"
          rankingMetric={rankingMetric}
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}
