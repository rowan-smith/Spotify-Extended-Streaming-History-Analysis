import { describe, expect, it } from 'vitest';
import { createDefaultFilters } from '../../analysis/src/analysis/filters';
import { getVisibleDashboardTabs } from '../../analysis/src/content/dashboardTabs';

describe('getVisibleDashboardTabs', () => {
  const bounds = { yearMin: 2020, yearMax: 2024 };

  it('shows all music tabs for default music-only filters', () => {
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

  it('hides music tabs when music is excluded', () => {
    const filters = {
      ...createDefaultFilters(bounds.yearMin, bounds.yearMax),
      includeMusic: false,
      includePodcasts: true,
    };
    const tabs = getVisibleDashboardTabs(filters, false);
    expect(tabs.map((tab) => tab.id)).toEqual([
      'summary',
      'podcasts',
      'timeline',
      'habits',
    ]);
  });

  it('shows podcast and audiobook tabs when those filters are enabled', () => {
    const filters = {
      ...createDefaultFilters(bounds.yearMin, bounds.yearMax),
      includePodcasts: true,
      includeAudiobooks: true,
    };
    const tabs = getVisibleDashboardTabs(filters, false);
    expect(tabs.map((tab) => tab.id)).toContain('podcasts');
    expect(tabs.map((tab) => tab.id)).toContain('audiobooks');
    expect(tabs.find((tab) => tab.id === 'songs')?.label).toBe('Songs');
  });

  it('hides podcast and audiobook tabs in wrapped mode', () => {
    const filters = {
      ...createDefaultFilters(bounds.yearMin, bounds.yearMax),
      includePodcasts: true,
      includeAudiobooks: true,
    };
    const tabs = getVisibleDashboardTabs(filters, true);
    expect(tabs.map((tab) => tab.id)).not.toContain('podcasts');
    expect(tabs.map((tab) => tab.id)).not.toContain('audiobooks');
  });
});
