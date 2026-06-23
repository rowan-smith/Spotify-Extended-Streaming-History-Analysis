import type { ReactNode } from 'react';

interface AnalysisUpdatingOverlayProps {
  pending: boolean;
  children: ReactNode;
}

export function AnalysisUpdatingOverlay({ pending, children }: AnalysisUpdatingOverlayProps) {
  return (
    <div className="relative min-w-0">
      <div
        className={
          pending
            ? 'opacity-50 pointer-events-none transition-opacity duration-200'
            : 'transition-opacity duration-200'
        }
        aria-busy={pending}
      >
        {children}
      </div>
      {pending ? (
        <div
          className="absolute inset-0 z-10 flex items-start justify-center pt-10 pointer-events-none"
          aria-live="polite"
        >
          <p className="rounded-lg border border-border bg-background/95 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
            Updating charts…
          </p>
        </div>
      ) : null}
    </div>
  );
}
