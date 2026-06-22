import { FileUpload } from './FileUpload';
import { PrivacyBanner } from './PrivacyBanner';

interface LandingPageProps {
  onOpenDataHandling: () => void;
  onOpenRequestData: () => void;
  onFilesSelected: (files: File[]) => void;
  onLoadSampleData: () => void;
  loading: boolean;
  error: string | null;
}

export function LandingPage({
  onOpenDataHandling,
  onOpenRequestData,
  onFilesSelected,
  onLoadSampleData,
  loading,
  error,
}: LandingPageProps) {
  return (
    <div className="landing">
      <section className="splash">
        <p className="eyebrow">Local-first Spotify analytics</p>
        <h1 className="splash__title">
          <span className="splash__title-line">Explore your Spotify</span>
          <span className="splash__title-line splash__title-line--accent">listening history</span>
        </h1>
        <PrivacyBanner onOpenDataHandling={onOpenDataHandling} />
      </section>

      <FileUpload
        onOpenRequestData={onOpenRequestData}
        onLoadSampleData={onLoadSampleData}
        onFilesSelected={onFilesSelected}
        loading={loading}
        error={error}
      />
    </div>
  );
}
