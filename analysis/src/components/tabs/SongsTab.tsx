import { useState } from 'react';
import { PLAYS_VS_TIME_INFO } from '../../content/siteContent';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import { ChartCard } from '../charts/ChartCard';
import { MetricTabs } from '../charts/MetricTabs';
import { MobileRankedList } from '../charts/MobileRankedList';
import { RankedBarChart } from '../charts/RankedBarChart';
import { YearDrilldownChart } from '../charts/YearDrilldownChart';
import type { AnalysisResult } from '../../types';

interface SongsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showMultiYearCharts: boolean;
  theme: Theme;
  compact: boolean;
}

export function SongsTab({
  analysis,
  topNLabel,
  years,
  showMultiYearCharts,
  theme,
  compact,
}: SongsTabProps) {
  const [metric, setMetric] = useState<'plays' | 'time'>('plays');
  const songs = metric === 'plays' ? analysis.topSongsByPlays : analysis.topSongsByTime;

  return (
    <div className="grid gap-6 min-w-0">
      <MetricTabs
        active={metric}
        onChange={setMetric}
        playsInfo={PLAYS_VS_TIME_INFO.plays}
        timeInfo={PLAYS_VS_TIME_INFO.time}
      />
      <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted px-4 py-3">
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
