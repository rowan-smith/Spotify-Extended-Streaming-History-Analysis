import { forwardRef } from 'react';
import Plot, { type PlotHandle } from '@/charts/Plot';
import { getPlotTheme, horizontalBarChart, rankedBarChartLayout } from '@/charts/plotHelpers';
import type { Theme } from '@/hooks/useTheme';

interface RankedBarPlotProps {
  labels: string[];
  values: number[];
  hover?: string[];
  xTitle: string;
  theme: Theme;
  compact: boolean;
  onZoomChange?: (zoomed: boolean) => void;
}

export const RankedBarPlot = forwardRef<PlotHandle, RankedBarPlotProps>(function RankedBarPlot(
  { labels, values, hover, xTitle, theme, compact, onZoomChange },
  ref,
) {
  const plotTheme = getPlotTheme(theme === 'dark');
  const chartLayout = rankedBarChartLayout(labels.length, compact);

  return (
    <Plot
      ref={ref}
      onZoomChange={onZoomChange}
      data={[
        horizontalBarChart(labels, values, hover, xTitle, {
          inlineLabels: chartLayout.inlineLabels,
          accent: plotTheme.accent,
        }),
      ]}
      layout={{
        ...plotTheme.layout,
        height: chartLayout.height,
        margin: chartLayout.inlineLabels
          ? { l: 12, r: 16, t: 16, b: 48 }
          : plotTheme.layout.margin,
        bargap: labels.length > 30 ? 0.08 : 0.15,
        xaxis: { title: { text: xTitle }, gridcolor: plotTheme.grid },
        yaxis: {
          automargin: !chartLayout.inlineLabels,
          showticklabels: !chartLayout.inlineLabels,
          ticklen: chartLayout.inlineLabels ? 0 : undefined,
          tickfont: labels.length > 40 ? { size: 10 } : undefined,
        },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
});
