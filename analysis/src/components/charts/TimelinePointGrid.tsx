import type { TimelinePoint } from '@/types';

interface TimelinePointGridProps {
  points: TimelinePoint[];
  valueLabel: string;
}

export function TimelinePointGrid({ points, valueLabel }: TimelinePointGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[28rem] overflow-y-auto pr-1">
      {points.map((point) => (
        <article
          key={`${point.label}-${point.value}`}
          className="rounded-lg border border-border bg-muted/40 p-3 min-w-0"
        >
          <p className="text-xs text-muted-foreground truncate" title={point.label}>
            {point.label}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {point.value.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{valueLabel}</p>
          {point.topItem ? (
            <p className="mt-1 text-xs text-muted-foreground truncate" title={point.topItem}>
              {point.topItem}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
