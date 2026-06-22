import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  createDefaultFilters,
  filterRecords,
  getFilterContext,
  rankingsTopN,
} from './analysis/filters';
import { analyzeRecords, loadRecordsFromFiles } from './analysis/processData';
import { LandingPage } from './components/LandingPage';
import { OpenSourceLinks } from './components/OpenSourceLinks';
import { ThemeToggle } from './components/ThemeToggle';
import { getDashboardTabs } from './content/dashboardTabs';
import { useTheme } from './hooks/useTheme';
import type { AnalysisFilters, AppView, StreamRecord, TabId } from './types';

const Dashboard = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const FilterBar = lazy(() =>
  import('./components/FilterBar').then((module) => ({ default: module.FilterBar })),
);
const AssumptionsPage = lazy(() =>
  import('./components/AssumptionsPage').then((module) => ({ default: module.AssumptionsPage })),
);
const DataHandlingPage = lazy(() =>
  import('./components/DataHandlingPage').then((module) => ({ default: module.DataHandlingPage })),
);
const RequestDataPage = lazy(() =>
  import('./components/RequestDataPage').then((module) => ({ default: module.RequestDataPage })),
);

function prefetchDashboardBundle() {
  void import('./components/Dashboard');
  void import('./components/FilterBar');
}

function ViewFallback() {
  return <p className="view-loading">Loading…</p>;
}

export default function App() {
  const { theme, preference, setTheme } = useTheme();
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

  useEffect(() => {
    if (view === 'landing' || view === 'request-data') {
      prefetchDashboardBundle();
    }
  }, [view]);

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
      const { loadSampleRecords } = await import('./data/sampleStreamingHistory');
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

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <button
            type="button"
            className="site-brand"
            onClick={() => navigate('landing')}
          >
            <span className="site-brand__mark" aria-hidden="true">
              ♫
            </span>
            <span className="site-brand__name">Spotify History Explorer</span>
          </button>

          <nav
            id="site-nav"
            className={`site-nav${navOpen ? ' site-nav--open' : ''}`}
            aria-label="Site sections"
          >
            <button
              type="button"
              className={`site-nav__link${view === 'landing' ? ' site-nav__link--active' : ''}`}
              onClick={() => navigate('landing')}
            >
              Home
            </button>
            <button
              type="button"
              className={`site-nav__link${view === 'request-data' ? ' site-nav__link--active' : ''}`}
              onClick={() => navigate('request-data')}
            >
              Get your data
            </button>
            <button
              type="button"
              className={`site-nav__link${view === 'assumptions' ? ' site-nav__link--active' : ''}`}
              onClick={() => navigate('assumptions')}
            >
              Assumptions
            </button>
            <button
              type="button"
              className={`site-nav__link${view === 'data-handling' ? ' site-nav__link--active' : ''}`}
              onClick={() => navigate('data-handling')}
            >
              Data handling
            </button>
            {allRecords.length > 0 ? (
              <button
                type="button"
                className={`site-nav__link${view === 'dashboard' ? ' site-nav__link--active' : ''}`}
                onClick={() => navigate('dashboard')}
              >
                Your stats
              </button>
            ) : null}
          </nav>

          <div className="site-header__tools">
            <ThemeToggle preference={preference} onChange={setTheme} />
            <div className="site-header__github">
              <OpenSourceLinks />
            </div>
            <button
              type="button"
              className="site-nav__menu"
              aria-expanded={navOpen}
              aria-controls="site-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className="site-nav__menu-icon" aria-hidden="true" />
              <span className="visually-hidden">{navOpen ? 'Close menu' : 'Open menu'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {view === 'landing' ? (
          <LandingPage
            onOpenDataHandling={() => navigate('data-handling')}
            onOpenRequestData={() => navigate('request-data')}
            onFilesSelected={handleFilesSelected}
            onLoadSampleData={handleSampleDataSelected}
            loading={loading}
            error={error}
          />
        ) : null}

        {view === 'assumptions' ? (
          <Suspense fallback={<ViewFallback />}>
            <AssumptionsPage
              onBack={returnToMain}
              backLabel={allRecords.length > 0 ? 'Back to your stats' : 'Back to home'}
            />
          </Suspense>
        ) : null}

        {view === 'data-handling' ? (
          <Suspense fallback={<ViewFallback />}>
            <DataHandlingPage
              onBack={returnToMain}
              backLabel={allRecords.length > 0 ? 'Back to your stats' : 'Back to home'}
            />
          </Suspense>
        ) : null}

        {view === 'request-data' ? (
          <Suspense fallback={<ViewFallback />}>
            <RequestDataPage
              onBack={returnToMain}
              backLabel={allRecords.length > 0 ? 'Back to your stats' : 'Back to home'}
            />
          </Suspense>
        ) : null}

        {view === 'dashboard' && allRecords.length > 0 ? (
          <Suspense fallback={<ViewFallback />}>
            <FilterBar
              filters={filters}
              bounds={bounds}
              filteredPlays={filteredRecords.length}
              totalPlays={allRecords.length}
              onChange={handleFiltersChange}
            />

            {analysis ? (
              <>
                <div className="dashboard-chrome">
                  <div className="dashboard-chrome__tabs">
                    <nav className="tab-nav" aria-label="Dashboard sections">
                      {dashboardTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          className={`tab-nav__button${
                            activeTab === tab.id ? ' tab-nav__button--active' : ''
                          }`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                    <p className="tab-nav__description">
                      {dashboardTabs.find((tab) => tab.id === activeTab)?.description}
                    </p>
                  </div>
                  <div className="dashboard-chrome__actions">
                    {isSampleData ? <span className="toolbar__badge">Sample data</span> : null}
                    <button type="button" className="button button--ghost" onClick={resetAnalysis}>
                      {isSampleData ? 'Exit sample' : 'Load different files'}
                    </button>
                  </div>
                </div>

                <Dashboard
                  analysis={analysis}
                  activeTab={activeTab}
                  filterContext={filterContext}
                  filters={filters}
                  theme={theme}
                />
              </>
            ) : (
              <p className="error-banner">
                No plays match your current filters. Try widening the date range or clearing
                search.
              </p>
            )}
          </Suspense>
        ) : null}
      </main>

      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} Rowan Smith. All rights reserved.</p>
      </footer>
    </div>
  );
}
