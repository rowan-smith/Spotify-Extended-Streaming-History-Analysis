import { WRAPPED_TOP_N } from '../analysis/filterPresets';
import { filterRecords, rankingsTopN } from '../analysis/filters';
import {
  analyzeRecords,
  loadRecordsFromFiles,
  summarizeLoadedRecords,
  type LoadProgress,
} from '../analysis/processData';
import type { AnalysisFilters, AnalysisResult, StreamRecord } from '../types';
import {
  deserializeAnalysisResult,
  serializeStreamRecords,
  type SerializedAnalysisResult,
} from './recordSerialization';

export type { LoadProgress };

export interface LoadedDataSummary {
  recordCount: number;
  yearMin: number;
  yearMax: number;
}

export interface AnalyzeRequest {
  standardFilters: AnalysisFilters;
  wrappedFilters: AnalysisFilters;
  includeWrapped: boolean;
}

export interface AnalyzeResponse {
  standardAnalysis: AnalysisResult | null;
  wrappedAnalysis: AnalysisResult | null;
  standardFilteredCount: number;
  wrappedFilteredCount: number;
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  onProgress?: (progress: LoadProgress) => void;
};

function skipSourceRecordsFor(
  allRecords: StreamRecord[],
  filters: AnalysisFilters,
  filteredRecords: StreamRecord[],
): StreamRecord[] {
  if (!filters.hideSkipped) {
    return filteredRecords;
  }
  return filterRecords(allRecords, { ...filters, hideSkipped: false });
}

function analyzeOnMainThread(
  allRecords: StreamRecord[],
  request: AnalyzeRequest,
): AnalyzeResponse {
  const filteredRecords = filterRecords(allRecords, request.standardFilters);
  const skipSourceRecords = skipSourceRecordsFor(
    allRecords,
    request.standardFilters,
    filteredRecords,
  );
  const standardAnalysis =
    filteredRecords.length === 0
      ? null
      : analyzeRecords(
          filteredRecords,
          rankingsTopN(request.standardFilters),
          skipSourceRecords,
        );

  let wrappedAnalysis: AnalysisResult | null = null;
  let wrappedFilteredCount = 0;

  if (request.includeWrapped) {
    const wrappedRecords = filterRecords(allRecords, request.wrappedFilters);
    wrappedFilteredCount = wrappedRecords.length;
    if (wrappedRecords.length > 0) {
      const wrappedSkipSource = skipSourceRecordsFor(
        allRecords,
        request.wrappedFilters,
        wrappedRecords,
      );
      wrappedAnalysis = analyzeRecords(wrappedRecords, WRAPPED_TOP_N, wrappedSkipSource);
    }
  }

  return {
    standardAnalysis,
    wrappedAnalysis,
    standardFilteredCount: filteredRecords.length,
    wrappedFilteredCount,
  };
}

class MainThreadBackend {
  private records: StreamRecord[] = [];

  async loadFiles(
    files: File[],
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<LoadedDataSummary> {
    this.records = await loadRecordsFromFiles(files, onProgress);
    return summarizeLoadedRecords(this.records);
  }

  async loadRecords(records: StreamRecord[]): Promise<LoadedDataSummary> {
    this.records = [...records].sort((left, right) => left.ts.getTime() - right.ts.getTime());
    return summarizeLoadedRecords(this.records);
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return analyzeOnMainThread(this.records, request);
  }

  reset(): void {
    this.records = [];
  }
}

class WorkerBackend {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private nextId = 0;

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = (event) => this.handleMessage(event.data);
      this.worker.onerror = (event) => {
        const message = event.message || 'Analysis worker failed.';
        for (const request of this.pending.values()) {
          request.reject(new Error(message));
        }
        this.pending.clear();
        this.worker?.terminate();
        this.worker = null;
      };
    }
    return this.worker;
  }

  private handleMessage(data: {
    id: string;
    type: string;
    progress?: LoadProgress;
    recordCount?: number;
    yearMin?: number;
    yearMax?: number;
    standardAnalysis?: SerializedAnalysisResult | null;
    wrappedAnalysis?: SerializedAnalysisResult | null;
    standardFilteredCount?: number;
    wrappedFilteredCount?: number;
    message?: string;
  }) {
    if (data.type === 'progress') {
      const request = this.pending.get(data.id);
      if (request?.onProgress && data.progress) {
        request.onProgress(data.progress);
      }
      return;
    }

    const request = this.pending.get(data.id);
    if (!request) {
      return;
    }

    this.pending.delete(data.id);

    if (data.type === 'error') {
      request.reject(new Error(data.message ?? 'Worker processing failed.'));
      return;
    }

    if (data.type === 'loaded') {
      request.resolve({
        recordCount: data.recordCount ?? 0,
        yearMin: data.yearMin ?? new Date().getFullYear(),
        yearMax: data.yearMax ?? new Date().getFullYear(),
      } satisfies LoadedDataSummary);
      return;
    }

    if (data.type === 'analysis') {
      request.resolve({
        standardAnalysis: data.standardAnalysis
          ? deserializeAnalysisResult(data.standardAnalysis)
          : null,
        wrappedAnalysis: data.wrappedAnalysis
          ? deserializeAnalysisResult(data.wrappedAnalysis)
          : null,
        standardFilteredCount: data.standardFilteredCount ?? 0,
        wrappedFilteredCount: data.wrappedFilteredCount ?? 0,
      } satisfies AnalyzeResponse);
      return;
    }

    if (data.type === 'reset') {
      request.resolve(undefined);
    }
  }

  private request<T>(
    type: 'load' | 'loadRecords' | 'analyze' | 'reset',
    payload: Record<string, unknown> = {},
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<T> {
    const id = String(++this.nextId);
    const worker = this.ensureWorker();

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as PendingRequest['resolve'],
        reject,
        onProgress,
      });
      worker.postMessage({ id, type, ...payload });
    });
  }

  loadFiles(
    files: File[],
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<LoadedDataSummary> {
    return this.request<LoadedDataSummary>('load', { files }, onProgress);
  }

  loadRecords(records: StreamRecord[]): Promise<LoadedDataSummary> {
    return this.request<LoadedDataSummary>('loadRecords', {
      records: serializeStreamRecords(records),
    });
  }

  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.request<AnalyzeResponse>('analyze', {
      standardFilters: request.standardFilters,
      wrappedFilters: request.wrappedFilters,
      includeWrapped: request.includeWrapped,
    });
  }

  reset(): Promise<void> {
    if (!this.worker) {
      return Promise.resolve();
    }
    return this.request<void>('reset').finally(() => {
      this.worker?.terminate();
      this.worker = null;
    });
  }
}

export function isAnalysisWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined';
}

let backend: MainThreadBackend | WorkerBackend | null = null;

function getBackend(): MainThreadBackend | WorkerBackend {
  if (!backend) {
    backend = isAnalysisWorkerAvailable() ? new WorkerBackend() : new MainThreadBackend();
  }
  return backend;
}

export function resetAnalysisBackend(): void {
  void backend?.reset();
  backend = null;
}

export async function loadFilesInBackend(
  files: File[],
  onProgress?: (progress: LoadProgress) => void,
): Promise<LoadedDataSummary> {
  return getBackend().loadFiles(files, onProgress);
}

export async function loadRecordsInBackend(records: StreamRecord[]): Promise<LoadedDataSummary> {
  return getBackend().loadRecords(records);
}

export async function analyzeInBackend(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  return getBackend().analyze(request);
}

export function resetBackendRecords(): void {
  void getBackend().reset();
}
