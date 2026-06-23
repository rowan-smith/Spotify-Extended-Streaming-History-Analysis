import type { ReactNode } from 'react';
import { ChartCard } from './ChartCard';
import { ChartViewToolbar } from './ChartViewToolbar';
import { ALL_VIEW_MODES, type ViewMode } from './viewMode';

interface VisualizationShellProps {
  title: string;
  subtitle?: string;
  className?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
  chartZoomed?: boolean;
  onChartReset?: () => void;
  children: ReactNode;
}

export function VisualizationShell({
  title,
  subtitle,
  className,
  viewMode,
  onViewModeChange,
  modes = ALL_VIEW_MODES,
  chartZoomed = false,
  onChartReset,
  children,
}: VisualizationShellProps) {
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      className={className}
      actions={
        <ChartViewToolbar
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          modes={modes}
          showChartReset={viewMode === 'chart' && chartZoomed}
          onChartReset={onChartReset}
        />
      }
    >
      {children}
    </ChartCard>
  );
}
