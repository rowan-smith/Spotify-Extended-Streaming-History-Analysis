import { useMemo } from 'react';
import { lineChart } from '../charts/plotHelpers';
import { shouldShowPaceMetrics, effectiveRankingMetric } from '../analysis/filters';
import { sortArtists, sortSongs } from '../analysis/aggregation';
import { formatDuration, formatHours, formatLocalDate, formatLocalDateTime } from '../utils/formatting';
import { METRIC_INFO } from '../content/siteContent';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Theme } from '../hooks/useTheme';
import type {
  AnalysisFilters,
  AnalysisResult,
  FilterContext,
  RankingMetric,
  TabId,
} from '../types';
import { PlotlyCard } from './charts/PlotlyCard';
import { StatCard } from './StatCard';
import { InfoTooltip } from './InfoTooltip';
import { Card, CardContent } from '@/components/ui/card';
import { WrappedTab } from './tabs/WrappedTab';
import { ActivitySection } from './sections/ActivitySection';
import { BookendsSection } from './sections/BookendsSection';
import { PatternsSection } from './sections/PatternsSection';
import { SongsTab } from './tabs/SongsTab';
import { ArtistsTab } from './tabs/ArtistsTab';
import { AlbumsTab } from './tabs/AlbumsTab';
import { DataTable } from './DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { FILTER_OPTION_INFO } from '../content/siteContent';
import { VisualizationShell } from './charts/VisualizationShell';
import { RankedBarPlot } from './charts/RankedBarPlot';
import { MobileRankedList } from './charts/MobileRankedList';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import type { SongStats, ArtistStats } from '../types';
import type { StreamRecord } from '../types';

interface DashboardProps {
  analysis: AnalysisResult;
  activeTab: TabId;
  filterContext: FilterContext;
  filters: AnalysisFilters;
  theme: Theme;
  onFiltersChange: (filters: AnalysisFilters) => void;
}

