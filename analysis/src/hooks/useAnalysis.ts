import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildWrappedFilters,
  createDefaultFilters,
  getFilterContext,
  getWrappedYear,
} from '../analysis/filters';
import { DASHBOARD_TABS } from '../content/dashboardTabs';
import type { AnalysisFilters, AnalysisResult, AppView, RankingViewMode, TabId } from '../types';
import {
  analyzeInBackend,
  loadFilesInBackend,
  loadRecordsInBackend,
  resetAnalysisBackend,
  type LoadProgress,
} from '../workers/analysisWorkerClient';

export function useAnalysis() {
  const [view, setView] = useState<AppView>('landing');
  const [navOpen, setNavOpen] = useState(false);
  const [totalRecordCount, setTotalRecordCount] = useState(0);
  const [bounds, setBounds] = useState({ yearMin: 0, yearMax: 0 });
  const [filters, setFilters] = useState<AnalysisFilters>(createDefaultFilters(0, 0));
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [viewMode, setViewMode] = useState<RankingViewMode>('standard');
  const [wrappedYear, setWrappedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [wrappedAnalysis, setWrappedAnalysis] = useState<AnalysisResult | null>(null);
  const [standardFilteredPlays, setStandardFilteredPlays] = useState(0);
  const [wrappedFilteredPlays, setWrappedFilteredPlays] = useState(0);
  const [analysisPending, setAnalysisPending] = useState(false);

  const analyzeRequestId = useRef(0);

  const isWrappedMode = viewMode === 'wrapped';
  const deferredFilters = useDeferredValue(filters);
  const filtersPending = deferredFilters !== filters || analysisPending;

  const filterContext = useMemo(() => getFilterContext(deferredFilters), [deferredFilters]);
  const wrappedFilters = useMemo(
    () => buildWrappedFilters(bounds, wrappedYear),
    [bounds, wrappedYear],
  );
  const wrappedFilterContext = useMemo(
    () => getFilterContext(wrappedFilters),
    [wrappedFilters],
  );
  const wrappedYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = bounds.yearMin; year <= bounds.yearMax; year += 1) {
      years.push(year);
    }
    return years;
  }, [bounds.yearMax, bounds.yearMin]);

  const activeAnalysis = isWrappedMode ? wrappedAnalysis : analysis;
  const activeFilterContext = isWrappedMode ? wrappedFilterContext : filterContext;
  const activeFilteredPlays = isWrappedMode ? wrappedFilteredPlays : standardFilteredPlays;

  const prefetchDashboardBundle = useCallback(() => {
    void import('../components/Dashboard');
    void import('../components/FilterBar');
  }, []);

  useEffect(() => {
    if (view === 'landing' || view === 'request-data') {
      prefetchDashboardBundle();
    }
  }, [view, prefetchDashboardBundle]);

  useEffect(() => {
    if (totalRecordCount === 0) {
      setAnalysis(null);
      setWrappedAnalysis(null);
      setStandardFilteredPlays(0);
      setWrappedFilteredPlays(0);
      setAnalysisPending(false);
      return;
    }

    const requestId = ++analyzeRequestId.current;
    setAnalysisPending(true);

    void analyzeInBackend({
      standardFilters: deferredFilters,
      wrappedFilters,
      includeWrapped: isWrappedMode,
    })
      .then((result) => {
        if (requestId !== analyzeRequestId.current) {
          return;
        }
        setAnalysis(result.standardAnalysis);
        setWrappedAnalysis(result.wrappedAnalysis);
        setStandardFilteredPlays(result.standardFilteredCount);
        setWrappedFilteredPlays(result.wrappedFilteredCount);
      })
      .catch((caught) => {
        if (requestId !== analyzeRequestId.current) {
          return;
        }
        const message =
          caught instanceof Error ? caught.message : 'Failed to analyze streaming history.';
        setError(message);
      })
      .finally(() => {
        if (requestId === analyzeRequestId.current) {
          setAnalysisPending(false);
        }
      });
  }, [deferredFilters, wrappedFilters, isWrappedMode, totalRecordCount]);

  useEffect(() => () => resetAnalysisBackend(), []);

  function navigate(nextView: AppView) {
    setView(nextView);
    setNavOpen(false);
  }

  useEffect(() => {
    if (!navOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNavOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen]);

  function applyLoadedSummary(summary: { recordCount: number; yearMin: number; yearMax: number }, sample: boolean) {
    const nextBounds = { yearMin: summary.yearMin, yearMax: summary.yearMax };

    setTotalRecordCount(summary.recordCount);
    setBounds(nextBounds);
    setFilters(createDefaultFilters(summary.yearMin, summary.yearMax));
    setWrappedYear(getWrappedYear(nextBounds));
    setViewMode('standard');
    setActiveTab('summary');
    setIsSampleData(sample);
    setView('dashboard');
    setNavOpen(false);
  }

  async function handleFilesSelected(files: File[]) {
    setLoading(true);
    setLoadProgress(null);
    setError(null);
    prefetchDashboardBundle();

    try {
      const summary = await loadFilesInBackend(files, setLoadProgress);
      applyLoadedSummary(summary, false);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to process JSON files.';
      setTotalRecordCount(0);
      setError(message);
    } finally {
      setLoading(false);
      setLoadProgress(null);
    }
  }

  async function handleSampleDataSelected() {
    setLoading(true);
    setLoadProgress({
      phase: 'parsing',
      message: 'Generating sample data…',
    });
    setError(null);
    prefetchDashboardBundle();

    try {
      const { loadSampleRecords } = await import('../data/sampleStreamingHistory');
      const summary = await loadRecordsInBackend(loadSampleRecords());
      applyLoadedSummary(summary, true);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to load sample data.';
      setError(message);
    } finally {
      setLoading(false);
      setLoadProgress(null);
    }
  }

  function resetAnalysis() {
    resetAnalysisBackend();
    setTotalRecordCount(0);
    setAnalysis(null);
    setWrappedAnalysis(null);
    setStandardFilteredPlays(0);
    setWrappedFilteredPlays(0);
    setError(null);
    setIsSampleData(false);
    setViewMode('standard');
    setActiveTab('summary');
    setView('landing');
  }

  function returnToMain() {
    setView(totalRecordCount > 0 ? 'dashboard' : 'landing');
    setNavOpen(false);
  }

  return {
    view,
    navigate,
    navOpen,
    setNavOpen,
    totalRecordCount,
    bounds,
    filters,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    isWrappedMode,
    wrappedYear,
    setWrappedYear,
    wrappedYearOptions,
    loading,
    loadProgress,
    error,
    isSampleData,
    filtersPending,
    activeFilterContext,
    dashboardTabs: DASHBOARD_TABS,
    activeFilteredPlays,
    activeAnalysis,
    handleFiltersChange: setFilters,
    handleFilesSelected,
    handleSampleDataSelected,
    resetAnalysis,
    returnToMain,
  };
}
