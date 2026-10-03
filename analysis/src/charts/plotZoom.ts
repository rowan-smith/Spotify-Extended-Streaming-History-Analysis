import type { Layout, PlotRelayoutEvent } from 'plotly.js-dist-min';

export function isPlotZoomed(event: PlotRelayoutEvent): boolean {
  if (event['xaxis.autorange'] === true || event['yaxis.autorange'] === true) {
    return false;
  }

  return (
    event['xaxis.range[0]'] !== undefined ||
    event['xaxis.range[1]'] !== undefined ||
    event['yaxis.range[0]'] !== undefined ||
    event['yaxis.range[1]'] !== undefined ||
    Object.keys(event).some((key) => key.includes('.range'))
  );
}

export function plotAutorangeUpdate(): Partial<Layout> {
  return {
    xaxis: { autorange: true },
    yaxis: { autorange: true },
  };
}
