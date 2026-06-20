import type { PlotData } from 'plotly.js-dist-min';
import type { YearSeries } from '../types';

export const plotLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { color: '#e8eaed', family: 'Segoe UI, system-ui, sans-serif' },
  margin: { l: 40, r: 24, t: 48, b: 40 },
  hovermode: 'closest' as const,
};

const SERIES_COLORS = [
  '#1db954',
  '#1ed760',
  '#2ecc71',
  '#58d68d',
  '#82e0aa',
  '#a9dfbf',
  '#5dade2',
  '#48c9b0',
  '#f4d03f',
  '#eb984e',
];

export function horizontalBarChart(
  labels: string[],
  values: number[],
  hoverText?: string[],
  xTitle = 'Count',
): Partial<PlotData> {
  return {
    type: 'bar',
    orientation: 'h',
    y: [...labels].reverse(),
    x: [...values].reverse(),
    text: hoverText ? [...hoverText].reverse() : undefined,
    hovertemplate: hoverText
      ? '%{y}<br>%{x}<br>%{text}<extra></extra>'
      : '%{y}<br>%{x}<extra></extra>',
    marker: { color: '#1db954' },
    name: xTitle,
  };
}

export function lineChart(
  labels: string[],
  values: number[],
  hoverText?: string[],
  yTitle = 'Count',
): Partial<PlotData> {
  return {
    type: 'scatter',
    mode: 'lines+markers',
    x: labels,
    y: values,
    text: hoverText,
    hovertemplate: hoverText
      ? '%{x}<br>%{y}<br>Top: %{text}<extra></extra>'
      : '%{x}<br>%{y}<extra></extra>',
    line: { color: '#1db954', width: 2 },
    marker: { color: '#1ed760' },
    name: yTitle,
  };
}

export function verticalBarChart(
  labels: string[],
  values: number[],
  hoverText?: string[],
  yTitle = 'Count',
): Partial<PlotData> {
  return {
    type: 'bar',
    x: labels,
    y: values,
    text: hoverText,
    hovertemplate: hoverText
      ? '%{x}<br>%{y}<br>Top: %{text}<extra></extra>'
      : '%{x}<br>%{y}<extra></extra>',
    marker: { color: '#1db954' },
    name: yTitle,
  };
}

export function multiYearLineSeries(series: YearSeries[], yTitle = 'Hours'): Partial<PlotData>[] {
  return series.map((entry, index) => ({
    type: 'scatter',
    mode: 'lines+markers',
    name: String(entry.year),
    x: entry.points.map((point) => point.label.split('-')[1] ?? point.label),
    y: entry.points.map((point) => point.value),
    line: { color: SERIES_COLORS[index % SERIES_COLORS.length], width: 2 },
    marker: { size: 5 },
    hovertemplate: `${entry.year}-%{x}<br>%{y:.1f} ${yTitle}<extra></extra>`,
  }));
}
