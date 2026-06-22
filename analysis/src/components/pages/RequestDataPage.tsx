import type { ReactNode } from 'react';
import {
  REQUEST_DATA_STEPS,
  SPOTIFY_PRIVACY_LABEL,
  SPOTIFY_PRIVACY_URL,
} from '../../content/siteContent';
import { Button } from '@/components/ui/button';

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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Request your extended streaming history</h1>
        <p className="text-sm text-muted-foreground">
          Spotify provides Extended Streaming History as part of a privacy data export. Follow
          these steps, then return here to analyze the JSON files locally.
        </p>
      </header>

      <ol className="relative">
        {REQUEST_DATA_STEPS.map((step, index) => (
          <li key={step.title} className="relative pl-10 pb-8 last:pb-0">
            {index < REQUEST_DATA_STEPS.length - 1 ? (
              <span className="absolute left-[15px] top-0 bottom-0 w-px bg-border" aria-hidden="true" />
            ) : null}
            <span className="absolute left-0 top-0 inline-grid place-items-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold z-10">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold mb-1">{step.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{renderStepBody(step.body)}</p>
              {'image' in step && step.image ? (
                <figure
                  className={`mt-3 ${
                    'imageVariant' in step && step.imageVariant === 'compact'
                      ? 'max-w-sm'
                      : 'imageVariant' in step && step.imageVariant === 'inline'
                        ? 'inline-block max-w-[200px] ml-2 align-top'
                        : ''
                  }`}
                >
                  <img
                    src={`${REQUEST_DATA_IMAGE_BASE}${step.image}`}
                    alt={'imageAlt' in step ? step.imageAlt : ''}
                    loading="lazy"
                    className="rounded-lg border border-border w-full"
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
