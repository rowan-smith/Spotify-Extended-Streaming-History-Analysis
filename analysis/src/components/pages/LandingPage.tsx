import { FileUpload } from '../FileUpload';
import { PrivacyBanner } from '../PrivacyBanner';
import type { LoadProgress } from '../../workers/analysisWorkerClient';

interface LandingPageProps {
  onOpenDataHandling: () => void;
  onOpenRequestData: () => void;
  onFilesSelected: (files: File[]) => void;
  onLoadSampleData: () => void;
  loading: boolean;
  loadProgress: LoadProgress | null;
  error: string | null;
}

export function LandingPage({
  onOpenDataHandling,
  onOpenRequestData,
  onFilesSelected,
  onLoadSampleData,
  loading,
  loadProgress,
  error,
}: LandingPageProps) {
  return (
    <div className="flex flex-col items-center px-4 py-10 sm:py-14 gap-8 sm:gap-10">
      <section className="text-center max-w-2xl w-full">
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">
          Local-first Spotify analytics
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          Explore your Spotify{' '}
          <span className="text-accent">listening history</span>
        </h1>
        <div className="mt-5 max-w-lg mx-auto">
          <PrivacyBanner onOpenDataHandling={onOpenDataHandling} />
        </div>
      </section>

      <FileUpload
        onOpenRequestData={onOpenRequestData}
        onLoadSampleData={onLoadSampleData}
        onFilesSelected={onFilesSelected}
        loading={loading}
        loadProgress={loadProgress}
        error={error}
      />
    </div>
  );
}
