import { FileUpload } from './FileUpload';
import { PrivacyBanner } from './PrivacyBanner';
import { SHORT_UPLOAD_DISCLAIMER } from '../content/siteContent';

interface LandingPageProps {
  onOpenDataHandling: () => void;
  onOpenRequestData: () => void;
  onFilesSelected: (files: File[]) => void;
  loading: boolean;
  error: string | null;
}

export function LandingPage({
  onOpenDataHandling,
  onOpenRequestData,
  onFilesSelected,
  loading,
  error,
}: LandingPageProps) {
  return (
    <div className="landing">
      <section className="splash splash--compact">
        <p className="eyebrow">Local-first Spotify analytics</p>
        <h1>Explore your Spotify listening history</h1>
        <p className="splash__lead">{SHORT_UPLOAD_DISCLAIMER}</p>
        <p className="splash__links">
          Need your export?{' '}
          <button type="button" className="text-link" onClick={onOpenRequestData}>
            How to request your data
          </button>
          {' · '}
          <button type="button" className="text-link" onClick={onOpenDataHandling}>
            Data handling
          </button>
        </p>
      </section>

      <FileUpload onFilesSelected={onFilesSelected} loading={loading} error={error} />

      <PrivacyBanner onOpenDataHandling={onOpenDataHandling} />
    </div>
  );
}
