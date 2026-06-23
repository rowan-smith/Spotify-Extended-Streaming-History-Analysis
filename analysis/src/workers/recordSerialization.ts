import type { AnalysisResult, StreamRecord } from '../types';

export type SerializedStreamRecord = Omit<StreamRecord, 'ts'> & { ts: string };

export type SerializedDiscoveryEntry = Omit<
  AnalysisResult['discoveryHistory'][number],
  'discoveredAt'
> & { discoveredAt: string };

export type SerializedAnalysisResult = Omit<
  AnalysisResult,
  'records' | 'overview' | 'discoveryHistory'
> & {
  records: SerializedStreamRecord[];
  overview: Omit<AnalysisResult['overview'], 'earliest' | 'latest'> & {
    earliest: SerializedStreamRecord | null;
    latest: SerializedStreamRecord | null;
  };
  discoveryHistory: SerializedDiscoveryEntry[];
};

export function serializeStreamRecord(record: StreamRecord): SerializedStreamRecord {
  return { ...record, ts: record.ts.toISOString() };
}

export function deserializeStreamRecord(record: SerializedStreamRecord): StreamRecord {
  return { ...record, ts: new Date(record.ts) };
}

export function serializeStreamRecords(records: StreamRecord[]): SerializedStreamRecord[] {
  return records.map(serializeStreamRecord);
}

export function deserializeStreamRecords(records: SerializedStreamRecord[]): StreamRecord[] {
  return records.map(deserializeStreamRecord);
}

export function serializeAnalysisResult(result: AnalysisResult): SerializedAnalysisResult {
  return {
    ...result,
    records: serializeStreamRecords(result.records),
    overview: {
      ...result.overview,
      earliest: result.overview.earliest
        ? serializeStreamRecord(result.overview.earliest)
        : null,
      latest: result.overview.latest ? serializeStreamRecord(result.overview.latest) : null,
    },
    discoveryHistory: result.discoveryHistory.map((entry) => ({
      ...entry,
      discoveredAt: entry.discoveredAt.toISOString(),
    })),
  };
}

export function deserializeAnalysisResult(result: SerializedAnalysisResult): AnalysisResult {
  return {
    ...result,
    records: deserializeStreamRecords(result.records),
    overview: {
      ...result.overview,
      earliest: result.overview.earliest
        ? deserializeStreamRecord(result.overview.earliest)
        : null,
      latest: result.overview.latest ? deserializeStreamRecord(result.overview.latest) : null,
    },
    discoveryHistory: result.discoveryHistory.map((entry) => ({
      ...entry,
      discoveredAt: new Date(entry.discoveredAt),
    })),
  };
}
