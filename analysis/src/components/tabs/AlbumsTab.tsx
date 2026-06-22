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

interface AlbumsTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  years: number[];
  showMultiYearCharts: boolean;
  theme: Theme;
  compact: boolean;
}

export function AlbumsTab({
  analysis,
  topNLabel,
  years,
  showMultiYearCharts,
  theme,
  compact,
}: AlbumsTabProps) {
  const [metric, setMetric] = useState<'plays' | 'time'>('plays');
  const albums = metric === 'plays' ? analysis.topAlbumsByPlays : analysis.topAlbumsByTime;

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
