import { REQUEST_DATA_STEPS } from '../content/siteContent';

interface RequestDataPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function RequestDataPage({ onBack, backLabel = 'Back to home' }: RequestDataPageProps) {
  return (
    <div className="content-page">
      <div className="page-toolbar">
        <button type="button" className="button button--ghost" onClick={onBack}>
          {backLabel}
        </button>
      </div>

      <header className="content-page__header">
        <h1>Request your extended streaming history</h1>
        <p>
          Spotify provides Extended Streaming History as part of a privacy data export. Follow
          these steps, then return here to analyze the JSON files locally.
        </p>
      </header>

      <ol className="step-list">
        {REQUEST_DATA_STEPS.map((step, index) => (
          <li key={step.title} className="step-list__item">
            <span className="step-list__number">{index + 1}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="content-page__note">
        Privacy settings:{' '}
        <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noreferrer">
          spotify.com/account/privacy
        </a>
      </p>
    </div>
  );
}
