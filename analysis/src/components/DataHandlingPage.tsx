import { DATA_HANDLING_SECTIONS } from '../content/siteContent';

interface DataHandlingPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function DataHandlingPage({ onBack, backLabel = 'Back to home' }: DataHandlingPageProps) {
  return (
    <div className="content-page">
      <div className="page-toolbar">
        <button type="button" className="button button--ghost" onClick={onBack}>
          {backLabel}
        </button>
      </div>

      <header className="content-page__header">
        <h1>Data handling</h1>
        <p>How this site treats your Spotify export files and what leaves your device.</p>
      </header>

      <dl className="content-list">
        {DATA_HANDLING_SECTIONS.map((section) => (
          <div key={section.title} className="content-list__item">
            <dt>{section.title}</dt>
            <dd>{section.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
