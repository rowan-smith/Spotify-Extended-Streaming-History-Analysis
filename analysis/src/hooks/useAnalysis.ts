import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildWrappedFilters,
  createDefaultFilters,
  filterRecords,
  getFilterContext,
  getWrappedYear,
  rankingsTopN,
} from '../analysis/filters';
import { WRAPPED_TOP_N } from '../analysis/filterPresets';
import { analyzeRecords, loadRecordsFromFiles } from '../analysis/processData';
import { DASHBOARD_TABS } from '../content/dashboardTabs';
import type { AnalysisFilters, AppView, RankingViewMode, StreamRecord, TabId } from '../types';

export function useAnalysis() {
  const [view, setView] = useState<AppView>('landing');
  const [navOpen, setNavOpen] = useState(false);
  const [allRecords, setAllRecords] = useState<StreamRecord[]>([]);
  const [bounds, setBounds] = useState({ yearMin: 0, yearMax: 0 });
  const [filters, setFilters] = useState<AnalysisFilters>(createDefaultFilters(0, 0));
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [viewMode, setViewMode] = useState<RankingViewMode>('standard');
  const [wrappedYear, setWrappedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);

  const isWrappedMode = viewMode === 'wrapped';
  const filterContext = useMemo(() => getFilterContext(filters), [filters]);
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

  const filteredRecords = useMemo(
    () => filterRecords(allRecords, filters),
    [allRecords, filters],
  );

  const skipSourceRecords = useMemo(
    () => filterRecords(allRecords, { ...filters, hideSkipped: false }),
    [allRecords, filters],
  );

  const wrappedRecords = useMemo(
    () => filterRecords(allRecords, wrappedFilters),
    [allRecords, wrappedFilters],
  );

  const wrappedSkipSourceRecords = useMemo(
    () => filterRecords(allRecords, { ...wrappedFilters, hideSkipped: false }),
    [allRecords, wrappedFilters],
  );

  const analysis = useMemo(() => {
    if (filteredRecords.length === 0) {
      return null;
    }
    return analyzeRecords(filteredRecords, rankingsTopN(filters), skipSourceRecords);
  }, [filteredRecords, filters, skipSourceRecords]);

  const wrappedAnalysis = useMemo(() => {
    if (wrappedRecords.length === 0) {
      return null;
    }
    return analyzeRecords(wrappedRecords, WRAPPED_TOP_N, wrappedSkipSourceRecords);
  }, [wrappedRecords, wrappedSkipSourceRecords]);

  const activeAnalysis = isWrappedMode ? wrappedAnalysis : analysis;
  const activeFilterContext = isWrappedMode ? wrappedFilterContext : filterContext;
  const activeFilteredPlays = isWrappedMode ? wrappedRecords.length : filteredRecords.length;

  const prefetchDashboardBundle = useCallback(() => {
    void import('../components/Dashboard');
    void import('../components/FilterBar');
  }, []);

  useEffect(() => {
    if (view === 'landing' || view === 'request-data') {
      prefetchDashboardBundle();
    }
  }, [view, prefetchDashboardBundle]);

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

  function applyRecords(records: StreamRecord[], sample: boolean) {
    const sorted = [...records].sort((left, right) => left.ts.getTime() - right.ts.getTime());
    const yearMin = sorted[0]?.ts.getUTCFullYear() ?? new Date().getFullYear();
    const yearMax =
      sorted[sorted.length - 1]?.ts.getUTCFullYear() ?? new Date().getFullYear();
    const nextBounds = { yearMin, yearMax };

    setAllRecords(sorted);
    setBounds(nextBounds);
    setFilters(createDefaultFilters(yearMin, yearMax));
    setWrappedYear(getWrappedYear(nextBounds));
    setViewMode('standard');
    setActiveTab('summary');
    setIsSampleData(sample);
    setView('dashboard');
    setNavOpen(false);
  }

  async function handleFilesSelected(files: File[]) {
    setLoading(true);
    setError(null);
    prefetchDashboardBundle();

    try {
      const records = await loadRecordsFromFiles(files);
      applyRecords(records, false);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to process JSON files.';
      setAllRecords([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSampleDataSelected() {
    setLoading(true);
    setError(null);
    prefetchDashboardBundle();

    try {
      const { loadSampleRecords } = await import('../data/sampleStreamingHistory');
      applyRecords(loadSampleRecords(), true);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to load sample data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis() {
    setAllRecords([]);
    setError(null);
    setIsSampleData(false);
    setViewMode('standard');
    setActiveTab('summary');
    setView('landing');
  }

  function returnToMain() {
    setView(allRecords.length > 0 ? 'dashboard' : 'landing');
    setNavOpen(false);
  }

  return {
    view,
    navigate,
    navOpen,
    setNavOpen,
    allRecords,
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
    error,
    isSampleData,
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
