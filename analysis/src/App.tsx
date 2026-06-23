import { lazy, Suspense } from 'react';
import { Music } from 'lucide-react';
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
    totalRecordCount,
    bounds,
    filters,
    activeTab,
    setActiveTab,
    loading,
    loadProgress,
    error,
    isSampleData,
    activeFilterContext,
    dashboardTabs,
    activeFilteredPlays,
    activeAnalysis,
    filtersPending,
    viewMode,
    setViewMode,
    isWrappedMode,
    wrappedYear,
    setWrappedYear,
    wrappedYearOptions,
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
            <Music className="w-4 h-4 text-accent" aria-hidden="true" />
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
              ...(totalRecordCount > 0 ? [{ id: 'dashboard' as const, label: 'Your stats' }] : []),
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

          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto pl-2 border-l border-border">
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
            loadProgress={loadProgress}
            error={error}
          />
        ) : null}

        {view === 'assumptions' ? (
          <Suspense fallback={<ViewFallback />}>
            <AssumptionsPage
              onBack={returnToMain}
              backLabel={totalRecordCount > 0 ? 'Back to your stats' : 'Back to home'}
            />
          </Suspense>
        ) : null}

        {view === 'data-handling' ? (
          <Suspense fallback={<ViewFallback />}>
            <DataHandlingPage
              onBack={returnToMain}
              backLabel={totalRecordCount > 0 ? 'Back to your stats' : 'Back to home'}
            />
          </Suspense>
        ) : null}

        {view === 'request-data' ? (
          <Suspense fallback={<ViewFallback />}>
            <RequestDataPage
              onBack={returnToMain}
              backLabel={totalRecordCount > 0 ? 'Back to your stats' : 'Back to home'}
            />
          </Suspense>
        ) : null}

        {view === 'dashboard' && totalRecordCount > 0 ? (
          <Suspense fallback={<ViewFallback />}>
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 min-w-0">
              <FilterBar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                wrappedYear={wrappedYear}
                wrappedYearOptions={wrappedYearOptions}
                onWrappedYearChange={setWrappedYear}
                filters={filters}
                bounds={bounds}
                filteredPlays={activeFilteredPlays}
                totalPlays={totalRecordCount}
                filtersPending={filtersPending}
                onChange={handleFiltersChange}
              />

              {activeAnalysis ? (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
                  <div className="flex flex-col gap-3 mb-5 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

                      <div className="flex items-center gap-2 sm:shrink-0">
                        {isSampleData ? <Badge variant="accent">Sample data</Badge> : null}
                        <Button variant="ghost" size="sm" onClick={resetAnalysis}>
                          {isSampleData ? 'Exit sample' : 'Load different files'}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {dashboardTabs.find((tab) => tab.id === activeTab)?.description}
                    </p>
                  </div>

                  <Dashboard
                    analysis={activeAnalysis}
                    isWrappedMode={isWrappedMode}
                    wrappedYear={wrappedYear}
                    activeTab={activeTab}
                    filterContext={activeFilterContext}
                    filters={filters}
                    theme={theme}
                    onFiltersChange={handleFiltersChange}
                  />
                </Tabs>
              ) : (
                <p className="rounded-lg border border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                  {isWrappedMode
                    ? `No plays match Wrapped rules for ${wrappedYear}.`
                    : 'No plays match your current filters. Try widening the date range or clearing search.'}
                </p>
              )}
            </div>
          </Suspense>
        ) : null}
      </main>

      <footer className="border-t border-border mt-auto py-5 md:py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Rowan Smith. All rights reserved.</p>
      </footer>
    </div>
  );
}
