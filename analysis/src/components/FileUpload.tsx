import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { UPLOAD_DISCLAIMER } from '../content/assumptions';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from './InfoTooltip';

interface FileUploadProps {
  onOpenRequestData?: () => void;
  onLoadSampleData?: () => void;
  onFilesSelected: (files: File[]) => void;
  loading: boolean;
  error: string | null;
}

export function FileUpload({
  onOpenRequestData,
  onLoadSampleData,
  onFilesSelected,
  loading,
  error,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = [...fileList].filter(
      (file) =>
        file.name.toLowerCase().endsWith('.json') ||
        file.name.toLowerCase().endsWith('.zip'),
    );

    if (files.length === 0) {
      return;
    }

    setSelectedNames(files.map((file) => file.name));
    onFilesSelected(files);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <section className="max-w-2xl mx-auto">
      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-muted-foreground/50'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <p className="text-lg font-semibold mb-2">Drop your Spotify export here</p>
        <p className="text-sm text-muted-foreground mb-4">
          A <code className="text-xs bg-muted px-1 py-0.5 rounded">my_spotify_data.zip</code> file, or the individual
          {' '}<code className="text-xs bg-muted px-1 py-0.5 rounded">Streaming_History_*.json</code> files inside it. Select
          multiple if your download is split.
        </p>
        {onOpenRequestData ? (
          <p className="text-xs text-muted-foreground mb-4">
            Don&apos;t have your export yet?{' '}
            <button type="button" className="text-accent underline underline-offset-2 hover:no-underline bg-transparent border-0 cursor-pointer" onClick={onOpenRequestData}>
              Get your data
            </button>
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? 'Processing…' : 'Choose files'}
          </Button>
          {onLoadSampleData ? (
            <Button
              variant="ghost"
              size="lg"
              disabled={loading}
              onClick={onLoadSampleData}
            >
              Try sample data
            </Button>
          ) : null}
        </div>
        {onLoadSampleData ? (
          <p className="text-xs text-muted-foreground mt-4">
            Preview the dashboard with fictional demo data while you wait for your export.
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          {UPLOAD_DISCLAIMER}
          <InfoTooltip text="Your files stay in this browser tab only. Close the tab and your data is gone." />
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json,.zip,application/zip,application/x-zip-compressed"
          multiple
          hidden
          onChange={onInputChange}
        />
        {selectedNames.length > 0 ? (
          <ul className="mt-4 text-xs text-left text-muted-foreground space-y-1">
            {selectedNames.map((name) => (
              <li key={name} className="truncate">{name}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="mt-4 rounded-lg border border-border bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</p> : null}
    </section>
  );
}
