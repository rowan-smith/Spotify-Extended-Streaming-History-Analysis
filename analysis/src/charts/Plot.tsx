import { useEffect, useRef, type ComponentProps } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const PlotlyComponent = createPlotlyComponent(Plotly);

type PlotProps = ComponentProps<typeof PlotlyComponent>;

export default function Plot(props: PlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      <PlotlyComponent {...props} />
    </div>
  );
}
