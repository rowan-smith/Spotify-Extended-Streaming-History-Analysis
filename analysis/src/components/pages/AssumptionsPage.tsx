import { AssumptionsPanel } from './AssumptionsPanel';
import { ContentPageLayout } from './ContentPageLayout';

interface AssumptionsPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function AssumptionsPage({ onBack, backLabel = 'Back to home' }: AssumptionsPageProps) {
  return (
    <ContentPageLayout onBack={onBack} backLabel={backLabel}>
      <AssumptionsPanel />
    </ContentPageLayout>
  );
}