function BrowseSongsCard({
  rows,
  combineRanking,
  rankingMetric,
  theme,
  compact,
}: {
  rows: SongStats[];
  combineRanking: boolean;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}) {
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact, 'table');
  const chartRows = useMemo(() => [...rows].slice(0, 50), [rows]);

  return (
    <VisualizationShell
      title={combineRanking ? 'Combined top songs' : 'All songs'}
      subtitle="Sort, search, and paginate your full song history for the current filters."
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      chartZoomed={chartZoomed}
      onChartReset={resetChartView}
    >
      {viewMode === 'chart' ? (
        <RankedBarPlot
          ref={plotRef}
          labels={chartRows.map((row) => row.trackName)}
          values={chartRows.map((row) =>
            rankingMetric === 'plays' ? row.numPlays : row.totalHours,
          )}
          hover={chartRows.map((row) =>
            rankingMetric === 'plays'
              ? `${row.artistName}<br>${formatHours(row.totalHours)} total`
              : `${row.artistName}<br>${row.numPlays.toLocaleString()} plays`,
          )}
          xTitle={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
          theme={theme}
          compact={compact}
          onZoomChange={setChartZoomed}
        />
      ) : null}
      {viewMode === 'table' ? (
        <DataTable
          rows={rows}
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
      ) : null}
      {viewMode === 'grid' ? (
        <MobileRankedList
          metricLabel={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
          items={chartRows.map((row) => ({
            primary: row.trackName,
            secondary: row.artistName,
            value: rankingMetric === 'plays' ? row.numPlays : row.totalHours,
            valueText:
              rankingMetric === 'plays'
                ? row.numPlays.toLocaleString()
                : formatHours(row.totalHours),
            meta:
              rankingMetric === 'plays'
                ? `${formatHours(row.totalHours)} total`
                : `${row.numPlays.toLocaleString()} plays`,
          }))}
        />
      ) : null}
    </VisualizationShell>
  );
}

function BrowseArtistsCard({
  rows,
  combineRanking,
  rankingMetric,
  theme,
  compact,
}: {
  rows: ArtistStats[];
  combineRanking: boolean;
  rankingMetric: RankingMetric;
  theme: Theme;
  compact: boolean;
}) {
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact, 'table');
  const chartRows = useMemo(() => [...rows].slice(0, 50), [rows]);

  return (
    <VisualizationShell
      title={combineRanking ? 'Combined top artists' : 'All artists'}
      subtitle="Every artist in the filtered dataset."
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      chartZoomed={chartZoomed}
      onChartReset={resetChartView}
    >
      {viewMode === 'chart' ? (
        <RankedBarPlot
          ref={plotRef}
          labels={chartRows.map((row) => row.artistName)}
          values={chartRows.map((row) =>
            rankingMetric === 'plays' ? row.listenCount : row.totalHours,
          )}
          hover={chartRows.map((row) =>
            rankingMetric === 'plays'
              ? formatHours(row.totalHours)
              : `${row.listenCount.toLocaleString()} plays`,
          )}
          xTitle={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
          theme={theme}
          compact={compact}
          onZoomChange={setChartZoomed}
        />
      ) : null}
      {viewMode === 'table' ? (
        <DataTable
          rows={rows}
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
      ) : null}
      {viewMode === 'grid' ? (
        <MobileRankedList
          metricLabel={rankingMetric === 'plays' ? 'Plays' : 'Hours'}
          items={chartRows.map((row) => ({
            primary: row.artistName,
            value: rankingMetric === 'plays' ? row.listenCount : row.totalHours,
            valueText:
              rankingMetric === 'plays'
                ? row.listenCount.toLocaleString()
                : formatHours(row.totalHours),
            meta:
              rankingMetric === 'plays'
                ? formatHours(row.totalHours)
                : `${row.listenCount.toLocaleString()} plays`,
          }))}
        />
      ) : null}
    </VisualizationShell>
  );
}

function LongestListensCard({
  rows,
  theme,
  compact,
}: {
  rows: StreamRecord[];
  theme: Theme;
  compact: boolean;
}) {
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact, 'table');

  return (
    <VisualizationShell
      title="Longest single listens"
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      chartZoomed={chartZoomed}
      onChartReset={resetChartView}
    >
      {viewMode === 'chart' ? (
        <RankedBarPlot
          ref={plotRef}
          labels={rows.map((row) => row.trackName)}
          values={rows.map((row) => row.msPlayed)}
          hover={rows.map(
            (row) =>
              `${row.artistName}<br>${formatDuration(row.msPlayed)}<br>${formatLocalDateTime(row.ts)}`,
          )}
          xTitle="Duration (ms)"
          theme={theme}
          compact={compact}
          onZoomChange={setChartZoomed}
        />
      ) : null}
      {viewMode === 'table' ? (
        <DataTable
          rows={rows}
          rowKey={(row) => `${row.ts.toISOString()}-${row.trackName}`}
          columns={[
            { key: 'trackName', label: 'Track' },
            { key: 'artistName', label: 'Artist' },
            {
              key: 'msPlayed',
              label: 'Duration',
              align: 'right',
              render: (row) => formatDuration(row.msPlayed),
            },
            {
              key: 'ts',
              label: 'Played at (local)',
              render: (row) => formatLocalDateTime(row.ts),
            },
          ]}
          searchPlaceholder="Search longest listens…"
          pageSize={20}
        />
      ) : null}
      {viewMode === 'grid' ? (
        <MobileRankedList
          metricLabel="Duration"
          items={rows.map((row) => ({
            primary: row.trackName,
            secondary: row.artistName,
            value: row.msPlayed,
            valueText: formatDuration(row.msPlayed),
            meta: formatLocalDateTime(row.ts),
          }))}
        />
      ) : null}
    </VisualizationShell>
  );
}

