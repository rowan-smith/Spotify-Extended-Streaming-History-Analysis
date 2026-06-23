import { describe, expect, it } from 'vitest';
import { createDefaultFilters } from '../../analysis/src/analysis/filters';
import { getVisibleDashboardTabs } from '../../analysis/src/content/dashboardTabs';

describe('getVisibleDashboardTabs', () => {
  const bounds = { yearMin: 2020, yearMax: 2024 };

  it('shows all tabs for default music-only filters', () => {
    const tabs = getVisibleDashboardTabs(createDefaultFilters(bounds.yearMin, bounds.yearMax), false);
    expect(tabs.map((tab) => tab.id)).toEqual([
      'summary',
      'songs',
      'artists',
      'albums',
      'timeline',
      'habits',
      'discover',
      'browse',
    ]);
    expect(tabs.find((tab) => tab.id === 'songs')?.label).toBe('Songs');
  });

  it('hides albums and discover when music is excluded', () => {
    const filters = {
      ...createDefaultFilters(bounds.yearMin, bounds.yearMax),
      includeMusic: false,
      includePodcasts: true,
    };
    const tabs = getVisibleDashboardTabs(filters, false);
    expect(tabs.map((tab) => tab.id)).not.toContain('albums');
    expect(tabs.map((tab) => tab.id)).not.toContain('discover');
  });

  it('renames songs tab when podcasts or audiobooks are included', () => {
    const filters = {
      ...createDefaultFilters(bounds.yearMin, bounds.yearMax),
      includePodcasts: true,
    };
    const tabs = getVisibleDashboardTabs(filters, false);
    expect(tabs.find((tab) => tab.id === 'songs')?.label).toBe('Tracks');
  });
});
