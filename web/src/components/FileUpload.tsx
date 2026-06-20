import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { UPLOAD_DISCLAIMER } from '../content/assumptions';

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

    const files = [...fileList].filter((file) =>
      file.name.toLowerCase().endsWith('.json'),
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
    <section className="upload-panel">
      <header className="upload-panel__header">
        <h2>Load your JSON files</h2>
        <p>
          Select the audio streaming files from your Spotify Extended Streaming History
          export. You can choose multiple files if your export is split across them.
        </p>
      </header>

      <label className="disclaimer-box">
        <input
          type="checkbox"
          checked={disclaimerAccepted}
          onChange={(event) => setDisclaimerAccepted(event.target.checked)}
        />
        <span>{UPLOAD_DISCLAIMER}</span>
      </label>

      <div
        className={`dropzone${dragActive ? ' dropzone--active' : ''}${
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
        <p className="dropzone__title">Select your Spotify JSON files</p>
        <p className="dropzone__text">
          Choose one or more <code>Streaming_History_Audio_*.json</code> files, or drag
          them here.
        </p>
        <button
          type="button"
          className="button button--primary"
          disabled={loading || !disclaimerAccepted}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'Processing…' : 'Choose JSON files'}
        </button>
        {!disclaimerAccepted ? (
          <p className="dropzone__hint">Accept the disclaimer above to enable file selection.</p>
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