export function Dashboard({
  analysis,
  activeTab,
  filterContext,
  filters,
  theme,
  onFiltersChange,
}: DashboardProps) {
  const { overview } = analysis;
  const years = analysis.availableYears;
  const topNLabel = analysis.topSongsByPlays.length;
  const isCompact = useMediaQuery('(max-width: 640px)');
  const showMultiYearCharts = !filterContext.singleYear;
  const rankingMetric = effectiveRankingMetric(filters);

  if (activeTab === 'summary') {
    return (
      <div className="grid gap-6">
        <section>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">At a glance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
            <StatCard
              variant="hero"
              label="Total plays"
              value={overview.totalPlays.toLocaleString()}
              info={METRIC_INFO.totalPlays}
            />
            <StatCard
              variant="hero"
              label="Total listening"
              value={formatHours(overview.totalHours)}
              info={METRIC_INFO.totalListening}
            />
            <StatCard
              variant="hero"
              label="Unique songs"
              value={overview.uniqueSongs.toLocaleString()}
              info={METRIC_INFO.uniqueSongs}
            />
            <StatCard
              variant="hero"
              label="Unique artists"
              value={overview.uniqueArtists.toLocaleString()}
              info={METRIC_INFO.uniqueArtists}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3 min-w-0">
            <StatCard
              variant="compact"
              label="History span"
              value={overview.historySpanLabel}
              info={METRIC_INFO.historySpan}
            />
            <StatCard
              variant="compact"
              label="Favourite month"
              value={overview.favoriteMonth}
              info={METRIC_INFO.favoriteMonth}
            />
            <StatCard
              variant="compact"
              label="Favourite day"
              value={overview.favoriteWeekday}
              info={METRIC_INFO.favoriteWeekday}
            />
            <StatCard
              variant="compact"
              label="Favourite hour"
              value={overview.peakHourLabel}
              info={METRIC_INFO.favoriteHour}
            />
            {overview.longestStreak ? (
              <StatCard
                variant="compact"
                label="Listening streak"
                value={`${overview.longestStreak.days} days`}
                hint={`${formatLocalDate(new Date(`${overview.longestStreak.start}T12:00:00`))} – ${formatLocalDate(new Date(`${overview.longestStreak.end}T12:00:00`))}`}
                info={METRIC_INFO.longestStreak}
              />
            ) : null}
          </div>
        </section>

        {shouldShowPaceMetrics(filters) && (overview.paceVsLastYear || overview.beatRecord) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {overview.paceVsLastYear ? (
              <Card>
                <CardContent className="p-4">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    Pace vs last year
                    <InfoTooltip text={METRIC_INFO.paceVsLastYear} />
                  </p>
                  <p className="text-lg font-bold mt-1">{overview.paceVsLastYear}</p>
                </CardContent>
              </Card>
            ) : null}
            {overview.beatRecord ? (
              <Card>
                <CardContent className="p-4">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    Beat your record
                    <InfoTooltip text={METRIC_INFO.beatRecord} />
                  </p>
                  <p className="text-lg font-bold mt-1">{overview.beatRecord}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (activeTab === 'wrapped') {
    return <WrappedTab songs={analysis.allSongs} spanLabel={filterContext.spanLabel} />;
  }

  if (activeTab === 'songs') {
    return (
      <SongsTab
        analysis={analysis}
        topNLabel={topNLabel}
        years={years}
        showMultiYearCharts={showMultiYearCharts}
        rankingMetric={rankingMetric}
        theme={theme}
        compact={isCompact}
      />
    );
  }

  if (activeTab === 'artists') {
    return (
      <ArtistsTab
        analysis={analysis}
        topNLabel={topNLabel}
        years={years}
        showMultiYearCharts={showMultiYearCharts}
        rankingMetric={rankingMetric}
        theme={theme}
        compact={isCompact}
      />
    );
  }

  if (activeTab === 'albums') {
    return (
      <AlbumsTab
        analysis={analysis}
        topNLabel={topNLabel}
        years={years}
        showMultiYearCharts={showMultiYearCharts}
        rankingMetric={rankingMetric}
        theme={theme}
        compact={isCompact}
      />
    );
  }

  if (activeTab === 'habits') {
    return (
      <div className="grid gap-6">
        <ActivitySection overview={overview} filters={filters} />
        <BookendsSection overview={overview} />
        <PatternsSection
          analysis={analysis}
          rankingMetric={rankingMetric}
          theme={theme}
          showMultiYearCharts={showMultiYearCharts}
        />
      </div>
    );
  }

  if (activeTab === 'timeline') {
    const yearPoints = rankingMetric === 'plays' ? analysis.playsByYear : analysis.hoursByYear;
    const yearTitle = rankingMetric === 'plays' ? 'Plays by year' : 'Playtime by year (hours)';
    const yearYAxis = rankingMetric === 'plays' ? 'Plays' : 'Hours';
    const yearValueLabel = rankingMetric === 'plays' ? 'Plays' : 'Hours';
    const dailyPoints = rankingMetric === 'plays' ? analysis.playsByDate : analysis.hoursByDate;
    const dailyTitle = rankingMetric === 'plays' ? 'Daily plays' : 'Daily playtime (hours)';
    const dailyYAxis = rankingMetric === 'plays' ? 'Plays' : 'Hours';
    const dailyValueLabel = rankingMetric === 'plays' ? 'Plays' : 'Hours';

    return (
      <div className="grid gap-6">
        {showMultiYearCharts ? (
          <PlotlyCard
            title={yearTitle}
            subtitle={
              rankingMetric === 'plays'
                ? 'Hover to see the top song each year.'
                : undefined
            }
            data={[
              lineChart(
                yearPoints.map((point) => point.label),
                yearPoints.map((point) => point.value),
                yearPoints.map((point) => point.topItem ?? ''),
                yearValueLabel,
              ),
            ]}
            layout={{ xaxis: { title: { text: 'Year' }, dtick: 1 }, yaxis: { title: { text: yearYAxis } } }}
            theme={theme}
            height={360}
            points={yearPoints}
            pointsValueLabel={yearValueLabel}
          />
        ) : (
          <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted px-4 py-3">
            Year-over-year charts are hidden because your filter covers a single year (
            {filterContext.spanLabel}).
          </p>
        )}

        <PlotlyCard
          title={dailyTitle}
          subtitle={
            rankingMetric === 'plays'
              ? 'Most-listened track per day on hover. Dates use your local timezone.'
              : 'Dates use your local timezone.'
          }
          data={[
            lineChart(
              dailyPoints.map((point) => point.label),
              dailyPoints.map((point) => point.value),
              dailyPoints.map((point) => point.topItem ?? ''),
              dailyValueLabel,
            ),
          ]}
          layout={{ xaxis: { title: { text: 'Date (local)' }, automargin: true }, yaxis: { title: { text: dailyYAxis } } }}
          theme={theme}
          height={360}
          points={dailyPoints}
          pointsValueLabel={dailyValueLabel}
        />

        {showMultiYearCharts && rankingMetric === 'time' ? (
          <PlotlyCard
            title="Playtime by month across your history"
            data={[
              lineChart(
                analysis.playtimeByYearMonth.map((point) => point.label),
                analysis.playtimeByYearMonth.map((point) => point.value),
                analysis.playtimeByYearMonth.map((point) => point.topItem ?? ''),
                'Hours',
              ),
            ]}
            layout={{ xaxis: { title: { text: 'Year, month' }, tickangle: -45, automargin: true }, yaxis: { title: { text: 'Hours' } } }}
            theme={theme}
            height={360}
            points={analysis.playtimeByYearMonth}
            pointsValueLabel="Hours"
          />
        ) : null}
      </div>
    );
  }

  if (activeTab === 'browse') {
    const browseSongs = filters.combineRanking
      ? analysis.combinedSongs
      : sortSongs(analysis.allSongs, rankingMetric);
    const browseArtists = filters.combineRanking
      ? analysis.combinedArtists
      : sortArtists(analysis.allArtists, rankingMetric);
    const longestListens = [...analysis.records].sort((a, b) => b.msPlayed - a.msPlayed).slice(0, 100);

    return (
      <div className="grid gap-6">
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <Checkbox
            checked={filters.combineRanking}
            onChange={(event) =>
              onFiltersChange({ ...filters, combineRanking: event.target.checked })
            }
          />
          <span className="flex items-center gap-1">
            Combined ranking
            <InfoTooltip text={FILTER_OPTION_INFO.combineRanking} />
          </span>
        </label>

        {filters.combineRanking ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted px-4 py-3">
            Combined ranking balances play count and total playtime (50/50).
          </p>
        ) : null}

        <BrowseSongsCard
          rows={browseSongs}
          combineRanking={filters.combineRanking}
          rankingMetric={rankingMetric}
          theme={theme}
          compact={isCompact}
        />

        <BrowseArtistsCard
          rows={browseArtists}
          combineRanking={filters.combineRanking}
          rankingMetric={rankingMetric}
          theme={theme}
          compact={isCompact}
        />

        <LongestListensCard rows={longestListens} theme={theme} compact={isCompact} />
      </div>
    );
  }

  return null;
}
