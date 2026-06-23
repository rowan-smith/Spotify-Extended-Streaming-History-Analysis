import { describe, expect, it } from 'vitest';
import { buildArtistMetricItems, buildSongMetricItems } from '../../analysis/src/analysis/metricDisplay';
import type { ArtistMetrics, SongMetrics } from '../../analysis/src/types';

const emptySongMetrics: SongMetrics = {
  uniqueSongs: 12,
  avgPlaysPerSong: 3.5,
  mostRepeatedTrack: { trackName: 'Example', artistName: 'Creator', plays: 8 },
  discoveryRate: 40,
  skipMood: { label: 'Balanced', detail: 'About half skipped.' },
  bestDiscoveryDay: { day: '2024-03-01', discoveries: 4, topDiscovery: 'First Listen' },
  biggestBingeDay: { day: '2024-04-01', plays: 20, topTrack: 'Binge Item' },
  seasonalFavorite: { trackName: 'Summer Hit', season: 'Summer', plays: 15 },
  topSongShare: 12.5,
};

const emptyArtistMetrics: ArtistMetrics = {
  uniqueArtists: 5,
  topByPlays: { artistName: 'Top Creator', plays: 30, hours: 2 },
  topByTime: { artistName: 'Long Listen', plays: 10, hours: 5 },
  topArtistShare: 18,
  avgPlaysPerArtist: 6,
  mostArtistsInOneDay: { day: '2024-05-01', count: 4 },
};

describe('buildSongMetricItems', () => {
  it('uses song labels by default', () => {
    const labels = buildSongMetricItems(emptySongMetrics).map((item) => item.label);
    expect(labels).toContain('Unique songs');
    expect(labels).toContain('Most repeated track');
  });

  it('uses episode labels for podcast episodes', () => {
    const labels = buildSongMetricItems(emptySongMetrics, 'episode').map((item) => item.label);
    expect(labels).toContain('Unique episodes');
    expect(labels).toContain('Most repeated episode');
    expect(labels).not.toContain('Unique songs');
  });

  it('uses audiobook labels for audiobooks', () => {
    const labels = buildSongMetricItems(emptySongMetrics, 'audiobook').map((item) => item.label);
    expect(labels).toContain('Unique audiobooks');
    expect(labels).toContain('Most listened audiobook');
  });
});

describe('buildArtistMetricItems', () => {
  it('uses show labels for podcast shows', () => {
    const labels = buildArtistMetricItems(emptyArtistMetrics, 'show').map((item) => item.label);
    expect(labels).toContain('Unique shows');
    expect(labels).toContain('Top show (plays)');
    expect(labels).toContain('Most shows in one day');
    expect(labels).not.toContain('Unique artists');
  });
});
