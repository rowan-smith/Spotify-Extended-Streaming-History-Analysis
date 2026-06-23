import type { TabId } from '../types';

export interface DashboardTab {
  id: TabId;
  label: string;
  description: string;
}

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
