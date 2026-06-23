import type { AnalysisFilters, AnalysisResult } from '../types';

const ANALYSIS_CACHE_MAX = 32;

export interface AnalysisCacheRequest {
  standardFilters: AnalysisFilters;
  wrappedFilters: AnalysisFilters;
  includeWrapped: boolean;
}

export interface CachedAnalyzeResponse {
  standardAnalysis: AnalysisResult | null;
  wrappedAnalysis: AnalysisResult | null;
  standardFilteredCount: number;
  wrappedFilteredCount: number;
}

const analysisCache = new Map<string, CachedAnalyzeResponse>();

export function analyzeCacheKey(request: AnalysisCacheRequest): string {
  return JSON.stringify({
    s: request.standardFilters,
    w: request.wrappedFilters,
    i: request.includeWrapped,
  });
}

export function getCachedAnalysis(request: AnalysisCacheRequest): CachedAnalyzeResponse | undefined {
  return analysisCache.get(analyzeCacheKey(request));
}

export function setCachedAnalysis(request: AnalysisCacheRequest, value: CachedAnalyzeResponse): void {
  const key = analyzeCacheKey(request);
  if (analysisCache.has(key)) {
    analysisCache.delete(key);
  }
  analysisCache.set(key, value);
  if (analysisCache.size > ANALYSIS_CACHE_MAX) {
    const oldest = analysisCache.keys().next().value;
    if (oldest) {
      analysisCache.delete(oldest);
    }
  }
}

export function clearAnalysisCache(): void {
  analysisCache.clear();
}
