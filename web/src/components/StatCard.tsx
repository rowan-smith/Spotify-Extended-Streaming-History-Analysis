import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  info?: string;
  variant?: 'default' | 'hero';
}

export function StatCard({ label, value, hint, info, variant = 'default' }: StatCardProps) {
  return (
    <article className={`stat-card${variant === 'hero' ? ' stat-card--hero' : ''}`}>
      <p className="stat-label">
        {label}
        {info ? <InfoTooltip text={info} label={label} /> : null}
      </p>
      <p className="stat-value">{value}</p>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </article>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="chart-card__body">{children}</div>
    </section>
  );
}

interface MetricTabsProps {
  active: 'plays' | 'time';
  onChange: (value: 'plays' | 'time') => void;
  playsInfo: string;
  timeInfo: string;
}

export function MetricTabs({ active, onChange, playsInfo, timeInfo }: MetricTabsProps) {
  return (
    <div className="metric-tabs" role="tablist" aria-label="Ranking metric">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'plays'}
        className={`metric-tabs__button${active === 'plays' ? ' metric-tabs__button--active' : ''}`}
        onClick={() => onChange('plays')}
      >
        Plays
        <InfoTooltip text={playsInfo} label="Plays metric" />
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'time'}
        className={`metric-tabs__button${active === 'time' ? ' metric-tabs__button--active' : ''}`}
        onClick={() => onChange('time')}
      >
        Playtime
        <InfoTooltip text={timeInfo} label="Playtime metric" />
      </button>
    </div>
  );
}
