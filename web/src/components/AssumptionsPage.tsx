import { AssumptionsPanel } from './AssumptionsPanel';
import { PrivacyBanner } from './PrivacyBanner';

interface AssumptionsPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function AssumptionsPage({ onBack, backLabel = 'Back to home' }: AssumptionsPageProps) {
  return (
    <div className="assumptions-page">
      <div className="page-toolbar">
        <button type="button" className="button button--ghost" onClick={onBack}>
          ← {backLabel}
        </button>
      </div>
      <PrivacyBanner compact />
      <AssumptionsPanel />
    </div>
  );
}
