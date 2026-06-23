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
  clearAnalysisCache,
  getCachedAnalysis,
  setCachedAnalysis,
} from './analysisCache';
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

export interface CountResponse {
  standardFilteredCount: number;
  wrappedFilteredCount: number;
}

export class AnalysisSupersededError extends Error {
  constructor() {
    super('Analysis superseded.');
    this.name = 'AnalysisSupersededError';
  }
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  onProgress?: (progress: LoadProgress) => void;
};

type AnalyzeWaiter = {
  resolve: (value: AnalyzeResponse) => void;
  reject: (reason?: unknown) => void;
};

type CountWaiter = {
  resolve: (value: CountResponse) => void;
  reject: (reason?: unknown) => void;
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

function countFilteredRecords(
  allRecords: StreamRecord[],
  request: AnalyzeRequest,
): CountResponse {
  const standardFilteredCount = filterRecords(allRecords, request.standardFilters).length;
  let wrappedFilteredCount = 0;

  if (request.includeWrapped) {
    wrappedFilteredCount = filterRecords(allRecords, request.wrappedFilters).length;
  }

  return { standardFilteredCount, wrappedFilteredCount };
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

interface AnalysisBackend {
  loadFiles(files: File[], onProgress?: (progress: LoadProgress) => void): Promise<LoadedDataSummary>;
  loadRecords(records: StreamRecord[]): Promise<LoadedDataSummary>;
  analyzeUncached(request: AnalyzeRequest): Promise<AnalyzeResponse>;
  countFiltered(request: AnalyzeRequest): Promise<CountResponse>;
  reset(): void | Promise<void>;
}

class MainThreadBackend implements AnalysisBackend {
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

  async analyzeUncached(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return analyzeOnMainThread(this.records, request);
  }

  async countFiltered(request: AnalyzeRequest): Promise<CountResponse> {
    return countFilteredRecords(this.records, request);
  }

  reset(): void {
    this.records = [];
  }
}

class WorkerBackend implements AnalysisBackend {
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

    if (data.type === 'superseded') {
      const superseded = this.pending.get(data.id);
      if (superseded) {
        this.pending.delete(data.id);
        superseded.reject(new AnalysisSupersededError());
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

    if (data.type === 'count') {
      request.resolve({
        standardFilteredCount: data.standardFilteredCount ?? 0,
        wrappedFilteredCount: data.wrappedFilteredCount ?? 0,
      } satisfies CountResponse);
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
    type: 'load' | 'loadRecords' | 'analyze' | 'count' | 'reset',
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

  analyzeUncached(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.request<AnalyzeResponse>('analyze', {
      standardFilters: request.standardFilters,
      wrappedFilters: request.wrappedFilters,
      includeWrapped: request.includeWrapped,
      generation: ++workerAnalyzeGeneration,
    });
  }

  countFiltered(request: AnalyzeRequest): Promise<CountResponse> {
    return this.request<CountResponse>('count', {
      standardFilters: request.standardFilters,
      wrappedFilters: request.wrappedFilters,
      includeWrapped: request.includeWrapped,
      generation: ++workerCountGeneration,
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

let workerAnalyzeGeneration = 0;
let workerCountGeneration = 0;

let analyzeFlushTimer: ReturnType<typeof setTimeout> | null = null;
let countFlushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingAnalyzeRequest: AnalyzeRequest | null = null;
let pendingCountRequest: AnalyzeRequest | null = null;
let analyzeWaiters: AnalyzeWaiter[] = [];
let countWaiters: CountWaiter[] = [];
let analyzeInFlight: Promise<void> | null = null;
let countInFlight: Promise<void> | null = null;

export function isAnalysisWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined';
}

let backend: AnalysisBackend | null = null;

function getBackend(): AnalysisBackend {
  if (!backend) {
    backend = isAnalysisWorkerAvailable() ? new WorkerBackend() : new MainThreadBackend();
  }
  return backend;
}

function scheduleAnalyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const cached = getCachedAnalysis(request);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    pendingAnalyzeRequest = request;
    analyzeWaiters.push({ resolve, reject });

    if (analyzeFlushTimer) {
      clearTimeout(analyzeFlushTimer);
    }
    analyzeFlushTimer = setTimeout(() => {
      analyzeFlushTimer = null;
      void flushAnalyzeQueue();
    }, 0);
  });
}

async function flushAnalyzeQueue(): Promise<void> {
  if (analyzeInFlight) {
    return;
  }

  analyzeInFlight = (async () => {
    while (pendingAnalyzeRequest && analyzeWaiters.length > 0) {
      const request = pendingAnalyzeRequest;
      pendingAnalyzeRequest = null;
      const waiters = analyzeWaiters;
      analyzeWaiters = [];

      try {
        const cached = getCachedAnalysis(request);
        let result: AnalyzeResponse;
        if (cached) {
          result = cached;
        } else {
          result = await getBackend().analyzeUncached(request);
          setCachedAnalysis(request, result);
        }
        for (const waiter of waiters) {
          waiter.resolve(result);
        }
      } catch (error) {
        for (const waiter of waiters) {
          waiter.reject(error);
        }
      }
    }
    analyzeInFlight = null;

    if (pendingAnalyzeRequest && analyzeWaiters.length > 0) {
      void flushAnalyzeQueue();
    }
  })();

  await analyzeInFlight;
}

function scheduleCount(request: AnalyzeRequest): Promise<CountResponse> {
  return new Promise((resolve, reject) => {
    pendingCountRequest = request;
    countWaiters.push({ resolve, reject });

    if (countFlushTimer) {
      clearTimeout(countFlushTimer);
    }
    countFlushTimer = setTimeout(() => {
      countFlushTimer = null;
      void flushCountQueue();
    }, 0);
  });
}

async function flushCountQueue(): Promise<void> {
  if (countInFlight) {
    return;
  }

  countInFlight = (async () => {
    while (pendingCountRequest && countWaiters.length > 0) {
      const request = pendingCountRequest;
      pendingCountRequest = null;
      const waiters = countWaiters;
      countWaiters = [];

      try {
        const result = await getBackend().countFiltered(request);
        for (const waiter of waiters) {
          waiter.resolve(result);
        }
      } catch (error) {
        for (const waiter of waiters) {
          waiter.reject(error);
        }
      }
    }
    countInFlight = null;

    if (pendingCountRequest && countWaiters.length > 0) {
      void flushCountQueue();
    }
  })();

  await countInFlight;
}

function resetPendingQueues(): void {
  if (analyzeFlushTimer) {
    clearTimeout(analyzeFlushTimer);
    analyzeFlushTimer = null;
  }
  if (countFlushTimer) {
    clearTimeout(countFlushTimer);
    countFlushTimer = null;
  }

  pendingAnalyzeRequest = null;
  pendingCountRequest = null;

  for (const waiter of analyzeWaiters) {
    waiter.reject(new Error('Analysis reset.'));
  }
  for (const waiter of countWaiters) {
    waiter.reject(new Error('Analysis reset.'));
  }
  analyzeWaiters = [];
  countWaiters = [];
  analyzeInFlight = null;
  countInFlight = null;
}

export function resetAnalysisBackend(): void {
  resetPendingQueues();
  clearAnalysisCache();
  void backend?.reset();
  backend = null;
  workerAnalyzeGeneration = 0;
  workerCountGeneration = 0;
}

export async function loadFilesInBackend(
  files: File[],
  onProgress?: (progress: LoadProgress) => void,
): Promise<LoadedDataSummary> {
  clearAnalysisCache();
  return getBackend().loadFiles(files, onProgress);
}

export async function loadRecordsInBackend(records: StreamRecord[]): Promise<LoadedDataSummary> {
  clearAnalysisCache();
  return getBackend().loadRecords(records);
}

export async function analyzeInBackend(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  return scheduleAnalyze(request);
}

export async function countInBackend(request: AnalyzeRequest): Promise<CountResponse> {
  return scheduleCount(request);
}

export function resetBackendRecords(): void {
  resetAnalysisBackend();
}
