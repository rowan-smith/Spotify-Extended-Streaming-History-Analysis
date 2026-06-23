import { forwardRef } from 'react';
import Plot, { type PlotHandle } from '@/charts/Plot';
import { getPlotTheme, horizontalBarChart, rankedBarChartLayout } from '@/charts/plotHelpers';
import type { Theme } from '@/hooks/useTheme';

interface RankedBarPlotProps {
  labels: string[];
  values: number[];
  hover?: string[];
  xTitle: string;
  yTitle?: string;
  categoryLabels?: string[];
  theme: Theme;
  compact: boolean;
  onZoomChange?: (zoomed: boolean) => void;
}

export const RankedBarPlot = forwardRef<PlotHandle, RankedBarPlotProps>(function RankedBarPlot(
  { labels, values, hover, xTitle, yTitle, categoryLabels, theme, compact, onZoomChange },
  ref,
) {
  const plotTheme = getPlotTheme(theme === 'dark');
  const chartLayout = rankedBarChartLayout(labels.length, compact);
  const showCategoryAxis = categoryLabels != null && categoryLabels.length > 0;
  const showYAxisLabels = showCategoryAxis || !chartLayout.inlineLabels;

  return (
    <Plot
      ref={ref}
      onZoomChange={onZoomChange}
      data={[
        horizontalBarChart(labels, values, hover, xTitle, {
          inlineLabels: chartLayout.inlineLabels,
          accent: plotTheme.accent,
          categoryLabels,
        }),
      ]}
      layout={{
        ...plotTheme.layout,
        height: chartLayout.height,
        margin: showCategoryAxis
          ? { l: yTitle ? 56 : 48, r: 16, t: 16, b: 48 }
          : chartLayout.inlineLabels
            ? { l: 12, r: 16, t: 16, b: 48 }
            : plotTheme.layout.margin,
        bargap: labels.length > 30 ? 0.08 : 0.15,
        xaxis: { title: { text: xTitle }, gridcolor: plotTheme.grid },
        yaxis: {
          automargin: showYAxisLabels,
          showticklabels: showYAxisLabels,
          title: yTitle ? { text: yTitle } : undefined,
          ticklen: showYAxisLabels ? undefined : 0,
          tickfont: labels.length > 40 ? { size: 10 } : undefined,
        },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
});
