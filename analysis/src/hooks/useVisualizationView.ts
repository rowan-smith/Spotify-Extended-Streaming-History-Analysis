import { useRef, useState } from 'react';
import type { PlotHandle } from '@/charts/Plot';
import { defaultViewMode, type ViewMode } from '@/components/charts/viewMode';

export function useVisualizationView(compact: boolean, defaultMode?: ViewMode) {
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => defaultMode ?? defaultViewMode(compact),
  );
  const [chartZoomed, setChartZoomed] = useState(false);
  const plotRef = useRef<PlotHandle>(null);

  function resetChartView() {
    plotRef.current?.resetZoom();
    setChartZoomed(false);
  }

  return {
    viewMode,
    setViewMode,
    chartZoomed,
    setChartZoomed,
    plotRef,
    resetChartView,
  };
}
