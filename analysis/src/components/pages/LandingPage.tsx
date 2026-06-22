import { FileUpload } from '../FileUpload';
import { PrivacyBanner } from '../PrivacyBanner';

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
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12 gap-8">
      <section className="text-center max-w-lg">
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Local-first Spotify analytics</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Explore your Spotify
        </h1>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-accent">
          listening history
        </h1>
        <div className="mt-4">
          <PrivacyBanner onOpenDataHandling={onOpenDataHandling} />
        </div>
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
