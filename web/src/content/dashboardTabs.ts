import type { TabId } from '../types';

export const DASHBOARD_TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'songs', label: 'Songs' },
  { id: 'artists', label: 'Artists' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'explore', label: 'Explore' },
  { id: 'assumptions', label: 'Assumptions' },
];
