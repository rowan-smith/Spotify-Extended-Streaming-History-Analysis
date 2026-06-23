import { useMemo } from 'react';
import { buildArtistMetricItems } from '../../analysis/metricDisplay';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { WrappedRankingsView } from '../charts/WrappedRankingsView';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { DataTable } from '../DataTable';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult, RankingMetric } from '../../types';

interface ArtistsTabProps {
  analysis: AnalysisResult;
  isWrappedMode: boolean;
  wrappedYear: number;
  topNLabel: number;
  years: number[];
  showYearlyTopBreakdown: boolean;
  spanLabel: string;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function ArtistsTab({
  analysis,
  isWrappedMode,
  wrappedYear,
  topNLabel,
  years,
  showYearlyTopBreakdown,
  spanLabel,
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

  if (isWrappedMode) {
    return <WrappedRankingsView kind="artists" analysis={analysis} year={wrappedYear} />;
  }

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

      {showYearlyTopBreakdown ? (
        <YearDrilldownChart
          title="Top artist by year"
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
