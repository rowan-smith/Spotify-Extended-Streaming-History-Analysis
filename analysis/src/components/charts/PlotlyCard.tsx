import { useMemo } from 'react';
import type { Layout, Config, Data } from 'plotly.js-dist-min';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getPlotTheme } from '@/charts/plotHelpers';
import Plot from '@/charts/Plot';

interface PlotlyCardProps {
  title: string;
  subtitle?: string;
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  theme: 'light' | 'dark';
  height?: number;
  className?: string;
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
}: PlotlyCardProps) {
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <Plot
          data={data}
          layout={mergedLayout}
          config={{ displayModeBar: false, responsive: true, ...config }}
          useResizeHandler
          style={{ width: '100%' }}
        />
      </CardContent>
    </Card>
  );
}
