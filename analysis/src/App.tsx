import { lazy, Suspense } from 'react';
import { LandingPage } from './components/pages/LandingPage';
import { OpenSourceLinks } from './components/OpenSourceLinks';
import { ThemeToggle } from './components/ThemeToggle';
import { useAnalysis } from './hooks/useAnalysis';
import { useTheme } from './hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AppView, TabId } from './types';

const Dashboard = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const FilterBar = lazy(() =>
  import('./components/FilterBar').then((module) => ({ default: module.FilterBar })),
);
const AssumptionsPage = lazy(() =>
  import('./components/pages/AssumptionsPage').then((module) => ({ default: module.AssumptionsPage })),
);
const DataHandlingPage = lazy(() =>
  import('./components/pages/DataHandlingPage').then((module) => ({ default: module.DataHandlingPage })),
);
const RequestDataPage = lazy(() =>
  import('./components/pages/RequestDataPage').then((module) => ({ default: module.RequestDataPage })),
);

function ViewFallback() {
  return <p className="px-4 py-12 text-center text-muted-foreground">Loading…</p>;
}

export default function App() {
  const { theme, preference, setTheme } = useTheme();
  const {
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
  } = useAnalysis();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-4 px-4 md:px-6 max-w-[1400px] mx-auto h-14">
          <button
            type="button"
            className="flex items-center gap-2 text-foreground hover:text-accent transition-colors cursor-pointer bg-transparent border-0"
            onClick={() => navigate('landing')}
          >
            <span aria-hidden="true" className="text-lg">♫</span>
            <span className="font-semibold text-sm hidden sm:inline">Spotify History Explorer</span>
          </button>

          <nav
            id="site-nav"
            className={`${navOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:static top-14 left-0 right-0 bg-background md:bg-transparent border-b md:border-0 border-border md:p-0 z-50 shadow-lg md:shadow-none pb-[env(safe-area-inset-bottom)]`}
            aria-label="Site sections"
          >
            {([
              { id: 'landing', label: 'Home' },
              { id: 'request-data', label: 'Get your data' },
              { id: 'assumptions', label: 'Assumptions' },
              { id: 'data-handling', label: 'Data handling' },
              ...(allRecords.length > 0 ? [{ id: 'dashboard' as const, label: 'Your stats' }] : []),
            ] as { id: AppView; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`px-4 md:px-3 py-3 md:py-1.5 text-sm font-medium transition-colors cursor-pointer bg-transparent border-0 text-left md:text-center ${
                  view === id
                    ? 'text-accent bg-accent/10 md:bg-transparent border-l-2 border-accent md:border-l-0 md:border-b-2'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted md:hover:bg-transparent'
                }`}
                onClick={() => navigate(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle preference={preference} onChange={setTheme} />
            <OpenSourceLinks />
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer bg-transparent border-0"
              aria-expanded={navOpen}
              aria-controls="site-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className="relative w-5 h-0.5 bg-current rounded-full block before:block before:absolute before:w-full before:h-0.5 before:bg-current before:rounded-full before:-translate-y-1.5 after:block after:absolute after:w-full after:h-0.5 after:bg-current after:rounded-full after:translate-y-1.5" />
              <span className="sr-only">{navOpen ? 'Close menu' : 'Open menu'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
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
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 min-w-0">
              <FilterBar
                filters={filters}
                bounds={bounds}
                filteredPlays={filteredRecords.length}
                totalPlays={allRecords.length}
                onChange={handleFiltersChange}
              />

              {analysis ? (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex flex-col gap-2">
                      <TabsList className="flex-wrap hidden sm:flex">
                        {dashboardTabs.map((tab) => (
                          <TabsTrigger key={tab.id} value={tab.id} className="whitespace-nowrap px-4">
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <div className="sm:hidden relative">
                        <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-medium text-foreground pointer-events-none">
                          <span>{dashboardTabs.find((t) => t.id === activeTab)?.label}</span>
                          <span className="text-muted-foreground text-[0.6rem] leading-none">▼</span>
                        </div>
                        <select
                          value={activeTab}
                          onChange={(e) => setActiveTab(e.target.value as TabId)}
                          aria-label="Section"
                          className="absolute inset-0 opacity-0 w-full cursor-pointer"
                        >
                          {dashboardTabs.map((tab) => (
                            <option key={tab.id} value={tab.id}>
                              {tab.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardTabs.find((tab) => tab.id === activeTab)?.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSampleData ? <Badge variant="accent">Sample data</Badge> : null}
                      <Button variant="ghost" size="sm" onClick={resetAnalysis}>
                        {isSampleData ? 'Exit sample' : 'Load different files'}
                      </Button>
                    </div>
                  </div>

                  <Dashboard
                    analysis={analysis}
                    activeTab={activeTab}
                    filterContext={filterContext}
                    filters={filters}
                    theme={theme}
                    onFiltersChange={handleFiltersChange}
                  />
                </Tabs>
              ) : (
                <p className="rounded-lg border border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                  No plays match your current filters. Try widening the date range or clearing
                  search.
                </p>
              )}
            </div>
          </Suspense>
        ) : null}
      </main>

      <footer className="border-t border-border py-4 md:py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Rowan Smith. All rights reserved.</p>
      </footer>
    </div>
  );
}
