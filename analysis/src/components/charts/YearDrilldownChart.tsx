import { useMemo } from 'react';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import type { AlbumStats, ArtistStats, RankingMetric, SongStats, StreamRecord } from '../../types';
import { RankedBarPlot } from './RankedBarPlot';
import { VisualizationShell } from './VisualizationShell';
import { YearTopExpandableList } from './YearTopExpandableList';
import { MobileRankedList } from './MobileRankedList';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import {
  buildYearTopEntries,
  buildYearTopSongBreakdowns,
  metricValueForEntry,
  YEAR_TOP_ENTITY_LABELS,
  type YearTopLabelKey,
} from './yearTopBreakdown';

interface YearDrilldownChartProps {
  title: string;
  years: number[];
  spanLabel: string;
  dataByPlays: Record<number, SongStats[] | ArtistStats[] | AlbumStats[]>;
  dataByTime: Record<number, SongStats[] | ArtistStats[] | AlbumStats[]>;
  labelKey: YearTopLabelKey;
  rankingMetric: RankingMetric;
  records?: StreamRecord[];
  theme: Theme;
  compact: boolean;
}

export function YearDrilldownChart({
  title,
  years,
  spanLabel,
  dataByPlays,
  dataByTime,
  labelKey,
  rankingMetric,
  records,
  theme,
  compact,
}: YearDrilldownChartProps) {
  const {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  } = useVisualizationView(compact, 'table');

  const entity = YEAR_TOP_ENTITY_LABELS[labelKey];
  const metricLabel = rankingMetric === 'plays' ? 'Plays' : 'Hours';

  const entries = useMemo(
    () =>
      buildYearTopEntries(
        years,
        rankingMetric === 'plays' ? dataByPlays : dataByTime,
        labelKey,
      ),
    [years, dataByPlays, dataByTime, labelKey, rankingMetric],
  );

  const chartLabels = useMemo(() => entries.map((entry) => entry.name), [entries]);
  const chartYears = useMemo(() => entries.map((entry) => String(entry.year)), [entries]);
  const chartValues = useMemo(
    () => entries.map((entry) => metricValueForEntry(entry, rankingMetric)),
    [entries, rankingMetric],
  );
  const chartHover = useMemo(
    () =>
      entries.map((entry) => {
        const metricText =
          rankingMetric === 'plays'
            ? `${entry.plays.toLocaleString()} plays`
            : `${formatHours(entry.hours)} total`;
        const detail = entry.detail ? `<br>${entry.detail}` : '';
        return `${entry.year}${detail}<br>${metricText}`;
      }),
    [entries, rankingMetric],
  );

  const songBreakdowns = useMemo(
    () =>
      records
        ? buildYearTopSongBreakdowns(entries, records, labelKey, rankingMetric)
        : new Map<string, SongStats[]>(),
    [entries, records, labelKey, rankingMetric],
  );

  const useExpandableList = records != null;

  if (entries.length === 0) {
    return null;
  }

  return (
    <VisualizationShell
      title={title}
      subtitle={`Top ${entity.singular} each year in ${spanLabel}, ranked by ${rankingMetric === 'plays' ? 'play count' : 'playtime'}.`}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      chartZoomed={chartZoomed}
      onChartReset={resetChartView}
    >
      {viewMode === 'chart' ? (
        <RankedBarPlot
          ref={plotRef}
          labels={chartLabels}
          categoryLabels={chartYears}
          yTitle="Year"
          values={chartValues}
          hover={chartHover}
          xTitle={metricLabel}
          theme={theme}
          compact={compact}
          onZoomChange={setChartZoomed}
        />
      ) : null}

      {viewMode === 'table' ? (
        useExpandableList ? (
          <YearTopExpandableList
            entries={entries}
            labelKey={labelKey}
            rankingMetric={rankingMetric}
            songBreakdowns={songBreakdowns}
          />
        ) : (
          <MobileRankedList
            metricLabel={metricLabel}
            items={entries.map((entry) => ({
              primary: entry.name,
              secondary: entry.detail,
              badge: String(entry.year),
              value: metricValueForEntry(entry, rankingMetric),
              valueText:
                rankingMetric === 'plays'
                  ? entry.plays.toLocaleString()
                  : formatHours(entry.hours),
              meta:
                rankingMetric === 'plays'
                  ? formatHours(entry.hours)
                  : `${entry.plays.toLocaleString()} plays`,
            }))}
          />
        )
      ) : null}
    </VisualizationShell>
  );
}
