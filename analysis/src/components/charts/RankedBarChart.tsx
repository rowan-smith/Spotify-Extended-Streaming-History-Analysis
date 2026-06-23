import type { ReactNode } from 'react';
import { VisualizationShell } from './VisualizationShell';
import { RankedBarPlot } from './RankedBarPlot';
import type { Theme } from '@/hooks/useTheme';
import type { PlotHandle } from '@/charts/Plot';
import type { RefObject } from 'react';
import type { ViewMode } from './viewMode';

interface RankedBarChartProps {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  hover?: string[];
  xTitle: string;
  theme: Theme;
  compact: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  chartZoomed: boolean;
  onChartReset: () => void;
  plotRef: RefObject<PlotHandle | null>;
  onZoomChange: (zoomed: boolean) => void;
  listView: ReactNode;
}

export function RankedBarChart({
  title,
  subtitle,
  labels,
  values,
  hover,
  xTitle,
  theme,
  compact,
  viewMode,
  onViewModeChange,
  chartZoomed,
  onChartReset,
  plotRef,
  onZoomChange,
  listView,
}: RankedBarChartProps) {
  return (
    <VisualizationShell
      title={title}
      subtitle={
        subtitle ??
        (labels.length > 25 ? 'Scroll the page to see every ranked item.' : undefined)
      }
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      chartZoomed={chartZoomed}
      onChartReset={onChartReset}
    >
      {viewMode === 'chart' ? (
        <RankedBarPlot
          ref={plotRef}
          labels={labels}
          values={values}
          hover={hover}
          xTitle={xTitle}
          theme={theme}
          compact={compact}
          onZoomChange={onZoomChange}
        />
      ) : null}
      {viewMode === 'table' ? listView : null}
    </VisualizationShell>
  );
}
