import type { PlotRelayoutEvent } from 'plotly.js-dist-min';

export function isPlotZoomed(event: PlotRelayoutEvent): boolean {
  if (event['xaxis.autorange'] === true || event['yaxis.autorange'] === true) {
    return false;
  }

  return (
    Array.isArray(event['xaxis.range']) ||
    Array.isArray(event['yaxis.range']) ||
    Object.keys(event).some((key) => key.endsWith('.range'))
  );
}

export function plotAutorangeUpdate(): Record<string, boolean> {
  return {
    'xaxis.autorange': true,
    'yaxis.autorange': true,
  };
}
