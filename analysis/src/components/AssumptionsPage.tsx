import { AssumptionsPanel } from './AssumptionsPanel';

interface AssumptionsPageProps {
  onBack: () => void;
  backLabel?: string;
}

export function AssumptionsPage({ onBack, backLabel = 'Back to home' }: AssumptionsPageProps) {
  return (
    <div className="content-page">
      <div className="page-toolbar">
        <button type="button" className="button button--ghost" onClick={onBack}>
          {backLabel}
        </button>
      </div>
      <AssumptionsPanel />
    </div>
  );
}
