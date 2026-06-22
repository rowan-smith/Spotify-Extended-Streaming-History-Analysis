import { DATA_HANDLING_SECTIONS } from '../../content/siteContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DataHandlingPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function DataHandlingPage({ onBack, backLabel = 'Back to home' }: DataHandlingPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Data handling</h1>
        <p className="text-sm text-muted-foreground">How this site treats your Spotify export files and what leaves your device.</p>
      </header>

      <dl className="space-y-4">
        {DATA_HANDLING_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-4">
              <dt className="text-sm font-semibold mb-1">{section.title}</dt>
              <dd className="text-xs text-muted-foreground leading-relaxed">{section.body}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </div>
  );
}
