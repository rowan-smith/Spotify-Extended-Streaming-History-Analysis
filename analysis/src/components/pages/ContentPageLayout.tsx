import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ContentPageLayoutProps {
  onBack: () => void;
  backLabel?: string;
  title?: string;
  intro?: string;
  children: ReactNode;
}

export function ContentPageLayout({
  onBack,
  backLabel = 'Back to home',
  title,
  intro,
  children,
}: ContentPageLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </div>

      {title ? (
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{title}</h1>
          {intro ? <p className="text-sm text-muted-foreground leading-relaxed">{intro}</p> : null}
        </header>
      ) : null}

      {children}
    </div>
  );
}
