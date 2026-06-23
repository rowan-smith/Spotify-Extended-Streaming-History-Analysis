import { Lock } from 'lucide-react';

interface PrivacyBannerProps {
  compact?: boolean;
  onOpenDataHandling?: () => void;
}

export function PrivacyBanner({ compact = false, onOpenDataHandling }: PrivacyBannerProps) {
  if (compact) {
    return (
      <aside className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground" role="note">
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
    <aside className="rounded-xl border border-border bg-muted/80 p-4 sm:p-5 text-left" role="note" aria-label="Privacy notice">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent/15 text-accent shrink-0" aria-hidden="true">
          <Lock className="w-4 h-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold mb-1">Processed locally in your browser</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
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
