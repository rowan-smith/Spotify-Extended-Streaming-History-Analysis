import { StatCard } from './StatCard';

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
  columns?: 2 | 3 | 4;
}

export function MetricGrid({ title, subtitle, metrics, columns = 4 }: MetricGridProps) {
  if (metrics.length === 0) {
    return null;
  }

  const colClass =
    columns === 4
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      : columns === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-2 sm:grid-cols-3';

  return (
    <section>
      <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1">
        {title}
      </h3>
      {subtitle ? <p className="text-xs text-muted-foreground mb-2">{subtitle}</p> : null}
      <div className={`grid ${colClass} gap-2 min-w-0`}>
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
