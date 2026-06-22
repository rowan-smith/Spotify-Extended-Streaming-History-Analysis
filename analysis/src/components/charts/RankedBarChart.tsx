import Plot from '../../charts/Plot';
import { getPlotTheme, horizontalBarChart, rankedBarChartLayout } from '../../charts/plotHelpers';
import type { Theme } from '../../hooks/useTheme';
import { ChartCard } from './ChartCard';

interface RankedBarChartProps {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  hover?: string[];
  xTitle: string;
  theme: Theme;
  compact: boolean;
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
}: RankedBarChartProps) {
  const plotTheme = getPlotTheme(theme === 'dark');
  const chartLayout = rankedBarChartLayout(labels.length, compact);

  return (
    <ChartCard
      title={title}
      subtitle={
        subtitle ??
        (labels.length > 25 ? 'Scroll the page to see every ranked item.' : undefined)
      }
    >
      <Plot
        data={[
          horizontalBarChart(labels, values, hover, xTitle, {
            inlineLabels: chartLayout.inlineLabels,
            accent: plotTheme.accent,
          }),
        ]}
        layout={{
          ...plotTheme.layout,
          height: chartLayout.height,
          bargap: labels.length > 30 ? 0.08 : 0.15,
          xaxis: { title: { text: xTitle }, gridcolor: plotTheme.grid },
          yaxis: {
            automargin: !chartLayout.inlineLabels,
            showticklabels: !chartLayout.inlineLabels,
            tickfont: labels.length > 40 ? { size: 10 } : undefined,
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </ChartCard>
  );
}
