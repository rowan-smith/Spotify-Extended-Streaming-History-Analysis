import { useMemo } from 'react';
import { lineChart } from '../charts/plotHelpers';
import { shouldShowPaceMetrics } from '../analysis/filters';
import { formatDuration, formatHours, formatLocalDate, formatLocalDateTime } from '../utils/formatting';
import { METRIC_INFO } from '../content/siteContent';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Theme } from '../hooks/useTheme';
import type {
  AnalysisFilters,
  AnalysisResult,
  FilterContext,
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
  theme,
  compact,
}: {
  rows: SongStats[];
  combineRanking: boolean;
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
          values={chartRows.map((row) => row.numPlays)}
          hover={chartRows.map((row) => `${row.artistName}<br>${formatHours(row.totalHours)} total`)}
          xTitle="Plays"
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
          metricLabel="Plays"
          items={chartRows.map((row) => ({
            primary: row.trackName,
            secondary: row.artistName,
            value: row.numPlays,
            valueText: row.numPlays.toLocaleString(),
            meta: `${formatHours(row.totalHours)} total`,
          }))}
        />
      ) : null}
    </VisualizationShell>
  );
}

function BrowseArtistsCard({
  rows,
  combineRanking,
  theme,
  compact,
}: {
  rows: ArtistStats[];
  combineRanking: boolean;
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
          values={chartRows.map((row) => row.listenCount)}
          hover={chartRows.map((row) => formatHours(row.totalHours))}
          xTitle="Plays"
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
          metricLabel="Plays"
          items={chartRows.map((row) => ({
            primary: row.artistName,
            value: row.listenCount,
            valueText: row.listenCount.toLocaleString(),
            meta: formatHours(row.totalHours),
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

  if (activeTab === 'summary') {
    return (
      <div className="grid gap-6">
        <section>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">At a glance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2 min-w-0">
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
          theme={theme}
          showMultiYearCharts={showMultiYearCharts}
        />
      </div>
    );
  }

  if (activeTab === 'timeline') {
    return (
      <div className="grid gap-6">
        {showMultiYearCharts ? (
          <>
            <PlotlyCard
              title="Plays by year"
              subtitle="Hover to see the top song each year."
              data={[
                lineChart(
                  analysis.playsByYear.map((point) => point.label),
                  analysis.playsByYear.map((point) => point.value),
                  analysis.playsByYear.map((point) => point.topItem ?? ''),
                  'Plays',
                ),
              ]}
              layout={{ xaxis: { title: { text: 'Year' }, dtick: 1 }, yaxis: { title: { text: 'Plays' } } }}
              theme={theme}
              height={360}
              points={analysis.playsByYear}
              pointsValueLabel="Plays"
            />

            <PlotlyCard
              title="Playtime by year (hours)"
              data={[
                lineChart(
                  analysis.hoursByYear.map((point) => point.label),
                  analysis.hoursByYear.map((point) => point.value),
                  analysis.hoursByYear.map((point) => point.topItem ?? ''),
                  'Hours',
                ),
              ]}
              layout={{ xaxis: { title: { text: 'Year' }, dtick: 1 }, yaxis: { title: { text: 'Hours' } } }}
              theme={theme}
              height={360}
              points={analysis.hoursByYear}
              pointsValueLabel="Hours"
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted px-4 py-3">
            Year-over-year charts are hidden because your filter covers a single year (
            {filterContext.spanLabel}).
          </p>
        )}

        <PlotlyCard
          title="Daily plays"
          subtitle="Most-listened track per day on hover. Dates use your local timezone."
          data={[
            lineChart(
              analysis.playsByDate.map((point) => point.label),
              analysis.playsByDate.map((point) => point.value),
              analysis.playsByDate.map((point) => point.topItem ?? ''),
              'Plays',
            ),
          ]}
          layout={{ xaxis: { title: { text: 'Date (local)' }, automargin: true }, yaxis: { title: { text: 'Plays' } } }}
          theme={theme}
          height={360}
          points={analysis.playsByDate}
          pointsValueLabel="Plays"
        />

        <PlotlyCard
          title="Daily playtime (hours)"
          data={[
            lineChart(
              analysis.hoursByDate.map((point) => point.label),
              analysis.hoursByDate.map((point) => point.value),
              analysis.hoursByDate.map((point) => point.topItem ?? ''),
              'Hours',
            ),
          ]}
          layout={{ xaxis: { title: { text: 'Date (local)' }, automargin: true }, yaxis: { title: { text: 'Hours' } } }}
          theme={theme}
          height={360}
          points={analysis.hoursByDate}
          pointsValueLabel="Hours"
        />

        {showMultiYearCharts ? (
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
    const combinedSongs = filters.combineRanking ? analysis.combinedSongs : analysis.allSongs;
    const combinedArtists = filters.combineRanking ? analysis.combinedArtists : analysis.allArtists;
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
          rows={combinedSongs}
          combineRanking={filters.combineRanking}
          theme={theme}
          compact={isCompact}
        />

        <BrowseArtistsCard
          rows={combinedArtists}
          combineRanking={filters.combineRanking}
          theme={theme}
          compact={isCompact}
        />

        <LongestListensCard rows={longestListens} theme={theme} compact={isCompact} />
      </div>
    );
  }

  return null;
}
