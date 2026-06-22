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

interface ArtistsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showMultiYearCharts: boolean;
  theme: Theme;
  compact: boolean;
}

export function ArtistsTab({
  analysis,
  topNLabel,
  years,
  showMultiYearCharts,
  theme,
  compact,
}: ArtistsTabProps) {
  const [metric, setMetric] = useState<'plays' | 'time'>('plays');
  const artists = metric === 'plays' ? analysis.topArtistsByPlays : analysis.topArtistsByTime;

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
