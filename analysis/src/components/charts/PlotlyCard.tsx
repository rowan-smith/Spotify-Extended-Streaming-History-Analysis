import { useMemo } from 'react';
import type { Layout, Config, Data } from 'plotly.js-dist-min';
import { getPlotTheme } from '@/charts/plotHelpers';
import Plot, { type PlotHandle } from '@/charts/Plot';
import type { TimelinePoint } from '@/types';
import { DataTable } from '@/components/DataTable';
import { useVisualizationView } from '@/hooks/useVisualizationView';
import { VisualizationShell } from './VisualizationShell';
import { TimelinePointGrid } from './TimelinePointGrid';
import type { ReactNode, RefObject } from 'react';
import type { ViewMode } from './viewMode';

interface PlotlyCardProps {
  title: string;
  subtitle?: string;
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  theme: 'light' | 'dark';
  height?: number;
  className?: string;
  points?: TimelinePoint[];
  pointsValueLabel?: string;
  tableView?: ReactNode;
  gridView?: ReactNode;
  viewControls?: {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    chartZoomed: boolean;
    onChartReset: () => void;
    plotRef: RefObject<PlotHandle | null>;
    onZoomChange: (zoomed: boolean) => void;
  };
}

export function PlotlyCard({
  title,
  subtitle,
  data,
  layout,
  config,
  theme,
  height = 360,
  className,
  points,
  pointsValueLabel = 'Value',
  tableView,
  gridView,
  viewControls,
}: PlotlyCardProps) {
  const internalView = useVisualizationView(false);
  const viewMode = viewControls?.viewMode ?? internalView.viewMode;
  const setViewMode = viewControls?.onViewModeChange ?? internalView.setViewMode;
  const chartZoomed = viewControls?.chartZoomed ?? internalView.chartZoomed;
  const resetChartView = viewControls?.onChartReset ?? internalView.resetChartView;
  const plotRef = viewControls?.plotRef ?? internalView.plotRef;
  const setChartZoomed = viewControls?.onZoomChange ?? internalView.setChartZoomed;

  const plotTheme = useMemo(() => getPlotTheme(theme === 'dark'), [theme]);

  const mergedLayout: Partial<Layout> = useMemo(
    () => ({
      ...plotTheme.layout,
      height,
      ...layout,
      font: { ...plotTheme.layout.font, ...layout?.font },
      xaxis: {
        gridcolor: plotTheme.grid,
        ...layout?.xaxis,
        title: {
          ...(typeof layout?.xaxis?.title === 'object' ? layout.xaxis.title : {}),
          ...(typeof layout?.xaxis?.title === 'string' ? { text: layout.xaxis.title } : {}),
        },
      },
      yaxis: {
        gridcolor: plotTheme.grid,
        ...layout?.yaxis,
        title: {
          ...(typeof layout?.yaxis?.title === 'object' ? layout.yaxis.title : {}),
          ...(typeof layout?.yaxis?.title === 'string' ? { text: layout.yaxis.title } : {}),
        },
      },
    }),
    [plotTheme, height, layout],
  );

  const resolvedTableView =
    tableView ??
    (points ? (
      <DataTable
        rows={points}
        rowKey={(row) => row.label}
        columns={[
          { key: 'label', label: 'Label' },
          {
            key: 'value',
            label: pointsValueLabel,
            align: 'right',
            render: (row) => row.value.toLocaleString(),
          },
          {
            key: 'topItem',
            label: 'Top item',
            render: (row) => row.topItem ?? '—',
          },
        ]}
        searchPlaceholder="Filter rows…"
      />
    ) : null);

  const resolvedGridView =
    gridView ??
    (points ? <TimelinePointGrid points={points} valueLabel={pointsValueLabel} /> : null);

  return (
    <VisualizationShell
      title={title}
      subtitle={subtitle}
      className={className}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      chartZoomed={chartZoomed}
      onChartReset={resetChartView}
    >
      {viewMode === 'chart' ? (
        <Plot
          ref={plotRef}
          onZoomChange={setChartZoomed}
          data={data}
          layout={mergedLayout}
          config={{ displayModeBar: false, responsive: true, ...config }}
          useResizeHandler
          style={{ width: '100%' }}
        />
      ) : null}
      {viewMode === 'table' ? resolvedTableView : null}
      {viewMode === 'grid' ? resolvedGridView : null}
    </VisualizationShell>
  );
}
