import { useState } from 'react';
import { MIN_PLAYS_FOR_LEAST_SKIPPED } from '../../analysis/exploration';
import { verticalBarChart } from '../../charts/plotHelpers';
import { DISCOVER_INFO } from '../../content/siteContent';
import type { Theme } from '../../hooks/useTheme';
import { formatLocalDateTime } from '../../utils/formatting';
import type { AnalysisResult } from '../../types';
import { ChartCard } from '../charts/ChartCard';
import { PlotlyCard } from '../charts/PlotlyCard';
import { RankedBarChart } from '../charts/RankedBarChart';
import { MobileRankedList } from '../charts/MobileRankedList';
import { FancyRankedListPanel } from '../charts/FancyRankedListPanel';
import { InfoTooltip } from '../InfoTooltip';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface DiscoverTabProps {
  analysis: AnalysisResult;
  topNLabel: number;
  theme: Theme;
  compact: boolean;
}

type SkipView = 'most' | 'least';

function formatSkipRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

export function DiscoverTab({ analysis, topNLabel, theme, compact }: DiscoverTabProps) {
  const [skipView, setSkipView] = useState<SkipView>('most');
  const skipSongs = skipView === 'most' ? analysis.mostSkippedSongs : analysis.leastSkippedSongs;
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact);
  const skipTitle =
    skipView === 'most' ? `Top ${topNLabel} most skipped` : `Top ${topNLabel} least skipped`;

  return (
    <div className="grid gap-6 min-w-0">
      <section className="grid gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Skip patterns
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {skipView === 'most' ? DISCOVER_INFO.mostSkipped : DISCOVER_INFO.leastSkipped}
            </p>
          </div>
          <ToggleGroup
            value={[skipView]}
            onValueChange={(value) => {
              if (value.length > 0) setSkipView(value[0] as SkipView);
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="most" className="text-xs px-3">
              Most skipped
            </ToggleGroupItem>
            <ToggleGroupItem value="least" className="text-xs px-3">
              Least skipped
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {skipSongs.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted px-4 py-3">
            {skipView === 'most'
              ? 'No skipped plays in this range.'
              : `No tracks with at least ${MIN_PLAYS_FOR_LEAST_SKIPPED} plays and at least one completed listen.`}
          </p>
        ) : compact ? (
          <ChartCard
            title={skipView === 'most' ? `Top ${topNLabel} most skipped` : `Top ${topNLabel} least skipped`}
          >
            <MobileRankedList
              metricLabel="Skips"
              items={skipSongs.map((song) => ({
                primary: song.trackName,
                secondary: song.artistName,
                value: song.skipCount,
                valueText: song.skipCount.toLocaleString(),
                meta: `${song.totalPlays.toLocaleString()} plays · ${formatSkipRate(song.skipRate)}`,
              }))}
            />
          </ChartCard>
        ) : (
          <RankedBarChart
            title={skipTitle}
            labels={skipSongs.map((song) => song.trackName)}
            values={skipSongs.map((song) => song.skipCount)}
            hover={skipSongs.map(
              (song) =>
                `${song.artistName}<br>${song.skipCount.toLocaleString()} skips · ${song.totalPlays.toLocaleString()} plays · ${formatSkipRate(song.skipRate)}`,
            )}
            xTitle="Skips"
            theme={theme}
            compact={compact}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            chartZoomed={chartZoomed}
            onChartReset={resetChartView}
            plotRef={plotRef}
            onZoomChange={setChartZoomed}
            listView={
              <MobileRankedList
                metricLabel="Skips"
                items={skipSongs.map((song) => ({
                  primary: song.trackName,
                  secondary: song.artistName,
                  value: song.skipCount,
                  valueText: song.skipCount.toLocaleString(),
                  meta: `${song.totalPlays.toLocaleString()} plays · ${formatSkipRate(song.skipRate)}`,
                }))}
              />
            }
          />
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1">
            Best discovery days
            <InfoTooltip text={DISCOVER_INFO.discoveryDays} />
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Days when you heard the most new tracks for the first time.
          </p>
        </div>

        {analysis.discoveryDays.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted px-4 py-3">
            No first-time listens in this range.
          </p>
        ) : (
          <>
            <PlotlyCard
              title={`Top ${topNLabel} discovery days`}
              data={[
                verticalBarChart(
                  analysis.discoveryDays.map((day) => day.day),
                  analysis.discoveryDays.map((day) => day.discoveries),
                  analysis.discoveryDays.map((day) => day.topDiscovery),
                  'New tracks',
                ),
              ]}
              layout={{
                xaxis: { title: { text: 'Date' }, tickangle: -45, automargin: true },
                yaxis: { title: { text: 'New tracks' } },
              }}
              theme={theme}
              height={360}
            />

            <ChartCard title="Discovery day details">
              <FancyRankedListPanel
                metricLabel="New tracks"
                searchPlaceholder="Search dates or tracks…"
                pageSize={15}
                items={analysis.discoveryDays.map((day) => ({
                  primary: day.day,
                  secondary: day.topDiscovery,
                  value: day.discoveries,
                  valueText: day.discoveries.toLocaleString(),
                }))}
              />
            </ChartCard>
          </>
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1">
            Discovery history
            <InfoTooltip text={DISCOVER_INFO.discoveryHistory} />
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Every first-time listen in chronological order for your current filters.
          </p>
        </div>

        <ChartCard title="First listens">
          <FancyRankedListPanel
            metricLabel="Discovered"
            searchPlaceholder="Search discoveries…"
            pageSize={25}
            items={analysis.discoveryHistory.map((row) => ({
              primary: row.trackName,
              secondary: row.artistName,
              value: row.discoveredAt.getTime(),
              valueText: formatLocalDateTime(row.discoveredAt),
            }))}
          />
        </ChartCard>
      </section>
    </div>
  );
}
