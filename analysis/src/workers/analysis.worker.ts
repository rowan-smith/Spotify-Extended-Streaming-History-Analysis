/// <reference lib="webworker" />

import { WRAPPED_TOP_N } from '../analysis/filterPresets';
import { filterRecords, rankingsTopN } from '../analysis/filters';
import { analyzeRecords, loadRecordsFromFiles, summarizeLoadedRecords, type LoadProgress } from '../analysis/processData';
import type { AnalysisFilters } from '../types';
import {
  deserializeStreamRecords,
  serializeAnalysisResult,
  type SerializedAnalysisResult,
  type SerializedStreamRecord,
} from './recordSerialization';

let allRecords: import('../types').StreamRecord[] = [];

function skipSourceRecordsFor(
  filters: AnalysisFilters,
  filteredRecords: import('../types').StreamRecord[],
): import('../types').StreamRecord[] {
  if (!filters.hideSkipped) {
    return filteredRecords;
  }
  return filterRecords(allRecords, { ...filters, hideSkipped: false });
}

function runAnalyze(payload: {
  standardFilters: AnalysisFilters;
  wrappedFilters: AnalysisFilters;
  includeWrapped: boolean;
}): {
  standardAnalysis: SerializedAnalysisResult | null;
  wrappedAnalysis: SerializedAnalysisResult | null;
  standardFilteredCount: number;
  wrappedFilteredCount: number;
} {
  const filteredRecords = filterRecords(allRecords, payload.standardFilters);
  const skipSourceRecords = skipSourceRecordsFor(payload.standardFilters, filteredRecords);
  const standardAnalysis =
    filteredRecords.length === 0
      ? null
      : serializeAnalysisResult(
          analyzeRecords(
            filteredRecords,
            rankingsTopN(payload.standardFilters),
            skipSourceRecords,
          ),
        );

  let wrappedAnalysis: SerializedAnalysisResult | null = null;
  let wrappedFilteredCount = 0;

  if (payload.includeWrapped) {
    const wrappedRecords = filterRecords(allRecords, payload.wrappedFilters);
    wrappedFilteredCount = wrappedRecords.length;
    if (wrappedRecords.length > 0) {
      const wrappedSkipSource = skipSourceRecordsFor(payload.wrappedFilters, wrappedRecords);
      wrappedAnalysis = serializeAnalysisResult(
        analyzeRecords(wrappedRecords, WRAPPED_TOP_N, wrappedSkipSource),
      );
    }
  }

  return {
    standardAnalysis,
    wrappedAnalysis,
    standardFilteredCount: filteredRecords.length,
    wrappedFilteredCount,
  };
}

self.onmessage = async (event: MessageEvent) => {
  const message = event.data as {
    id: string;
    type: 'load' | 'loadRecords' | 'analyze' | 'reset';
    files?: File[];
    records?: SerializedStreamRecord[];
    standardFilters?: AnalysisFilters;
    wrappedFilters?: AnalysisFilters;
    includeWrapped?: boolean;
  };

  try {
    if (message.type === 'reset') {
      allRecords = [];
      self.postMessage({ id: message.id, type: 'reset' });
      return;
    }

    if (message.type === 'load') {
      if (!message.files || message.files.length === 0) {
        throw new Error('No files provided.');
      }

      allRecords = await loadRecordsFromFiles(message.files, (progress: LoadProgress) => {
        self.postMessage({ id: message.id, type: 'progress', progress });
      });

      self.postMessage({
        id: message.id,
        type: 'loaded',
        ...summarizeLoadedRecords(allRecords),
      });
      return;
    }

    if (message.type === 'loadRecords') {
      if (!message.records) {
        throw new Error('No records provided.');
      }

      allRecords = deserializeStreamRecords(message.records).sort(
        (left, right) => left.ts.getTime() - right.ts.getTime(),
      );

      self.postMessage({
        id: message.id,
        type: 'loaded',
        ...summarizeLoadedRecords(allRecords),
      });
      return;
    }

    if (message.type === 'analyze') {
      if (!message.standardFilters || !message.wrappedFilters) {
        throw new Error('Missing filter payload.');
      }

      const result = runAnalyze({
        standardFilters: message.standardFilters,
        wrappedFilters: message.wrappedFilters,
        includeWrapped: message.includeWrapped ?? false,
      });

      self.postMessage({
        id: message.id,
        type: 'analysis',
        ...result,
      });
      return;
    }

    throw new Error(`Unknown worker message type: ${message.type as string}`);
  } catch (cause) {
    self.postMessage({
      id: message.id,
      type: 'error',
      message: cause instanceof Error ? cause.message : 'Worker processing failed.',
    });
  }
};
