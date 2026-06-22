import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDefaultFilters,
  filterRecords,
  getFilterContext,
  rankingsTopN,
} from '../analysis/filters';
import { analyzeRecords, loadRecordsFromFiles } from '../analysis/processData';
import { getDashboardTabs } from '../content/dashboardTabs';
import type { AnalysisFilters, AppView, StreamRecord, TabId } from '../types';

export function useAnalysis() {
  const [view, setView] = useState<AppView>('landing');
  const [navOpen, setNavOpen] = useState(false);
  const [allRecords, setAllRecords] = useState<StreamRecord[]>([]);
  const [bounds, setBounds] = useState({ yearMin: 0, yearMax: 0 });
  const [filters, setFilters] = useState<AnalysisFilters>(createDefaultFilters(0, 0));
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);

  const filterContext = useMemo(() => getFilterContext(filters), [filters]);
  const dashboardTabs = useMemo(() => getDashboardTabs(filters.preset), [filters.preset]);

  const filteredRecords = useMemo(
    () => filterRecords(allRecords, filters),
    [allRecords, filters],
  );

  const analysis = useMemo(() => {
    if (filteredRecords.length === 0) {
      return null;
    }
    return analyzeRecords(filteredRecords, rankingsTopN(filters));
  }, [filteredRecords, filters]);

  function handleFiltersChange(next: AnalysisFilters) {
    if (next.preset === 'wrapped' && filters.preset !== 'wrapped') {
      setActiveTab('wrapped');
    } else if (next.preset !== 'wrapped' && filters.preset === 'wrapped') {
      setActiveTab((tab) => (tab === 'wrapped' ? 'summary' : tab));
    }
    setFilters(next);
  }

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

    setAllRecords(sorted);
    setBounds({ yearMin, yearMax });
    setFilters(createDefaultFilters(yearMin, yearMax));
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
    loading,
    error,
    isSampleData,
    filterContext,
    dashboardTabs,
    filteredRecords,
    analysis,
    handleFiltersChange,
    handleFilesSelected,
    handleSampleDataSelected,
    resetAnalysis,
    returnToMain,
  };
}
