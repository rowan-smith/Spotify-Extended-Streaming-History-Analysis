import { useMemo } from 'react';
import { buildArtistMetricItems, buildSongMetricItems } from '../../analysis/metricDisplay';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { MetricGrid } from '../MetricGrid';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import { songsForArtist } from '../../analysis/rankedListBreakdown';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { AnalysisResult, RankingMetric } from '../../types';

interface PodcastsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showYearlyTopBreakdown: boolean;
  spanLabel: string;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}

export function PodcastsTab({
  analysis,
  topNLabel,
  years,
  showYearlyTopBreakdown,
  spanLabel,
  rankingMetric,
  theme,
  compact,
}: PodcastsTabProps) {
  const episodes =
    rankingMetric === 'plays' ? analysis.topSongsByPlays : analysis.topSongsByTime;
  const shows =
    rankingMetric === 'plays' ? analysis.topArtistsByPlays : analysis.topArtistsByTime;
  const {
    viewMode: episodeViewMode,
    setViewMode: setEpisodeViewMode,
    chartZoomed: episodeChartZoomed,
    setChartZoomed: setEpisodeChartZoomed,
    plotRef: episodePlotRef,
    resetChartView: resetEpisodeChartView,
  } = useVisualizationView(compact);
  const {
    viewMode: showViewMode,
    setViewMode: setShowViewMode,
    chartZoomed: showChartZoomed,
    setChartZoomed: setShowChartZoomed,
    plotRef: showPlotRef,
    resetChartView: resetShowChartView,
  } = useVisualizationView(compact);

  const episodeMetrics = useMemo(
    () => buildSongMetricItems(analysis.songMetrics),
    [analysis.songMetrics],
  );
  const showMetrics = useMemo(
    () => buildArtistMetricItems(analysis.artistMetrics),
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
        viewMode={episodeViewMode}
        onViewModeChange={setEpisodeViewMode}
        chartZoomed={episodeChartZoomed}
        onChartReset={resetEpisodeChartView}
        plotRef={episodePlotRef}
        onZoomChange={setEpisodeChartZoomed}
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
        viewMode={showViewMode}
        onViewModeChange={setShowViewMode}
        chartZoomed={showChartZoomed}
        onChartReset={resetShowChartView}
        plotRef={showPlotRef}
        onZoomChange={setShowChartZoomed}
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
