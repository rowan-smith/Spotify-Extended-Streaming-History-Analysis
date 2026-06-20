import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { PrivacyBanner } from './PrivacyBanner';

interface LandingPageProps {
  onOpenAssumptions: () => void;
  onFilesSelected: (files: File[]) => void;
  loading: boolean;
  error: string | null;
}

const FEATURES = [
  'Top songs and artists by plays or total playtime',
  'Year-by-year breakdowns with interactive year and metric selectors',
  'Daily and monthly timelines with top-track hovers',
  'Seasonal patterns by month, day of month, and hour (UTC)',
  'Skip, completion, and session habit summaries',
  'Global filters for year range, search, top-N, and skipped plays',
  'Explore tab with sortable, searchable tables for every song and artist',
];

export function LandingPage({
  onOpenAssumptions,
  onFilesSelected,
  loading,
  error,
}: LandingPageProps) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="landing">
      <section className="splash">
        <p className="eyebrow">Local-first Spotify analytics</p>
        <h1>Explore your Spotify listening history</h1>
        <p className="splash__lead">
          Upload your Extended Streaming History JSON export and get interactive charts
          about what you listen to — entirely in your browser.
        </p>
        <ul className="feature-list">
          {FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <div className="splash__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => setShowUpload(true)}
          >
            Get started
          </button>
          <button type="button" className="button button--ghost" onClick={onOpenAssumptions}>
            Read assumptions
          </button>
        </div>
      </section>

      <PrivacyBanner />

      {showUpload ? (
        <FileUpload
          onFilesSelected={onFilesSelected}
          loading={loading}
          error={error}
        />
      ) : (
        <section className="upload-preview">
          <h2>Ready when you are</h2>
          <p>
            Click <strong>Get started</strong> to review the upload disclaimer and select
            your <code>Streaming_History_Audio_*.json</code> files.
          </p>
        </section>
      )}
    </div>
  );
}
