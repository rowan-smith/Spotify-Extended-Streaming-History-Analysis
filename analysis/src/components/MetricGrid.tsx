import { StatCard } from './StatCard';
import { cn } from '@/lib/utils';

export interface MetricItem {
  label: string;
  value: string;
  hint?: string;
  info?: string;
  variant?: 'default' | 'hero';
}

interface MetricGridProps {
  title: string;
  subtitle?: string;
  metrics: MetricItem[];
  columns?: 2 | 3 | 4 | 5;
}

function pickColumnCount(count: number): 2 | 3 | 4 | 5 {
  if (count <= 2) return 2;
  if (count % 3 === 0) return 3;
  if (count === 5) return 5;
  return 4;
}

function gridColumnsClass(count: number, columns?: 2 | 3 | 4 | 5): string {
  const cols = columns ?? pickColumnCount(count);
  switch (cols) {
    case 2:
      return 'grid-cols-1 sm:grid-cols-2';
    case 3:
      return 'grid-cols-2 sm:grid-cols-3';
    case 5:
      return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    default:
      return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  }
}

export function MetricGrid({ title, subtitle, metrics, columns }: MetricGridProps) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1">
        {title}
      </h3>
      {subtitle ? <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{subtitle}</p> : null}
      <div className={cn('grid gap-3 min-w-0', gridColumnsClass(metrics.length, columns))}>
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
            info={metric.info}
            variant="compact"
          />
        ))}
      </div>
    </section>
  );
}
