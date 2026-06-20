import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { UPLOAD_DISCLAIMER } from '../content/assumptions';
import { InfoTooltip } from './InfoTooltip';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  loading: boolean;
  error: string | null;
}

export function FileUpload({ onFilesSelected, loading, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !disclaimerAccepted) {
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
      <label className="disclaimer-box disclaimer-box--inline">
        <input
          type="checkbox"
          checked={disclaimerAccepted}
          onChange={(event) => setDisclaimerAccepted(event.target.checked)}
        />
        <span>{UPLOAD_DISCLAIMER}</span>
        <InfoTooltip text="Your JSON is parsed in-memory in this tab only. Close the tab to clear it." />
      </label>

      <div
        className={`dropzone dropzone--hero${dragActive ? ' dropzone--active' : ''}${
          !disclaimerAccepted ? ' dropzone--disabled' : ''
        }`}
        onDragOver={(event) => {
          if (!disclaimerAccepted) {
            return;
          }
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <p className="dropzone__title">Drop your Spotify JSON here</p>
        <p className="dropzone__text">
          Extended <code>Streaming_History_*.json</code> files or legacy exports — select
          multiple if your download is split.
        </p>
        <button
          type="button"
          className="button button--primary button--large"
          disabled={loading || !disclaimerAccepted}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'Processing…' : 'Choose JSON files'}
        </button>
        {!disclaimerAccepted ? (
          <p className="dropzone__hint">Check the box above to enable upload.</p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          multiple
          hidden
          disabled={!disclaimerAccepted}
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
