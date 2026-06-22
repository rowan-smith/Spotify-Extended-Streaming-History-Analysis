import { AssumptionsPanel } from './AssumptionsPanel';
import { Button } from '@/components/ui/button';

interface AssumptionsPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function AssumptionsPage({ onBack, backLabel = 'Back to home' }: AssumptionsPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </div>
      <AssumptionsPanel />
    </div>
  );
}
