import { useMemo, useState } from 'react';
import Plot from '../charts/Plot';
import {
  getPlotTheme,
  horizontalBarChart,
  lineChart,
  multiYearLineSeries,
  verticalBarChart,
} from '../charts/plotHelpers';
import { formatDuration, formatHours } from '../analysis/processData';
import { METRIC_INFO, PLAYS_VS_TIME_INFO } from '../content/siteContent';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Theme } from '../hooks/useTheme';
import { formatLocalDateTime, formatSessionLength } from '../utils/formatting';
import type {
  AnalysisFilters,
  AnalysisResult,
  ArtistStats,
  FilterContext,
  SongStats,
  SortMetric,
  TabId,
} from '../types';
import { ChartCard, MetricTabs, StatCard } from './StatCard';
import { DataTable } from './DataTable';
import { InfoTooltip } from './InfoTooltip';

interface DashboardProps {
  analysis: AnalysisResult;
  activeTab: TabId;
  filterContext: FilterContext;
  filters: AnalysisFilters;
  theme: Theme;
}

function RankedBarChart({
  title,
  subtitle,
  labels,
  values,
  hover,
  xTitle,
  theme,
  compact,
}: {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  hover?: string[];
  xTitle: string;
  theme: Theme;
  compact: boolean;
}) {
  const plotTheme = getPlotTheme(theme === 'dark');

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <Plot
        data={[
          horizontalBarChart(labels, values, hover, xTitle, {
            compact,
            accent: plotTheme.accent,
          }),
        ]}
        layout={{
          ...plotTheme.layout,
          height: compact ? 460 : 420,
          xaxis: { title: { text: xTitle }, gridcolor: plotTheme.grid },
          yaxis: { automargin: !compact, showticklabels: !compact },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </ChartCard>
  );
}

function YearDrilldownChart({
  title,
  years,
  dataByPlays,
  dataByTime,
  labelKey,
  theme,
  compact,
}: {
  title: string;
  years: number[];
  dataByPlays: Record<number, SongStats[] | ArtistStats[]>;
  dataByTime: Record<number, SongStats[] | ArtistStats[]>;
  labelKey: 'trackName' | 'artistName';
  theme: Theme;
  compact: boolean;
}) {
  const [year, setYear] = useState(years[years.length - 1] ?? new Date().getFullYear());
  const [sortMetric, setSortMetric] = useState<SortMetric>('plays');
  const plotTheme = getPlotTheme(theme === 'dark');
  const rows = (sortMetric === 'plays' ? dataByPlays[year] : dataByTime[year]) ?? [];
  const labels = rows.map((row) =>
    labelKey === 'trackName' ? (row as SongStats).trackName : (row as ArtistStats).artistName,
  );
  const values = rows.map((row) => {
    if (sortMetric === 'plays') {
      return 'numPlays' in row ? row.numPlays : row.listenCount;
    }
    return row.totalHours;
  });
  const hover = rows.map((row) => {
    if (sortMetric === 'plays') {
      return `${formatHours(row.totalHours)} total`;
    }
    const plays = 'numPlays' in row ? row.numPlays : row.listenCount;
    return `${plays.toLocaleString()} plays`;
  });

  return (
    <ChartCard title={title} subtitle="Pick a year and metric to explore yearly rankings.">
      <MetricTabs
        active={sortMetric === 'time' ? 'time' : 'plays'}
        onChange={(value) => setSortMetric(value)}
        playsInfo={PLAYS_VS_TIME_INFO.plays}
        timeInfo={PLAYS_VS_TIME_INFO.time}
      />
      <div className="inline-controls">
        <label className="filter-control">
          <span>Year</span>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Plot
        data={[
          horizontalBarChart(labels, values, hover, sortMetric === 'plays' ? 'Plays' : 'Hours', {
            compact,
            accent: plotTheme.accent,
          }),
        ]}
        layout={{
          ...plotTheme.layout,
          height: compact ? 460 : 420,
          xaxis: {
            title: { text: sortMetric === 'plays' ? 'Plays' : 'Hours' },
            gridcolor: plotTheme.grid,
          },
          yaxis: { automargin: !compact, showticklabels: !compact },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </ChartCard>
  );
}

function SongsTab({
  analysis,
  topNLabel,
  years,
  showMultiYearCharts,
  theme,
  compact,
}: {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showMultiYearCharts: boolean;
  theme: Theme;
  compact: boolean;
}) {
  const [metric, setMetric] = useState<'plays' | 'time'>('plays');
  const songs = metric === 'plays' ? analysis.topSongsByPlays : analysis.topSongsByTime;

  return (
    <div className="dashboard-grid">
      <MetricTabs
        active={metric}
        onChange={setMetric}
        playsInfo={PLAYS_VS_TIME_INFO.plays}
        timeInfo={PLAYS_VS_TIME_INFO.time}
      />
      <p className="metric-explainer">
        {metric === 'plays' ? PLAYS_VS_TIME_INFO.plays : PLAYS_VS_TIME_INFO.time}
      </p>

      <RankedBarChart
        title={`Top ${topNLabel} songs by ${metric === 'plays' ? 'plays' : 'playtime'}`}
        labels={songs.map((song) => song.trackName)}
        values={songs.map((song) => (metric === 'plays' ? song.numPlays : song.totalHours))}
        hover={songs.map((song) =>
          metric === 'plays'
            ? `${song.artistName}<br>${formatHours(song.totalHours)} total`
            : `${song.artistName}<br>${song.numPlays.toLocaleString()} plays`,
        )}
        xTitle={metric === 'plays' ? 'Plays' : 'Hours'}
        theme={theme}
        compact={compact}
      />

      {showMultiYearCharts ? (
        <YearDrilldownChart
          title="Top songs by year"
          years={years}
          dataByPlays={analysis.topSongsByYear}
          dataByTime={analysis.topSongsByYearByTime}
          labelKey="trackName"
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}

function ArtistsTab({
  analysis,
  topNLabel,
  years,
  showMultiYearCharts,
  theme,
  compact,
}: {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showMultiYearCharts: boolean;
  theme: Theme;
  compact: boolean;
}) {
  const [metric, setMetric] = useState<'plays' | 'time'>('plays');
  const artists = metric === 'plays' ? analysis.topArtistsByPlays : analysis.topArtistsByTime;

  return (
    <div className="dashboard-grid">
      <MetricTabs
        active={metric}
        onChange={setMetric}
        playsInfo={PLAYS_VS_TIME_INFO.plays}
        timeInfo={PLAYS_VS_TIME_INFO.time}
      />
      <p className="metric-explainer">
        {metric === 'plays' ? PLAYS_VS_TIME_INFO.plays : PLAYS_VS_TIME_INFO.time}
      </p>

      <RankedBarChart
        title={`Top ${topNLabel} artists by ${metric === 'plays' ? 'plays' : 'playtime'}`}
        labels={artists.map((artist) => artist.artistName)}
        values={artists.map((artist) =>
          metric === 'plays' ? artist.listenCount : artist.totalHours,
        )}
        hover={artists.map((artist) =>
          metric === 'plays'
            ? formatHours(artist.totalHours)
            : `${artist.listenCount.toLocaleString()} plays`,
        )}
        xTitle={metric === 'plays' ? 'Plays' : 'Hours'}
        theme={theme}
        compact={compact}
      />

      {showMultiYearCharts ? (
        <YearDrilldownChart
          title="Top artists by year"
          years={years}
          dataByPlays={analysis.topArtistsByYear}
          dataByTime={analysis.topArtistsByYearByTime}
          labelKey="artistName"
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}

export function Dashboard({
  analysis,
  activeTab,
  filterContext,
  filters,
  theme,
}: DashboardProps) {
  const { overview } = analysis;
  const years = analysis.availableYears;
  const topNLabel = analysis.topSongsByPlays.length;
  const isCompact = useMediaQuery('(max-width: 640px)');
  const plotTheme = useMemo(() => getPlotTheme(theme === 'dark'), [theme]);
  const showMultiYearCharts = !filterContext.singleYear;

  if (activeTab === 'overview') {
    return (
      <div className="dashboard-grid">
        <div className="stats-grid">
          <StatCard
            label="Total plays"
            value={overview.totalPlays.toLocaleString()}
            info={METRIC_INFO.totalPlays}
          />
          <StatCard
            label="Total listening"
            value={formatHours(overview.totalHours)}
            info={METRIC_INFO.totalListening}
          />
          <StatCard
            label="Unique songs"
            value={overview.uniqueSongs.toLocaleString()}
            info={METRIC_INFO.uniqueSongs}
          />
          <StatCard
            label="Unique artists"
            value={overview.uniqueArtists.toLocaleString()}
            info={METRIC_INFO.uniqueArtists}
          />
          <StatCard
            label="History span"
            value={`${overview.yearMin} – ${overview.yearMax}`}
            info={METRIC_INFO.historySpan}
          />
          <StatCard
            label="Peak hour (local)"
            value={overview.peakHourLabel}
            info={METRIC_INFO.peakHour}
          />
          <StatCard
            label="Avg plays / day"
            value={overview.avgPlaysPerDay.toFixed(1)}
            info={METRIC_INFO.avgPlaysPerDay}
          />
          <StatCard
            label="Completed listens"
            value={overview.totalCompleted.toLocaleString()}
            info={METRIC_INFO.completedListens}
          />
          <StatCard
            label="Skipped plays"
            value={overview.totalSkipped.toLocaleString()}
            info={METRIC_INFO.skippedPlays}
          />
          <StatCard
            label="Avg completed / day"
            value={overview.avgCompletedPerDay.toFixed(1)}
            info={METRIC_INFO.avgCompletedPerDay}
          />
          <StatCard
            label="Avg skipped / day"
            value={overview.avgSkippedPerDay.toFixed(1)}
            info={METRIC_INFO.avgSkippedPerDay}
          />
          {overview.paceVsLastYear ? (
            <StatCard
              label="Pace vs last year"
              value={overview.paceVsLastYear}
              info={METRIC_INFO.paceVsLastYear}
            />
          ) : null}
          {overview.beatRecord ? (
            <StatCard
              label="Beat your record"
              value={overview.beatRecord}
              info={METRIC_INFO.beatRecord}
            />
          ) : null}
        </div>

        <div className="overview-cards">
          <ChartCard title="Earliest listen">
            {overview.earliest ? (
              <div className="track-spotlight">
                <p className="track-spotlight__title">{overview.earliest.trackName}</p>
                <p>{overview.earliest.artistName}</p>
                <p className="muted">{formatLocalDateTime(overview.earliest.ts)}</p>
              </div>
            ) : null}
          </ChartCard>
          <ChartCard title="Latest listen">
            {overview.latest ? (
              <div className="track-spotlight">
                <p className="track-spotlight__title">{overview.latest.trackName}</p>
                <p>{overview.latest.artistName}</p>
                <p className="muted">{formatLocalDateTime(overview.latest.ts)}</p>
              </div>
            ) : null}
          </ChartCard>
          <ChartCard title="Listening habits">
            <ul className="habit-list">
              <li>
                Skip-to-complete ratio:{' '}
                <strong>{overview.skipToCompleteRatio.toFixed(2)}</strong>
                <InfoTooltip text={METRIC_INFO.skipToCompleteRatio} />
              </li>
              <li>
                Average session length:{' '}
                <strong>{formatSessionLength(overview.avgSessionSeconds)}</strong>
                <InfoTooltip text={METRIC_INFO.avgSessionLength} />
              </li>
              <li>Sessions end after a 30-minute gap with no plays.</li>
              <li>Completed = track reached end (trackdone). Skipped = flagged in export.</li>
            </ul>
          </ChartCard>
        </div>

        {analysis.insights.length > 0 ? (
          <ChartCard title="Highlights" subtitle="Patterns mined from your filtered history.">
            <div className="insights-grid">
              {analysis.insights.map((fact) => (
                <article key={fact.title} className="insight-card">
                  <p className="insight-card__title">
                    {fact.title}
                    <InfoTooltip text={fact.detail} label={fact.title} />
                  </p>
                  <p className="insight-card__value">{fact.value}</p>
                  <p className="insight-card__detail">{fact.detail}</p>
                </article>
              ))}
            </div>
          </ChartCard>
        ) : null}
      </div>
    );
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

  if (activeTab === 'timeline') {
    return (
      <div className="dashboard-grid">
        {showMultiYearCharts ? (
          <>
            <ChartCard title="Plays by year" subtitle="Hover to see the top song each year.">
              <Plot
                data={[
                  lineChart(
                    analysis.playsByYear.map((point) => point.label),
                    analysis.playsByYear.map((point) => point.value),
                    analysis.playsByYear.map((point) => point.topItem ?? ''),
                    'Plays',
                    plotTheme.accent,
                  ),
                ]}
                layout={{
                  ...plotTheme.layout,
                  height: 360,
                  xaxis: { title: { text: 'Year' }, dtick: 1, gridcolor: plotTheme.grid },
                  yaxis: { title: { text: 'Plays' }, gridcolor: plotTheme.grid },
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </ChartCard>

            <ChartCard title="Playtime by year (hours)">
              <Plot
                data={[
                  lineChart(
                    analysis.hoursByYear.map((point) => point.label),
                    analysis.hoursByYear.map((point) => point.value),
                    analysis.hoursByYear.map((point) => point.topItem ?? ''),
                    'Hours',
                    plotTheme.accent,
                  ),
                ]}
                layout={{
                  ...plotTheme.layout,
                  height: 360,
                  xaxis: { title: { text: 'Year' }, dtick: 1, gridcolor: plotTheme.grid },
                  yaxis: { title: { text: 'Hours' }, gridcolor: plotTheme.grid },
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </ChartCard>
          </>
        ) : (
          <p className="metric-explainer">
            Year-over-year charts are hidden because your filter covers a single year (
            {filterContext.spanLabel}).
          </p>
        )}

        <ChartCard
          title="Daily plays"
          subtitle="Most-listened track per day on hover. Dates use your local timezone."
        >
          <Plot
            data={[
              lineChart(
                analysis.playsByDate.map((point) => point.label),
                analysis.playsByDate.map((point) => point.value),
                analysis.playsByDate.map((point) => point.topItem ?? ''),
                'Plays',
                plotTheme.accent,
              ),
            ]}
            layout={{
              ...plotTheme.layout,
              height: 360,
              xaxis: { title: { text: 'Date (local)' }, gridcolor: plotTheme.grid },
              yaxis: { title: { text: 'Plays' }, gridcolor: plotTheme.grid },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        <ChartCard title="Daily playtime (hours)">
          <Plot
            data={[
              lineChart(
                analysis.hoursByDate.map((point) => point.label),
                analysis.hoursByDate.map((point) => point.value),
                analysis.hoursByDate.map((point) => point.topItem ?? ''),
                'Hours',
                plotTheme.accent,
              ),
            ]}
            layout={{
              ...plotTheme.layout,
              height: 360,
              xaxis: { title: { text: 'Date (local)' }, gridcolor: plotTheme.grid },
              yaxis: { title: { text: 'Hours' }, gridcolor: plotTheme.grid },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        {showMultiYearCharts ? (
          <ChartCard title="Playtime by month across your history">
            <Plot
              data={[
                lineChart(
                  analysis.playtimeByYearMonth.map((point) => point.label),
                  analysis.playtimeByYearMonth.map((point) => point.value),
                  analysis.playtimeByYearMonth.map((point) => point.topItem ?? ''),
                  'Hours',
                  plotTheme.accent,
                ),
              ]}
              layout={{
                ...plotTheme.layout,
                height: 360,
                xaxis: { title: { text: 'Year, month' }, gridcolor: plotTheme.grid, tickangle: -45 },
                yaxis: { title: { text: 'Hours' }, gridcolor: plotTheme.grid },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </ChartCard>
        ) : null}
      </div>
    );
  }

  if (activeTab === 'explore') {
    const combinedSongs = filters.combineRanking ? analysis.combinedSongs : analysis.allSongs;
    const combinedArtists = filters.combineRanking ? analysis.combinedArtists : analysis.allArtists;

    return (
      <div className="dashboard-grid">
        {filters.combineRanking ? (
          <p className="metric-explainer">
            Combined ranking balances play count and total playtime (50/50). Toggle off in
            advanced filters for raw lists.
          </p>
        ) : null}

        <ChartCard
          title={filters.combineRanking ? 'Combined top songs' : 'All songs'}
          subtitle="Sort, search, and paginate your full song history for the current filters."
        >
          <DataTable
            rows={combinedSongs}
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
        </ChartCard>

        <ChartCard
          title={filters.combineRanking ? 'Combined top artists' : 'All artists'}
          subtitle="Every artist in the filtered dataset."
        >
          <DataTable
            rows={combinedArtists}
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
        </ChartCard>

        <ChartCard title="Longest single listens">
          <DataTable
            rows={[...analysis.records].sort((a, b) => b.msPlayed - a.msPlayed).slice(0, 100)}
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
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <ChartCard
        title="Plays by month (all years combined)"
        subtitle="All Januaries, Februaries, etc. pooled together."
      >
        <Plot
          data={[
            verticalBarChart(
              analysis.playsByMonth.map((point) => point.label),
              analysis.playsByMonth.map((point) => point.value),
              analysis.playsByMonth.map((point) => point.topItem ?? ''),
              'Plays',
              plotTheme.accent,
            ),
          ]}
          layout={{
            ...plotTheme.layout,
            height: 360,
            xaxis: { title: { text: 'Month' }, gridcolor: plotTheme.grid },
            yaxis: { title: { text: 'Plays' }, gridcolor: plotTheme.grid },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </ChartCard>

      <ChartCard title="Playtime by month (all years combined)">
        <Plot
          data={[
            verticalBarChart(
              analysis.hoursByMonth.map((point) => point.label),
              analysis.hoursByMonth.map((point) => point.value),
              analysis.hoursByMonth.map((point) => point.topItem ?? ''),
              'Hours',
              plotTheme.accent,
            ),
          ]}
          layout={{
            ...plotTheme.layout,
            height: 360,
            xaxis: { title: { text: 'Month' }, gridcolor: plotTheme.grid },
            yaxis: { title: { text: 'Hours' }, gridcolor: plotTheme.grid },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </ChartCard>

      <ChartCard
        title="Plays by day of month (all years combined)"
        subtitle="All 1sts, 2nds, etc. across your filtered history."
      >
        <Plot
          data={[
            lineChart(
              analysis.playsByDayOfMonth.map((point) => point.label),
              analysis.playsByDayOfMonth.map((point) => point.value),
              analysis.playsByDayOfMonth.map((point) => point.topItem ?? ''),
              'Plays',
              plotTheme.accent,
            ),
          ]}
          layout={{
            ...plotTheme.layout,
            height: 360,
            xaxis: { title: { text: 'Day of month' }, gridcolor: plotTheme.grid },
            yaxis: { title: { text: 'Plays' }, gridcolor: plotTheme.grid },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </ChartCard>

      <ChartCard title="Plays by hour of day (local time)">
        <Plot
          data={[
            verticalBarChart(
              analysis.playsByHour.map((point) => point.label),
              analysis.playsByHour.map((point) => point.value),
              analysis.playsByHour.map((point) => point.topItem ?? ''),
              'Plays',
              plotTheme.accent,
            ),
          ]}
          layout={{
            ...plotTheme.layout,
            height: 360,
            xaxis: { title: { text: 'Hour (local)' }, tickangle: -45, gridcolor: plotTheme.grid },
            yaxis: { title: { text: 'Plays' }, gridcolor: plotTheme.grid },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </ChartCard>

      {showMultiYearCharts && analysis.monthlyHistoryByYear.length > 1 ? (
        <ChartCard
          title="Listening history over the years"
          subtitle="Monthly playtime by calendar year. Each line is one year in your filtered data."
        >
          <Plot
            data={multiYearLineSeries(analysis.monthlyHistoryByYear, 'Hours')}
            layout={{
              ...plotTheme.layout,
              height: 420,
              xaxis: { title: { text: 'Month' }, gridcolor: plotTheme.grid },
              yaxis: { title: { text: 'Hours' }, gridcolor: plotTheme.grid },
              legend: { orientation: 'h', y: 1.15 },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>
      ) : null}
    </div>
  );
}
