import { useMemo } from 'react';
import type { Theme } from '../../hooks/useTheme';
import { formatHours } from '../../utils/formatting';
import type { AlbumStats, ArtistStats, RankingMetric, SongStats, StreamRecord } from '../../types';
import { RankedBarPlot } from './RankedBarPlot';
import { VisualizationShell } from './VisualizationShell';
import { DataTable } from '../DataTable';
import { YearTopExpandableTable } from './YearTopExpandableTable';
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

function YearTopList({
  entries,
  metricLabel,
}: {
  entries: ReturnType<typeof buildYearTopEntries>;
  metricLabel: string;
}) {
  return (
    <div className="divide-y divide-border" role="list">
      {entries.map((entry) => (
        <article
          key={entry.year}
          className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
          role="listitem"
        >
          <span className="shrink-0 w-12 text-sm font-bold tabular-nums text-muted-foreground">
            {entry.year}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold break-words">{entry.name}</p>
            {entry.detail ? (
              <p className="text-xs text-muted-foreground break-words">{entry.detail}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums">
              {metricLabel === 'Plays'
                ? entry.plays.toLocaleString()
                : formatHours(entry.hours)}
            </p>
            <p className="text-xs text-muted-foreground">{metricLabel}</p>
          </div>
        </article>
      ))}
    </div>
  );
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

  const useExpandableTable =
    records != null && (labelKey === 'albumName' || labelKey === 'artistName');

  if (entries.length === 0) {
    return null;
  }

  const showArtistColumn = labelKey === 'trackName' || labelKey === 'albumName';

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

      {viewMode === 'grid' ? <YearTopList entries={entries} metricLabel={metricLabel} /> : null}

      {viewMode === 'table' ? (
        useExpandableTable ? (
          <YearTopExpandableTable
            entries={entries}
            labelKey={labelKey}
            songBreakdowns={songBreakdowns}
          />
        ) : (
          <DataTable
            rows={entries}
            rowKey={(row) => String(row.year)}
            columns={[
              { key: 'year', label: 'Year', align: 'right' },
              { key: 'name', label: entity.column },
              ...(showArtistColumn
                ? [
                    {
                      key: 'detail' as const,
                      label: 'Artist',
                      render: (row: (typeof entries)[number]) => row.detail ?? '—',
                    },
                  ]
                : []),
              {
                key: 'plays',
                label: 'Plays',
                align: 'right' as const,
                render: (row) => row.plays.toLocaleString(),
              },
              {
                key: 'hours',
                label: 'Playtime',
                align: 'right' as const,
                render: (row) => formatHours(row.hours),
              },
            ]}
            searchPlaceholder="Filter years…"
          />
        )
      ) : null}
    </VisualizationShell>
  );
}
