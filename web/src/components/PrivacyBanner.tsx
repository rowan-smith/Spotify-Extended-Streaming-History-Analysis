import { PRIVACY_POINTS } from '../content/assumptions';

interface PrivacyBannerProps {
  compact?: boolean;
}

export function PrivacyBanner({ compact = false }: PrivacyBannerProps) {
  if (compact) {
    return (
      <aside className="privacy-banner privacy-banner--compact" role="note">
        <strong>No server.</strong> Your data stays in your browser, in memory only, and is
        discarded when you leave this page.
      </aside>
    );
  }

  return (
    <aside className="privacy-banner" role="note" aria-label="Privacy and data handling">
      <div className="privacy-banner__header">
        <span className="privacy-banner__icon" aria-hidden="true">
          🔒
        </span>
        <div>
          <h2>Your data never leaves your device</h2>
          <p>
            This is a static website. There is no server processing your files and no account
            to sign into.
          </p>
        </div>
      </div>
      <ul className="privacy-banner__list">
        {PRIVACY_POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </aside>
  );
}
