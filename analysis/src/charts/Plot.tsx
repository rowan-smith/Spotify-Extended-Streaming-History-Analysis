import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentProps,
} from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import { isPlotZoomed, plotAutorangeUpdate } from './plotZoom';

const PlotlyComponent = createPlotlyComponent(Plotly);

type PlotProps = ComponentProps<typeof PlotlyComponent> & {
  onZoomChange?: (zoomed: boolean) => void;
};

export interface PlotHandle {
  resetZoom: () => void;
}

function getPlotElement(container: HTMLDivElement | null): HTMLElement | null {
  return container?.querySelector('.js-plotly-plot') ?? null;
}

const Plot = forwardRef<PlotHandle, PlotProps>(function Plot(
  { onZoomChange, onRelayout, config, ...props },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      const plotElement = getPlotElement(containerRef.current);
      if (plotElement) {
        void Plotly.relayout(plotElement, plotAutorangeUpdate());
      }
      onZoomChange?.(false);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    return () => {
      if (container) {
        Plotly.purge(container);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full min-w-0 min-h-0 overflow-x-auto">
      <PlotlyComponent
        {...props}
        config={{ scrollZoom: false, ...(config ?? {}) }}
        onRelayout={(event) => {
          if (isPlotZoomed(event)) {
            onZoomChange?.(true);
          } else if (event['xaxis.autorange'] === true || event['yaxis.autorange'] === true) {
            onZoomChange?.(false);
          }
          onRelayout?.(event);
        }}
      />
    </div>
  );
});

export default Plot;
