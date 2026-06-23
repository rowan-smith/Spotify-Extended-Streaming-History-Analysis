import type { Config, Layout, PlotData } from 'plotly.js-dist-min';
import type { YearSeries } from '../types';

export function getPlotTheme(isDark: boolean) {
  const text = isDark ? '#e8eaed' : '#1a1d21';
  const grid = isDark ? '#2a2a2a' : '#d8dde3';
  const accent = '#1db954';

  return {
    text,
    grid,
    accent,
    layout: {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: text, family: 'Segoe UI, system-ui, sans-serif' },
      margin: { l: 40, r: 24, t: 48, b: 40 },
      hovermode: 'closest' as const,
    } satisfies Partial<Layout>,
  };
}

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

export function rankedBarChartLayout(
  itemCount: number,
  compactViewport: boolean,
): { height: number; inlineLabels: boolean } {
  const inlineLabels = compactViewport && itemCount <= 15;
  const pxPerBar = inlineLabels ? 24 : 28;
  const padding = inlineLabels ? 72 : 96;
  const minHeight = compactViewport ? 460 : 420;
  const maxHeight = 3200;

  return {
    inlineLabels,
    height: Math.min(maxHeight, Math.max(minHeight, itemCount * pxPerBar + padding)),
  };
}

export function horizontalBarChart(
  labels: string[],
  values: number[],
  hoverText?: string[],
  xTitle = 'Count',
  options?: { inlineLabels?: boolean; accent?: string; categoryLabels?: string[] },
): Partial<PlotData> {
  const inlineLabels = options?.inlineLabels ?? false;
  const categoryLabels = options?.categoryLabels;
  const hasCategories = categoryLabels != null && categoryLabels.length > 0;
  const reversedLabels = [...labels].reverse();
  const reversedValues = [...values].reverse();
  const reversedHover = hoverText ? [...hoverText].reverse() : undefined;
  const reversedCategories = hasCategories ? [...categoryLabels].reverse() : null;
  const useInsideBarText = inlineLabels || hasCategories;

  if (useInsideBarText) {
    const yValues = reversedCategories ?? reversedLabels;
    const insideText = reversedLabels;

    return {
      type: 'bar',
      orientation: 'h',
      y: yValues,
      x: reversedValues,
      text: insideText,
      textposition: 'inside',
      insidetextanchor: 'start',
      textangle: 0,
      constraintext: 'inside',
      cliponaxis: false,
      textfont: { color: '#08140c', size: 11 },
      hovertext: reversedHover ?? insideText,
      hovertemplate: '%{hovertext}<br>%{x}<extra></extra>',
      marker: { color: options?.accent ?? '#1db954' },
      name: xTitle,
    };
  }

  const yValues = reversedCategories ?? reversedLabels;

  return {
    type: 'bar',
    orientation: 'h',
    y: yValues,
    x: reversedValues,
    text: reversedHover,
    hovertemplate: hoverText
      ? '%{y}<br>%{x}<br>%{text}<extra></extra>'
      : '%{y}<br>%{x}<extra></extra>',
    marker: { color: options?.accent ?? '#1db954' },
    name: xTitle,
  };
}

export function lineChart(
  labels: string[],
  values: number[],
  hoverText?: string[],
  yTitle = 'Count',
  accent = '#1db954',
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
    line: { color: accent, width: 2 },
    marker: { color: '#1ed760' },
    name: yTitle,
  };
}

export function verticalBarChart(
  labels: string[],
  values: number[],
  hoverText?: string[],
  yTitle = 'Count',
  accent = '#1db954',
): Partial<PlotData> {
  return {
    type: 'bar',
    x: labels,
    y: values,
    text: hoverText,
    hovertemplate: hoverText
      ? '%{x}<br>%{y}<br>Top: %{text}<extra></extra>'
      : '%{x}<br>%{y}<extra></extra>',
    marker: { color: accent },
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

/** @deprecated use getPlotTheme().layout */
export const plotLayout = getPlotTheme(true).layout;
