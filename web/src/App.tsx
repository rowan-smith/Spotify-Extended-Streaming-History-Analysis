import { useMemo, useState } from 'react';
import { createDefaultFilters, filterRecords } from './analysis/filters';
import { analyzeRecords, loadRecordsFromFiles } from './analysis/processData';
import { AssumptionsPage } from './components/AssumptionsPage';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { Dashboard, tabLabels } from './components/Dashboard';
import { FilterBar } from './components/FilterBar';
import { LandingPage } from './components/LandingPage';
import { PrivacyBanner } from './components/PrivacyBanner';
import type { AnalysisFilters, AppView, StreamRecord, TabId } from './types';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [allRecords, setAllRecords] = useState<StreamRecord[]>([]);
  const [bounds, setBounds] = useState({ yearMin: 0, yearMax: 0 });
  const [filters, setFilters] = useState<AnalysisFilters>(createDefaultFilters(0, 0));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = useMemo(() => tabLabels(), []);

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
      const yearMin = records[0]?.ts.getUTCFullYear() ?? new Date().getUTCFullYear();
      const yearMax =
        records[records.length - 1]?.ts.getUTCFullYear() ?? new Date().getUTCFullYear();

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

  function returnFromAssumptions() {
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
              className={`site-nav__link${view === 'assumptions' ? ' site-nav__link--active' : ''}`}
              onClick={openAssumptions}
            >
              Assumptions
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
          </nav>
        </div>
      </header>

      {view === 'dashboard' ? <PrivacyBanner compact /> : null}

      <main className="main-content">
        {view === 'landing' ? (
          <LandingPage
            onOpenAssumptions={openAssumptions}
            onFilesSelected={handleFilesSelected}
            loading={loading}
            error={error}
          />
        ) : null}

        {view === 'assumptions' ? (
          <AssumptionsPage
            onBack={returnFromAssumptions}
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
                    <span>
                      {analysis.overview.yearMin}–{analysis.overview.yearMax}
                    </span>
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
                  <Dashboard analysis={analysis} activeTab={activeTab} />
                )}
              </>
            ) : (
              <p className="error-banner">
                No plays match your current filters. Try widening the year range or clearing
                search.
              </p>
            )}
          </>
        ) : null}
      </main>

      <footer className="site-footer">
        <p>
          Static site hosted on GitHub Pages. No backend, no cookies, no data collection.
          In-memory analysis is cleared when you leave this page.
        </p>
      </footer>
    </div>
  );
}
