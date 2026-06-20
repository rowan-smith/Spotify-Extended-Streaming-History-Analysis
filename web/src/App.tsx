import { useMemo, useState } from 'react';
import {
  createDefaultFilters,
  filterRecords,
  getFilterContext,
} from './analysis/filters';
import { analyzeRecords, loadRecordsFromFiles } from './analysis/processData';
import { AssumptionsPage } from './components/AssumptionsPage';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { Dashboard, tabLabels } from './components/Dashboard';
import { DataHandlingPage } from './components/DataHandlingPage';
import { FilterBar } from './components/FilterBar';
import { LandingPage } from './components/LandingPage';
import { PrivacyBanner } from './components/PrivacyBanner';
import { RequestDataPage } from './components/RequestDataPage';
import { ThemeToggle } from './components/ThemeToggle';
import { CONTRIBUTING_URL, ISSUES_URL, REPO_URL } from './content/siteContent';
import { useTheme } from './hooks/useTheme';
import type { AnalysisFilters, AppView, StreamRecord, TabId } from './types';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<AppView>('landing');
  const [allRecords, setAllRecords] = useState<StreamRecord[]>([]);
  const [bounds, setBounds] = useState({ yearMin: 0, yearMax: 0 });
  const [filters, setFilters] = useState<AnalysisFilters>(createDefaultFilters(0, 0));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = useMemo(() => tabLabels(), []);
  const filterContext = useMemo(() => getFilterContext(filters), [filters]);

  const filteredRecords = useMemo(
    () => filterRecords(allRecords, filters),
    [allRecords, filters],
  );

  const analysis = useMemo(() => {
    if (filteredRecords.length === 0) {
      return null;
    }
    return analyzeRecords(filteredRecords, filters.topN);
  }, [filteredRecords, filters.topN]);

  async function handleFilesSelected(files: File[]) {
    setLoading(true);
    setError(null);

    try {
      const records = await loadRecordsFromFiles(files);
      const yearMin = records[0]?.ts.getUTCFullYear() ?? new Date().getFullYear();
      const yearMax =
        records[records.length - 1]?.ts.getUTCFullYear() ?? new Date().getFullYear();

      setAllRecords(records);
      setBounds({ yearMin, yearMax });
      setFilters(createDefaultFilters(yearMin, yearMax));
      setActiveTab('overview');
      setView('dashboard');
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to process JSON files.';
      setAllRecords([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis() {
    setAllRecords([]);
    setError(null);
    setActiveTab('overview');
    setView('landing');
  }

  function openAssumptions() {
    setView('assumptions');
  }

  function openDataHandling() {
    setView('data-handling');
  }

  function openRequestData() {
    setView('request-data');
  }

  function returnToMain() {
    setView(allRecords.length > 0 ? 'dashboard' : 'landing');
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <button
            type="button"
            className="site-brand"
            onClick={() => setView(allRecords.length > 0 ? 'dashboard' : 'landing')}
          >
            <span className="site-brand__mark" aria-hidden="true">
              ♫
            </span>
            <span>Spotify History Explorer</span>
          </button>
          <nav className="site-nav" aria-label="Site sections">
            <button
              type="button"
              className={`site-nav__link${view === 'landing' ? ' site-nav__link--active' : ''}`}
              onClick={() => setView('landing')}
            >
              Home
            </button>
            <button
              type="button"
              className={`site-nav__link${view === 'request-data' ? ' site-nav__link--active' : ''}`}
              onClick={openRequestData}
            >
              Get your data
            </button>
            <button
              type="button"
              className={`site-nav__link${view === 'assumptions' ? ' site-nav__link--active' : ''}`}
              onClick={openAssumptions}
            >
              Assumptions
            </button>
            <button
              type="button"
              className={`site-nav__link${view === 'data-handling' ? ' site-nav__link--active' : ''}`}
              onClick={openDataHandling}
            >
              Data handling
            </button>
            {allRecords.length > 0 ? (
              <button
                type="button"
                className={`site-nav__link${view === 'dashboard' ? ' site-nav__link--active' : ''}`}
                onClick={() => setView('dashboard')}
              >
                Your stats
              </button>
            ) : null}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </nav>
        </div>
      </header>

      {view === 'dashboard' ? (
        <PrivacyBanner compact onOpenDataHandling={openDataHandling} />
      ) : null}

      <main className="main-content">
        {view === 'landing' ? (
          <LandingPage
            onOpenDataHandling={openDataHandling}
            onOpenRequestData={openRequestData}
            onFilesSelected={handleFilesSelected}
            loading={loading}
            error={error}
          />
        ) : null}

        {view === 'assumptions' ? (
          <AssumptionsPage
            onBack={returnToMain}
            backLabel={allRecords.length > 0 ? 'Back to your stats' : 'Back to home'}
          />
        ) : null}

        {view === 'data-handling' ? (
          <DataHandlingPage
            onBack={returnToMain}
            backLabel={allRecords.length > 0 ? 'Back to your stats' : 'Back to home'}
          />
        ) : null}

        {view === 'request-data' ? (
          <RequestDataPage
            onBack={returnToMain}
            backLabel={allRecords.length > 0 ? 'Back to your stats' : 'Back to home'}
          />
        ) : null}

        {view === 'dashboard' && allRecords.length > 0 ? (
          <>
            <FilterBar
              filters={filters}
              bounds={bounds}
              filteredPlays={filteredRecords.length}
              totalPlays={allRecords.length}
              onChange={setFilters}
            />

            {analysis ? (
              <>
                <div className="toolbar">
                  <div className="toolbar__summary">
                    <strong>{analysis.overview.totalPlays.toLocaleString()} plays</strong>
                    <span>{filterContext.spanLabel}</span>
                  </div>
                  <button type="button" className="button button--ghost" onClick={resetAnalysis}>
                    Load different files
                  </button>
                </div>

                <nav className="tab-nav" aria-label="Dashboard sections">
                  {tabs.map((tab) => (
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

                {activeTab === 'assumptions' ? (
                  <AssumptionsPanel />
                ) : (
                  <Dashboard
                    analysis={analysis}
                    activeTab={activeTab}
                    filterContext={filterContext}
                    filters={filters}
                    theme={theme}
                  />
                )}
              </>
            ) : (
              <p className="error-banner">
                No plays match your current filters. Try widening the date range or clearing
                search.
              </p>
            )}
          </>
        ) : null}
      </main>

      <footer className="site-footer">
        <p>
          Open source —{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            view on GitHub
          </a>
          ,{' '}
          <a href={ISSUES_URL} target="_blank" rel="noreferrer">
            report an issue
          </a>
          ,{' '}
          <a href={CONTRIBUTING_URL} target="_blank" rel="noreferrer">
            contribute
          </a>
          . Analysis runs in your browser; data clears when you leave.
        </p>
      </footer>
    </div>
  );
}
