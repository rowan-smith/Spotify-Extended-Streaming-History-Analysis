import { ASSUMPTIONS, ASSUMPTIONS_INTRO } from '../content/assumptions';

interface AssumptionsPanelProps {
  variant?: 'page' | 'panel';
}

export function AssumptionsPanel({ variant = 'page' }: AssumptionsPanelProps) {
  const header = (
    <header className={variant === 'page' ? 'content-page__header' : 'assumptions-panel__header'}>
      {variant === 'page' ? <h1>Analysis assumptions</h1> : <h2>Analysis assumptions</h2>}
      <p>{ASSUMPTIONS_INTRO}</p>
    </header>
  );

  const list = (
    <dl className={variant === 'page' ? 'content-list' : 'assumptions-list'}>
      {ASSUMPTIONS.map((item) => (
        <div key={item.title} className={variant === 'page' ? 'content-list__item' : 'assumptions-list__item'}>
          <dt>{item.title}</dt>
          <dd>{item.body}</dd>
        </div>
      ))}
    </dl>
  );

  if (variant === 'panel') {
    return (
      <section className="assumptions-panel">
        {header}
        {list}
      </section>
    );
  }

  return (
    <>
      {header}
      {list}
    </>
  );
}
