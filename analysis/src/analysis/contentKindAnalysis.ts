import { analyzeRecords } from './processData';
import type { AnalysisResult, ContentKind, StreamRecord } from '../types';

export function filterRecordsByContentKind(
  records: StreamRecord[],
  kind: ContentKind,
): StreamRecord[] {
  return records.filter((record) => record.contentKind === kind);
}

export function analysisForContentKind(
  analysis: AnalysisResult,
  kind: ContentKind,
  topN = analysis.topSongsByPlays.length,
): AnalysisResult {
  const records = filterRecordsByContentKind(analysis.records, kind);
  return analyzeRecords(records, topN);
}
