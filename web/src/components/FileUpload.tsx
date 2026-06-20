import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { UPLOAD_DISCLAIMER } from '../content/assumptions';
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

    const files = [...fileList].filter((file) => file.name.toLowerCase().endsWith('.json'));

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
    <section className="upload-panel upload-panel--hero">
      <div
        className={`dropzone dropzone--hero${dragActive ? ' dropzone--active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <p className="dropzone__title">Drop your Spotify JSON here</p>
        <p className="dropzone__text">
          Extended <code>Streaming_History_*.json</code> files or legacy exports. Select
          multiple if your download is split.
        </p>
        {onOpenRequestData ? (
          <p className="dropzone__help">
            Don&apos;t have your export yet?{' '}
            <button type="button" className="text-link" onClick={onOpenRequestData}>
              Get your data
            </button>
          </p>
        ) : null}
        <div className="dropzone__actions">
          <button
            type="button"
            className="button button--primary button--large"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? 'Processing…' : 'Choose JSON files'}
          </button>
          {onLoadSampleData ? (
            <button
              type="button"
              className="button button--ghost button--large"
              disabled={loading}
              onClick={onLoadSampleData}
            >
              Try sample data
            </button>
          ) : null}
        </div>
        {onLoadSampleData ? (
          <p className="dropzone__sample-note">
            Preview the dashboard with fictional demo data while you wait for your export.
          </p>
        ) : null}
        <p className="upload-disclaimer">
          {UPLOAD_DISCLAIMER}
          <InfoTooltip text="Your JSON is parsed in-memory in this tab only. Close the tab to clear it." />
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          multiple
          hidden
          onChange={onInputChange}
        />
        {selectedNames.length > 0 ? (
          <ul className="file-list">
            {selectedNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="error-banner">{error}</p> : null}
    </section>
  );
}
