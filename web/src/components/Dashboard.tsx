import { useState } from 'react';
import Plot from '../charts/Plot';
import {
  horizontalBarChart,
  lineChart,
  multiYearLineSeries,
  plotLayout,
  verticalBarChart,
} from '../charts/plotHelpers';
import { formatDuration, formatHours } from '../analysis/processData';
import type { AnalysisResult, ArtistStats, SongStats, SortMetric, TabId } from '../types';
import { ChartCard, StatCard } from './StatCard';
import { DataTable } from './DataTable';

interface DashboardProps {
  analysis: AnalysisResult;
  activeTab: TabId;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'songs', label: 'Songs' },
  { id: 'artists', label: 'Artists' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'explore', label: 'Explore' },
  { id: 'assumptions', label: 'Assumptions' },
];

export function tabLabels(): { id: TabId; label: string }[] {
  return tabs;
}

function YearDrilldownChart({
  title,
  years,
  dataByPlays,
  dataByTime,
  labelKey,
}: {
  title: string;
  years: number[];
  dataByPlays: Record<number, SongStats[] | ArtistStats[]>;
  dataByTime: Record<number, SongStats[] | ArtistStats[]>;
  labelKey: 'trackName' | 'artistName';
}) {
  const [year, setYear] = useState(years[years.length - 1] ?? new Date().getUTCFullYear());
  const [sortMetric, setSortMetric] = useState<SortMetric>('plays');
  const rows = (sortMetric === 'plays' ? dataByPlays[year] : dataByTime[year]) ?? [];
  const labels = rows.map((row) =>
    labelKey === 'trackName'
      ? (row as SongStats).trackName
      : (row as ArtistStats).artistName,
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
        <label className="filter-control">
          <span>Rank by</span>
          <select
            value={sortMetric}
            onChange={(event) => setSortMetric(event.target.value as SortMetric)}
          >
            <option value="plays">Plays</option>
            <option value="time">Playtime</option>
          </select>
        </label>
      </div>
      <Plot
        data={[
          horizontalBarChart(
            labels,
            values,
            hover,
            sortMetric === 'plays' ? 'Plays' : 'Hours',
          ),
        ]}
        layout={{
          ...plotLayout,
          height: 420,
          xaxis: {
            title: { text: sortMetric === 'plays' ? 'Plays' : 'Hours' },
            gridcolor: '#2a2a2a',
          },
          yaxis: { automargin: true },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </ChartCard>
  );
}

export function Dashboard({ analysis, activeTab }: DashboardProps) {
  const { overview } = analysis;
  const years = analysis.availableYears;
  const topNLabel = analysis.topSongsByPlays.length;

  if (activeTab === 'overview') {
    return (
      <div className="dashboard-grid">
        <div className="stats-grid">
          <StatCard label="Total plays" value={overview.totalPlays.toLocaleString()} />
          <StatCard label="Total listening" value={formatHours(overview.totalHours)} />
          <StatCard label="Unique songs" value={overview.uniqueSongs.toLocaleString()} />
          <StatCard label="Unique artists" value={overview.uniqueArtists.toLocaleString()} />
          <StatCard label="History span" value={`${overview.yearMin} – ${overview.yearMax}`} />
          <StatCard label="Peak hour (UTC)" value={overview.peakHourLabel} />
          <StatCard label="Completed listens" value={overview.totalCompleted.toLocaleString()} />
          <StatCard label="Skipped plays" value={overview.totalSkipped.toLocaleString()} />
          <StatCard label="Avg completed / day" value={overview.avgCompletedPerDay.toFixed(1)} />
          <StatCard label="Avg skipped / day" value={overview.avgSkippedPerDay.toFixed(1)} />
        </div>

        <div className="overview-cards">
          <ChartCard title="Earliest listen">
            {overview.earliest ? (
              <div className="track-spotlight">
                <p className="track-spotlight__title">{overview.earliest.trackName}</p>
                <p>{overview.earliest.artistName}</p>
                <p className="muted">{overview.earliest.ts.toUTCString()}</p>
              </div>
            ) : null}
          </ChartCard>
          <ChartCard title="Latest listen">
            {overview.latest ? (
              <div className="track-spotlight">
                <p className="track-spotlight__title">{overview.latest.trackName}</p>
                <p>{overview.latest.artistName}</p>
                <p className="muted">{overview.latest.ts.toUTCString()}</p>
              </div>
            ) : null}
          </ChartCard>
          <ChartCard title="Listening habits">
            <ul className="habit-list">
              <li>
                Skip-to-complete ratio:{' '}
                <strong>{overview.skipToCompleteRatio.toFixed(2)}</strong>
              </li>
              <li>
                Average session length:{' '}
                <strong>{Math.round(overview.avgSessionSeconds)} sec</strong>
              </li>
              <li>Sessions end after a 30-minute gap with no plays.</li>
            </ul>
          </ChartCard>
        </div>
      </div>
    );
  }

  if (activeTab === 'songs') {
    return (
      <div className="dashboard-grid">
        <ChartCard title={`Top ${topNLabel} songs by plays`}>
          <Plot
            data={[
              horizontalBarChart(
                analysis.topSongsByPlays.map((song) => song.trackName),
                analysis.topSongsByPlays.map((song) => song.numPlays),
                analysis.topSongsByPlays.map(
                  (song) => `${song.artistName}<br>${formatHours(song.totalHours)} total`,
                ),
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 420,
              xaxis: { title: { text: 'Plays' }, gridcolor: '#2a2a2a' },
              yaxis: { automargin: true },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        <ChartCard title={`Top ${topNLabel} songs by playtime`}>
          <Plot
            data={[
              horizontalBarChart(
                analysis.topSongsByTime.map((song) => song.trackName),
                analysis.topSongsByTime.map((song) => song.totalHours),
                analysis.topSongsByTime.map(
                  (song) =>
                    `${song.artistName}<br>${song.numPlays.toLocaleString()} plays`,
                ),
                'Hours',
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 420,
              xaxis: { title: { text: 'Hours' }, gridcolor: '#2a2a2a' },
              yaxis: { automargin: true },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        <YearDrilldownChart
          title="Top songs by year"
          years={years}
          dataByPlays={analysis.topSongsByYear}
          dataByTime={analysis.topSongsByYearByTime}
          labelKey="trackName"
        />
      </div>
    );
  }

  if (activeTab === 'artists') {
    return (
      <div className="dashboard-grid">
        <ChartCard title={`Top ${topNLabel} artists by plays`}>
          <Plot
            data={[
              horizontalBarChart(
                analysis.topArtistsByPlays.map((artist) => artist.artistName),
                analysis.topArtistsByPlays.map((artist) => artist.listenCount),
                analysis.topArtistsByPlays.map((artist) => formatHours(artist.totalHours)),
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 420,
              xaxis: { title: { text: 'Plays' }, gridcolor: '#2a2a2a' },
              yaxis: { automargin: true },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        <ChartCard title={`Top ${topNLabel} artists by playtime`}>
          <Plot
            data={[
              horizontalBarChart(
                analysis.topArtistsByTime.map((artist) => artist.artistName),
                analysis.topArtistsByTime.map((artist) => artist.totalHours),
                analysis.topArtistsByTime.map(
                  (artist) => `${artist.listenCount.toLocaleString()} plays`,
                ),
                'Hours',
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 420,
              xaxis: { title: { text: 'Hours' }, gridcolor: '#2a2a2a' },
              yaxis: { automargin: true },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        <YearDrilldownChart
          title="Top artists by year"
          years={years}
          dataByPlays={analysis.topArtistsByYear}
          dataByTime={analysis.topArtistsByYearByTime}
          labelKey="artistName"
        />
      </div>
    );
  }

  if (activeTab === 'timeline') {
    return (
      <div className="dashboard-grid">
        <ChartCard title="Plays by year" subtitle="Hover to see the top song each year.">
          <Plot
            data={[
              lineChart(
                analysis.playsByYear.map((point) => point.label),
                analysis.playsByYear.map((point) => point.value),
                analysis.playsByYear.map((point) => point.topItem ?? ''),
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 360,
              xaxis: { title: { text: 'Year' }, dtick: 1, gridcolor: '#2a2a2a' },
              yaxis: { title: { text: 'Plays' }, gridcolor: '#2a2a2a' },
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
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 360,
              xaxis: { title: { text: 'Year' }, dtick: 1, gridcolor: '#2a2a2a' },
              yaxis: { title: { text: 'Hours' }, gridcolor: '#2a2a2a' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        <ChartCard
          title="Daily plays"
          subtitle="Most-listened song per day appears on hover. Narrow the year filter for easier reading."
        >
          <Plot
            data={[
              lineChart(
                analysis.playsByDate.map((point) => point.label),
                analysis.playsByDate.map((point) => point.value),
                analysis.playsByDate.map((point) => point.topItem ?? ''),
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 360,
              xaxis: { title: { text: 'Date (UTC)' }, gridcolor: '#2a2a2a' },
              yaxis: { title: { text: 'Plays' }, gridcolor: '#2a2a2a' },
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
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 360,
              xaxis: { title: { text: 'Date (UTC)' }, gridcolor: '#2a2a2a' },
              yaxis: { title: { text: 'Hours' }, gridcolor: '#2a2a2a' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>

        <ChartCard title="Playtime by month across your history">
          <Plot
            data={[
              lineChart(
                analysis.playtimeByYearMonth.map((point) => point.label),
                analysis.playtimeByYearMonth.map((point) => point.value),
                analysis.playtimeByYearMonth.map((point) => point.topItem ?? ''),
                'Hours',
              ),
            ]}
            layout={{
              ...plotLayout,
              height: 360,
              xaxis: { title: { text: 'Year — month' }, gridcolor: '#2a2a2a', tickangle: -45 },
              yaxis: { title: { text: 'Hours' }, gridcolor: '#2a2a2a' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </ChartCard>
      </div>
    );
  }

  if (activeTab === 'explore') {
    return (
      <div className="dashboard-grid">
        <ChartCard
          title="All songs"
          subtitle="Sort, search, and paginate your full song history for the current filters."
        >
          <DataTable
            rows={analysis.allSongs}
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

        <ChartCard title="All artists" subtitle="Every artist in the filtered dataset.">
          <DataTable
            rows={analysis.allArtists}
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
            rows={[...analysis.records]
              .sort((a, b) => b.msPlayed - a.msPlayed)
              .slice(0, 100)}
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
                label: 'Played at (UTC)',
                render: (row) => row.ts.toUTCString(),
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
            ),
          ]}
          layout={{
            ...plotLayout,
            height: 360,
            xaxis: { title: { text: 'Month' }, gridcolor: '#2a2a2a' },
            yaxis: { title: { text: 'Plays' }, gridcolor: '#2a2a2a' },
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
            ),
          ]}
          layout={{
            ...plotLayout,
            height: 360,
            xaxis: { title: { text: 'Month' }, gridcolor: '#2a2a2a' },
            yaxis: { title: { text: 'Hours' }, gridcolor: '#2a2a2a' },
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
            ),
          ]}
          layout={{
            ...plotLayout,
            height: 360,
            xaxis: { title: { text: 'Day of month' }, gridcolor: '#2a2a2a' },
            yaxis: { title: { text: 'Plays' }, gridcolor: '#2a2a2a' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </ChartCard>

      <ChartCard title="Plays by hour of day (UTC)">
        <Plot
          data={[
            verticalBarChart(
              analysis.playsByHour.map((point) => point.label),
              analysis.playsByHour.map((point) => point.value),
              analysis.playsByHour.map((point) => point.topItem ?? ''),
            ),
          ]}
          layout={{
            ...plotLayout,
            height: 360,
            xaxis: { title: { text: 'Hour (UTC)' }, tickangle: -45, gridcolor: '#2a2a2a' },
            yaxis: { title: { text: 'Plays' }, gridcolor: '#2a2a2a' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </ChartCard>

      <ChartCard
        title="Listening history over the years"
        subtitle="Monthly playtime by calendar year. Each line is one year in your filtered data."
      >
        <Plot
          data={multiYearLineSeries(analysis.monthlyHistoryByYear, 'Hours')}
          layout={{
            ...plotLayout,
            height: 420,
            xaxis: { title: { text: 'Month' }, gridcolor: '#2a2a2a' },
            yaxis: { title: { text: 'Hours' }, gridcolor: '#2a2a2a' },
            legend: { orientation: 'h', y: 1.15 },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </ChartCard>
    </div>
  );
}
