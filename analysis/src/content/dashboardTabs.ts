import type { AnalysisFilters, TabId } from '../types';

export interface DashboardTab {
  id: TabId;
  label: string;
  description: string;
}

const MUSIC_ONLY_TABS: TabId[] = ['songs', 'artists', 'albums', 'discover', 'browse'];
const PODCAST_ONLY_TABS: TabId[] = ['episodes', 'shows'];
const AUDIOBOOK_ONLY_TABS: TabId[] = ['audiobooks'];

export const DASHBOARD_TABS: DashboardTab[] = [
  {
    id: 'summary',
    label: 'Summary',
    description: 'Top-level glance at your listening: totals, span, and when you listen most.',
  },
  {
    id: 'songs',
    label: 'Songs',
    description: 'Song metrics and top tracks by plays or playtime; Wrapped mode uses the global toggle.',
  },
  {
    id: 'artists',
    label: 'Artists',
    description: 'Artist metrics and top artists by plays or playtime; Wrapped mode uses the global toggle.',
  },
  {
    id: 'albums',
    label: 'Albums',
    description: 'Album metrics and top albums by plays or playtime; Wrapped mode uses the global toggle.',
  },
  {
    id: 'episodes',
    label: 'Episodes',
    description: 'Episode metrics and top podcast episodes by plays or playtime.',
  },
  {
    id: 'shows',
    label: 'Shows',
    description: 'Show metrics and top podcast shows by plays or playtime.',
  },
  {
    id: 'audiobooks',
    label: 'Audiobooks',
    description: 'Audiobook metrics and your most-listened titles.',
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
    id: 'discover',
    label: 'Discover',
    description: 'Skip patterns, first-time listens, and your biggest discovery days.',
  },
  {
    id: 'browse',
    label: 'Browse',
    description: 'Search and sort every song and artist in your filter range.',
  },
];

function isTabVisible(tabId: TabId, filters: AnalysisFilters, isWrappedMode: boolean): boolean {
  if (MUSIC_ONLY_TABS.includes(tabId)) {
    return isWrappedMode || filters.includeMusic;
  }
  if (PODCAST_ONLY_TABS.includes(tabId)) {
    return !isWrappedMode && filters.includePodcasts;
  }
  if (AUDIOBOOK_ONLY_TABS.includes(tabId)) {
    return !isWrappedMode && filters.includeAudiobooks;
  }
  return true;
}

export function getVisibleDashboardTabs(
  filters: AnalysisFilters,
  isWrappedMode: boolean,
): DashboardTab[] {
  return DASHBOARD_TABS.filter((tab) => isTabVisible(tab.id, filters, isWrappedMode));
}
