import { ASSUMPTIONS, ASSUMPTIONS_INTRO } from '../content/assumptions';

export function AssumptionsPanel() {
  return (
    <section className="assumptions-panel">
      <header className="assumptions-panel__header">
        <h2>Analysis assumptions</h2>
        <p>{ASSUMPTIONS_INTRO}</p>
      </header>
      <dl className="assumptions-list">
        {ASSUMPTIONS.map((item) => (
          <div key={item.title} className="assumptions-list__item">
            <dt>{item.title}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
