interface PrivacyBannerProps {
  compact?: boolean;
  onOpenDataHandling?: () => void;
}

export function PrivacyBanner({ compact = false, onOpenDataHandling }: PrivacyBannerProps) {
  if (compact) {
    return (
      <aside className="privacy-banner privacy-banner--compact" role="note">
        <span>
          Your data stays in your browser only.{' '}
          {onOpenDataHandling ? (
            <button type="button" className="text-link" onClick={onOpenDataHandling}>
              Data handling
            </button>
          ) : null}
        </span>
      </aside>
    );
  }

  return (
    <aside className="privacy-banner" role="note" aria-label="Privacy notice">
      <div className="privacy-banner__header">
        <span className="privacy-banner__icon" aria-hidden="true">
          🔒
        </span>
        <div>
          <h2>Processed locally in your browser</h2>
          <p>
            Upload your export, explore stats, and leave. Nothing from your JSON is stored by
            this project.{' '}
            {onOpenDataHandling ? (
              <button type="button" className="text-link" onClick={onOpenDataHandling}>
                Read data handling details
              </button>
            ) : null}
          </p>
        </div>
      </div>
    </aside>
  );
}
