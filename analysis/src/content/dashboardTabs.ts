import type { AnalysisFilters, TabId } from '../types';

export interface DashboardTab {
  id: TabId;
  label: string;
  description: string;
}

export const DASHBOARD_TABS: DashboardTab[] = [
  {
    id: 'summary',
    label: 'Summary',
    description: 'Headline stats and highlights from your filtered history.',
  },
  {
    id: 'songs',
    label: 'Songs',
    description: 'Top songs by plays or playtime, with optional yearly drill-down.',
  },
  {
    id: 'artists',
    label: 'Artists',
    description: 'Top artists by plays or playtime, with optional yearly drill-down.',
  },
  {
    id: 'albums',
    label: 'Albums',
    description: 'Top albums by plays or playtime, with optional yearly drill-down.',
  },
  {
    id: 'timeline',
    label: 'Over time',
    description: 'How your listening changed day by day and year by year.',
  },
  {
    id: 'habits',
    label: 'Habits',
    description: 'Play activity, first and latest listens, sessions, and when-you-listen charts.',
  },
  {
    id: 'browse',
    label: 'Browse',
    description: 'Search and sort every song and artist in your filter range.',
  },
];

export const WRAPPED_DASHBOARD_TAB: DashboardTab = {
  id: 'wrapped',
  label: 'Wrapped',
  description: 'Your top 100 songs by play count — the Wrapped-style ranking.',
};

export function getDashboardTabs(preset: AnalysisFilters['preset']): DashboardTab[] {
  if (preset !== 'wrapped') {
    return DASHBOARD_TABS;
  }

  const tabs = [...DASHBOARD_TABS];
  const summaryIndex = tabs.findIndex((tab) => tab.id === 'summary');
  tabs.splice(summaryIndex + 1, 0, WRAPPED_DASHBOARD_TAB);
  return tabs;
}
