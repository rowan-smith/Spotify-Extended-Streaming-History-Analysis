import { DATA_HANDLING_SECTIONS } from '../../content/siteContent';
import { Card, CardContent } from '@/components/ui/card';
import { ContentPageLayout } from './ContentPageLayout';

interface DataHandlingPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function DataHandlingPage({ onBack, backLabel = 'Back to home' }: DataHandlingPageProps) {
  return (
    <ContentPageLayout
      onBack={onBack}
      backLabel={backLabel}
      title="Data handling"
      intro="How this site treats your Spotify export files and what leaves your device."
    >
      <dl className="space-y-3">
        {DATA_HANDLING_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-4">
              <dt className="text-sm font-semibold mb-1.5">{section.title}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{section.body}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </ContentPageLayout>
  );
}
