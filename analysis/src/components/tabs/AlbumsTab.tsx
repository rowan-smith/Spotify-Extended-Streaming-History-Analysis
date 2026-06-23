import { useMemo } from 'react';
import { buildAlbumMetricItems } from '../../analysis/metricDisplay';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { DataTable } from '../DataTable';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult, RankingMetric } from '../../types';

interface AlbumsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showYearlyTopBreakdown: boolean;
  spanLabel: string;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function AlbumsTab({
  analysis,
  topNLabel,
  years,
  showYearlyTopBreakdown,
  spanLabel,
  rankingMetric,
  theme,
  compact,
}: AlbumsTabProps) {
  const albums = rankingMetric === 'plays' ? analysis.topAlbumsByPlays : analysis.topAlbumsByTime;
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);

  const albumMetrics = useMemo(
    () => buildAlbumMetricItems(analysis.albumMetrics),
    [analysis.albumMetrics],
  );

  const title = `Top ${topNLabel} albums by ${rankingMetric === 'plays' ? 'plays' : 'playtime'}`;

  return (
    <div className="grid gap-6 min-w-0">
      <MetricGrid
        title="Album metrics"
        subtitle="Album-level patterns from your filtered history."
        metrics={albumMetrics}
      />

      <RankedBarChart
        title={title}
        subtitle={compact ? 'Ranked list optimised for smaller screens.' : undefined}
        labels={albums.map((album) => album.albumName)}
        values={albums.map((album) => (rankingMetric === 'plays' ? album.numPlays : album.totalHours))}
        hover={albums.map((album) =>
          rankingMetric === 'plays'
            ? `${album.artistName}<br>${formatHours(album.totalHours)} total`
            : `${album.artistName}<br>${album.numPlays.toLocaleString()} plays`,
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
            rows={albums}
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
            searchPlaceholder="Search albums or artists…"
          />
        }
        gridView={
          <MobileRankedList
            metricLabel={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
            items={albums.map((album) => ({
              primary: album.albumName,
              secondary: album.artistName,
              value: rankingMetric === 'plays' ? album.numPlays : album.totalHours,
              valueText:
                rankingMetric === 'plays'
                  ? album.numPlays.toLocaleString()
                  : formatHours(album.totalHours),
              meta:
                rankingMetric === 'plays'
                  ? `${formatHours(album.totalHours)} total`
                  : `${album.numPlays.toLocaleString()} plays`,
            }))}
          />
        }
      />

      {showYearlyTopBreakdown ? (
        <YearDrilldownChart
          title="Top album by year"
          years={years}
          spanLabel={spanLabel}
          dataByPlays={analysis.topAlbumsByYear}
          dataByTime={analysis.topAlbumsByYearByTime}
          labelKey="albumName"
          rankingMetric={rankingMetric}
          records={analysis.records}
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}
