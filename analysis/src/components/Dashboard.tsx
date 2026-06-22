import { useMemo, useState } from 'react';
import Plot from '../charts/Plot';
import {
  getPlotTheme,
  horizontalBarChart,
  lineChart,
  multiYearLineSeries,
  rankedBarChartLayout,
  verticalBarChart,
} from '../charts/plotHelpers';
import { shouldShowPaceMetrics } from '../analysis/filters';
import { getSummaryInsights } from '../analysis/insights';
import { formatDuration, formatHours } from '../analysis/processData';
import { METRIC_INFO, PLAYS_VS_TIME_INFO } from '../content/siteContent';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Theme } from '../hooks/useTheme';
import { formatLocalDateTime, formatSessionLength } from '../utils/formatting';
import type {
  AlbumStats,
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
import { WrappedTab } from './WrappedTab';

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
  const chartLayout = rankedBarChartLayout(labels.length, compact);

  return (
    <ChartCard
      title={title}
      subtitle={
        subtitle ??
        (labels.length > 25 ? 'Scroll the page to see every ranked item.' : undefined)
      }
    >
      <Plot
        data={[
          horizontalBarChart(labels, values, hover, xTitle, {
            inlineLabels: chartLayout.inlineLabels,
            accent: plotTheme.accent,
          }),
        ]}
        layout={{
          ...plotTheme.layout,
          height: chartLayout.height,
          bargap: labels.length > 30 ? 0.08 : 0.15,
          xaxis: { title: { text: xTitle }, gridcolor: plotTheme.grid },
          yaxis: {
            automargin: !chartLayout.inlineLabels,
            showticklabels: !chartLayout.inlineLabels,
            tickfont: labels.length > 40 ? { size: 10 } : undefined,
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </ChartCard>
  );
}

function MobileRankedList({
  items,
  metricLabel,
}: {
  items: Array<{
    primary: string;
    secondary?: string;
    value: number;
    valueText: string;
    meta?: string;
  }>;
  metricLabel: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="ranked-list" role="list">
      {items.map((item, index) => {
        const width = Math.max(6, (item.value / maxValue) * 100);

        return (
          <article
            key={`${item.primary}-${item.secondary ?? index}`}
            className="ranked-list__item"
            role="listitem"
          >
            <div className="ranked-list__rank">{index + 1}</div>

            <div className="ranked-list__body">
              <div className="ranked-list__top">
                <div className="ranked-list__labels">
                  <p className="ranked-list__primary" title={item.primary}>
                    {item.primary}
                  </p>
                  {item.secondary ? (
                    <p className="ranked-list__secondary" title={item.secondary}>
                      {item.secondary}
                    </p>
                  ) : null}
                </div>

                <div className="ranked-list__metric">
                  <p className="ranked-list__value">{item.valueText}</p>
                  <p className="ranked-list__metric-label">{metricLabel}</p>
                </div>
              </div>

              <div className="ranked-list__barTrack" aria-hidden="true">
                <div className="ranked-list__barFill" style={{ width: `${width}%` }} />
              </div>

              {item.meta ? <p className="ranked-list__meta">{item.meta}</p> : null}
            </div>
          </article>
        );
      })}
    </div>
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
  dataByPlays: Record<number, SongStats[] | ArtistStats[] | AlbumStats[]>;
  dataByTime: Record<number, SongStats[] | ArtistStats[] | AlbumStats[]>;
  labelKey: 'trackName' | 'artistName' | 'albumName';
  theme: Theme;
  compact: boolean;
}) {
  const [year, setYear] = useState(years[years.length - 1] ?? new Date().getFullYear());
  const [sortMetric, setSortMetric] = useState<SortMetric>('plays');
  const plotTheme = getPlotTheme(theme === 'dark');

  const rows = (sortMetric === 'plays' ? dataByPlays[year] : dataByTime[year]) ?? [];

  const labels = rows.map((row) => {
    if (labelKey === 'trackName') {
      return (row as SongStats).trackName;
    }
    if (labelKey === 'artistName') {
      return (row as ArtistStats).artistName;
    }
    return (row as AlbumStats).albumName;
  });

  const values = rows.map((row) => {
    if (sortMetric === 'plays') {
      return 'numPlays' in row ? row.numPlays : row.listenCount;
    }
    return row.totalHours;
  });

  const hover = rows.map((row) => {
    const label = (() => {
      if (labelKey === 'trackName') return (row as SongStats).trackName;
      if (labelKey === 'artistName') return (row as ArtistStats).artistName;
      return (row as AlbumStats).albumName;
    })();

    if (sortMetric === 'plays') {
      return `${label}<br>${formatHours(row.totalHours)} total`;
    }

    const plays = 'numPlays' in row ? row.numPlays : row.listenCount;
    return `${label}<br>${plays.toLocaleString()} plays`;
  });

  const chartLayout = rankedBarChartLayout(labels.length, compact);

  const mobileItems = rows.map((row) => {
    const primary = (() => {
      if (labelKey === 'trackName') return (row as SongStats).trackName;
      if (labelKey === 'artistName') return (row as ArtistStats).artistName;
      return (row as AlbumStats).albumName;
    })();

    const plays = 'numPlays' in row ? row.numPlays : row.listenCount;

    return {
      primary,
      value: sortMetric === 'plays' ? plays : row.totalHours,
      valueText:
        sortMetric === 'plays'
          ? plays.toLocaleString()
          : formatHours(row.totalHours),
      meta:
        sortMetric === 'plays'
          ? `${formatHours(row.totalHours)} total`
          : `${plays.toLocaleString()} plays`,
    };
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

      {compact ? (
        <MobileRankedList
          metricLabel={sortMetric === 'plays' ? 'Plays' : 'Hours'}
          items={mobileItems}
        />
      ) : (
        <Plot
          data={[
            horizontalBarChart(
              labels,
              values,
              hover,
              sortMetric === 'plays' ? 'Plays' : 'Hours',
              {
                inlineLabels: chartLayout.inlineLabels,
                accent: plotTheme.accent,
              },
            ),
          ]}
          layout={{
            ...plotTheme.layout,
            height: chartLayout.height,
            bargap: labels.length > 30 ? 0.08 : 0.15,
            xaxis: {
              title: { text: sortMetric === 'plays' ? 'Plays' : 'Hours' },
              gridcolor: plotTheme.grid,
            },
            yaxis: {
              automargin: !chartLayout.inlineLabels,
              showticklabels: !chartLayout.inlineLabels,
              tickfont: labels.length > 40 ? { size: 10 } : undefined,
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      )}
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

      {compact ? (
        <ChartCard
          title={`Top ${topNLabel} songs by ${metric === 'plays' ? 'plays' : 'playtime'}`}
          subtitle="Ranked list optimised for smaller screens."
        >
          <MobileRankedList
            metricLabel={metric === 'plays' ? 'Plays' : 'Hours'}
            items={songs.map((song) => ({
              primary: song.trackName,
              secondary: song.artistName,
              value: metric === 'plays' ? song.numPlays : song.totalHours,
              valueText:
                metric === 'plays'
                  ? song.numPlays.toLocaleString()
                  : formatHours(song.totalHours),
              meta:
                metric === 'plays'
                  ? `${formatHours(song.totalHours)} total`
                  : `${song.numPlays.toLocaleString()} plays`,
            }))}
          />
        </ChartCard>
      ) : (
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
      )}

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

      {compact ? (
        <ChartCard
          title={`Top ${topNLabel} artists by ${metric === 'plays' ? 'plays' : 'playtime'}`}
          subtitle="Ranked list optimised for smaller screens."
        >
          <MobileRankedList
            metricLabel={metric === 'plays' ? 'Plays' : 'Hours'}
            items={artists.map((artist) => ({
              primary: artist.artistName,
              value: metric === 'plays' ? artist.listenCount : artist.totalHours,
              valueText:
                metric === 'plays'
                  ? artist.listenCount.toLocaleString()
                  : formatHours(artist.totalHours),
              meta:
                metric === 'plays'
                  ? formatHours(artist.totalHours)
                  : `${artist.listenCount.toLocaleString()} plays`,
            }))}
          />
        </ChartCard>
      ) : (
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
      )}

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

function AlbumsTab({
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
  const albums = metric === 'plays' ? analysis.topAlbumsByPlays : analysis.topAlbumsByTime;

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

      {compact ? (
        <ChartCard
          title={`Top ${topNLabel} albums by ${metric === 'plays' ? 'plays' : 'playtime'}`}
          subtitle="Ranked list optimised for smaller screens."
        >
          <MobileRankedList
            metricLabel={metric === 'plays' ? 'Plays' : 'Hours'}
            items={albums.map((album) => ({
              primary: album.albumName,
              secondary: album.artistName,
              value: metric === 'plays' ? album.numPlays : album.totalHours,
              valueText:
                metric === 'plays'
                  ? album.numPlays.toLocaleString()
                  : formatHours(album.totalHours),
              meta:
                metric === 'plays'
                  ? `${formatHours(album.totalHours)} total`
                  : `${album.numPlays.toLocaleString()} plays`,
            }))}
          />
        </ChartCard>
      ) : (
        <RankedBarChart
          title={`Top ${topNLabel} albums by ${metric === 'plays' ? 'plays' : 'playtime'}`}
          labels={albums.map((album) => album.albumName)}
          values={albums.map((album) => (metric === 'plays' ? album.numPlays : album.totalHours))}
          hover={albums.map((album) =>
            metric === 'plays'
              ? `${album.artistName}<br>${formatHours(album.totalHours)} total`
              : `${album.artistName}<br>${album.numPlays.toLocaleString()} plays`,
          )}
          xTitle={metric === 'plays' ? 'Plays' : 'Hours'}
          theme={theme}
          compact={compact}
        />
      )}

      {showMultiYearCharts ? (
        <YearDrilldownChart
          title="Top albums by year"
          years={years}
          dataByPlays={analysis.topAlbumsByYear}
          dataByTime={analysis.topAlbumsByYearByTime}
          labelKey="albumName"
          theme={theme}
          compact={compact}
        />
      ) : null}
    </div>
  );
}

function ActivitySection({
  overview,
  filters,
}: {
  overview: AnalysisResult['overview'];
  filters: AnalysisFilters;
}) {
  const showSkipMetrics = !filters.hideSkipped;
  const completionTotal = overview.totalCompleted + overview.totalSkipped;
  const completionPct =
    completionTotal > 0 ? Math.round((overview.totalCompleted / completionTotal) * 100) : 100;
  const showCompletionBar = showSkipMetrics && overview.totalSkipped > 0;

  return (
    <section className="overview-section">
      <h3 className="overview-section__title">Play activity</h3>
      <div className="overview-activity">
        <div
          className={`stats-grid stats-grid--activity${showSkipMetrics ? '' : ' stats-grid--activity-no-skips'}`}
        >
          <StatCard
            label="Completed listens"
            value={overview.totalCompleted.toLocaleString()}
            info={METRIC_INFO.completedListens}
          />
          {showSkipMetrics ? (
            <StatCard
              label="Skipped plays"
              value={overview.totalSkipped.toLocaleString()}
              info={METRIC_INFO.skippedPlays}
            />
          ) : null}
          <StatCard
            label="Avg plays / day"
            value={overview.avgPlaysPerDay.toFixed(1)}
            info={METRIC_INFO.avgPlaysPerDay}
          />
          <StatCard
            label="Avg completed / day"
            value={overview.avgCompletedPerDay.toFixed(1)}
            info={METRIC_INFO.avgCompletedPerDay}
          />
          {showSkipMetrics ? (
            <StatCard
              label="Avg skipped / day"
              value={overview.avgSkippedPerDay.toFixed(1)}
              info={METRIC_INFO.avgSkippedPerDay}
            />
          ) : null}
        </div>
        {showCompletionBar ? (
          <div className="completion-bar" aria-label={`${completionPct}% completed listens`}>
            <div className="completion-bar__labels">
              <span>Completed vs skipped</span>
              <span>{completionPct}% completed</span>
            </div>
            <div className="completion-bar__track">
              <div className="completion-bar__fill" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BookendsSection({ overview }: { overview: AnalysisResult['overview'] }) {
  return (
    <section className="overview-section">
      <h3 className="overview-section__title">First & latest listens</h3>
      <div className="overview-cards overview-cards--bookends">
        <article className="bookend-card">
          <p className="bookend-card__label">Earliest listen</p>
          {overview.earliest ? (
            <>
              <p className="bookend-card__track">{overview.earliest.trackName}</p>
              <p className="bookend-card__artist">{overview.earliest.artistName}</p>
              <p className="bookend-card__meta">{formatLocalDateTime(overview.earliest.ts)}</p>
            </>
          ) : (
            <p className="bookend-card__empty">No data in this range.</p>
          )}
        </article>

        <article className="bookend-card">
          <p className="bookend-card__label">Latest listen</p>
          {overview.latest ? (
            <>
              <p className="bookend-card__track">{overview.latest.trackName}</p>
              <p className="bookend-card__artist">{overview.latest.artistName}</p>
              <p className="bookend-card__meta">{formatLocalDateTime(overview.latest.ts)}</p>
            </>
          ) : (
            <p className="bookend-card__empty">No data in this range.</p>
          )}
        </article>

        <article className="bookend-card bookend-card--habits">
          <p className="bookend-card__label">Session habits</p>
          <div className="bookend-metrics">
            <div className="bookend-metric">
              <p className="bookend-metric__label">
                Skip ratio
                <InfoTooltip text={METRIC_INFO.skipToCompleteRatio} label="Skip ratio" />
              </p>
              <p className="bookend-metric__value">{overview.skipToCompleteRatio.toFixed(2)}</p>
            </div>
            <div className="bookend-metric">
              <p className="bookend-metric__label">
                Avg session
                <InfoTooltip text={METRIC_INFO.avgSessionLength} label="Average session length" />
              </p>
              <p className="bookend-metric__value">
                {formatSessionLength(overview.avgSessionSeconds)}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function PatternsSection({
  analysis,
  plotTheme,
  showMultiYearCharts,
}: {
  analysis: AnalysisResult;
  plotTheme: ReturnType<typeof getPlotTheme>;
  showMultiYearCharts: boolean;
}) {
  return (
    <>
      <ChartCard
        title="Plays by month (in range)"
        subtitle="All Januaries, Februaries, etc. pooled across your filtered history."
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

      <ChartCard
        title="Playtime by month (in range)"
        subtitle="All Januaries, Februaries, etc. pooled across your filtered history."
      >
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
        title="Plays by day of month (in range)"
        subtitle="All 1sts, 2nds, etc. pooled across your filtered history."
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
    </>
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
  const summaryInsights = useMemo(() => getSummaryInsights(analysis.insights), [analysis.insights]);

  if (activeTab === 'summary') {
    return (
      <div className="dashboard-grid overview">
        <section className="overview-section">
          <h3 className="overview-section__title">At a glance</h3>
          <div className="stats-grid stats-grid--hero">
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
          <div className="stats-grid stats-grid--context">
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
          </div>
        </section>

        {shouldShowPaceMetrics(filters) && (overview.paceVsLastYear || overview.beatRecord) ? (
          <div className="overview-callouts">
            {overview.paceVsLastYear ? (
              <aside className="overview-callout">
                <p className="overview-callout__label">
                  Pace vs last year
                  <InfoTooltip text={METRIC_INFO.paceVsLastYear} />
                </p>
                <p className="overview-callout__value">{overview.paceVsLastYear}</p>
              </aside>
            ) : null}
            {overview.beatRecord ? (
              <aside className="overview-callout">
                <p className="overview-callout__label">
                  Beat your record
                  <InfoTooltip text={METRIC_INFO.beatRecord} />
                </p>
                <p className="overview-callout__value">{overview.beatRecord}</p>
              </aside>
            ) : null}
          </div>
        ) : null}

        {summaryInsights.length > 0 ? (
          <section className="overview-section">
            <div className="overview-section__header">
              <h3 className="overview-section__title">Highlights</h3>
              <p className="overview-section__subtitle">
                Standout patterns from your filtered history.
              </p>
            </div>
            <div className="insights-grid">
              {summaryInsights.map((fact) => (
                <article key={fact.title} className="insight-card">
                  <p className="insight-card__title">{fact.title}</p>
                  <p className="insight-card__value">{fact.value}</p>
                  <p className="insight-card__detail">{fact.detail}</p>
                </article>
              ))}
            </div>
          </section>
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
      <div className="dashboard-grid">
        <ActivitySection overview={overview} filters={filters} />
        <BookendsSection overview={overview} />
        <PatternsSection
          analysis={analysis}
          plotTheme={plotTheme}
          showMultiYearCharts={showMultiYearCharts}
        />
      </div>
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

  if (activeTab === 'browse') {
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

  return null;
}
