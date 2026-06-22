import type { ReactNode } from 'react';
import {
  REQUEST_DATA_STEPS,
  SPOTIFY_PRIVACY_LABEL,
  SPOTIFY_PRIVACY_URL,
} from '../content/siteContent';

const REQUEST_DATA_IMAGE_BASE = './images/request-data/';

function renderStepBody(body: string): ReactNode {
  const index = body.indexOf(SPOTIFY_PRIVACY_LABEL);
  if (index === -1) return body;

  return (
    <>
      {body.slice(0, index)}
      <a href={SPOTIFY_PRIVACY_URL} target="_blank" rel="noreferrer">
        {SPOTIFY_PRIVACY_LABEL}
      </a>
      {body.slice(index + SPOTIFY_PRIVACY_LABEL.length)}
    </>
  );
}

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
              <p>{renderStepBody(step.body)}</p>
              {'image' in step && step.image ? (
                <figure
                  className={`step-list__figure${
                    'imageVariant' in step && step.imageVariant === 'compact'
                      ? ' step-list__figure--compact'
                      : 'imageVariant' in step && step.imageVariant === 'inline'
                        ? ' step-list__figure--inline'
                        : ''
                  }`}
                >
                  <img
                    src={`${REQUEST_DATA_IMAGE_BASE}${step.image}`}
                    alt={'imageAlt' in step ? step.imageAlt : ''}
                    loading="lazy"
                  />
                </figure>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
