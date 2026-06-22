interface PrivacyBannerProps {
  compact?: boolean;
  onOpenDataHandling?: () => void;
}

export function PrivacyBanner({ compact = false, onOpenDataHandling }: PrivacyBannerProps) {
  if (compact) {
    return (
      <aside className="rounded-lg border border-border bg-muted px-4 py-3 text-xs text-muted-foreground" role="note">
        <span>
          Your data stays in your browser only.{' '}
          {onOpenDataHandling ? (
            <button type="button" className="text-accent underline underline-offset-2 hover:no-underline bg-transparent border-0 cursor-pointer" onClick={onOpenDataHandling}>
              Data handling
            </button>
          ) : null}
        </span>
      </aside>
    );
  }

  return (
    <aside className="rounded-xl border border-border bg-muted p-5" role="note" aria-label="Privacy notice">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5" aria-hidden="true">
          🔒
        </span>
        <div>
          <h2 className="text-sm font-semibold mb-1">Processed locally in your browser</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Upload your export, explore stats, and leave. Nothing from your JSON is stored by
            this project.{' '}
            {onOpenDataHandling ? (
              <button type="button" className="text-accent underline underline-offset-2 hover:no-underline bg-transparent border-0 cursor-pointer" onClick={onOpenDataHandling}>
                Read data handling details
              </button>
            ) : null}
          </p>
        </div>
      </div>
    </aside>
  );
}
