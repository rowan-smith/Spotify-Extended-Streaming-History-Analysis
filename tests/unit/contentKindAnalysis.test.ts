import { describe, expect, it } from 'vitest';
import { analysisForContentKind } from '../../analysis/src/analysis/contentKindAnalysis';
import { analyzeRecords } from '../../analysis/src/analysis/processData';
import type { StreamRecord } from '../../analysis/src/types';

function record(overrides: Partial<StreamRecord> = {}): StreamRecord {
  return {
    ts: new Date('2024-06-01T12:00:00Z'),
    trackName: 'Track',
    artistName: 'Artist',
    albumName: 'Album',
    msPlayed: 180_000,
    skipped: false,
    incognito: false,
    reasonEnd: 'trackdone',
    contentKind: 'music',
    ...overrides,
  };
}

describe('analysisForContentKind', () => {
  it('returns rankings for only the requested content kind', () => {
    const analysis = analyzeRecords([
      record({ trackName: 'Song A', contentKind: 'music' }),
      record({ trackName: 'Episode 1', artistName: 'Show', contentKind: 'podcast' }),
      record({ trackName: 'Book 1', artistName: 'Audiobook', contentKind: 'audiobook' }),
    ]);

    const music = analysisForContentKind(analysis, 'music');
    expect(music.topSongsByPlays).toHaveLength(1);
    expect(music.topSongsByPlays[0].trackName).toBe('Song A');

    const podcasts = analysisForContentKind(analysis, 'podcast');
    expect(podcasts.topSongsByPlays[0].trackName).toBe('Episode 1');
    expect(podcasts.topArtistsByPlays[0].artistName).toBe('Show');

    const audiobooks = analysisForContentKind(analysis, 'audiobook');
    expect(audiobooks.topSongsByPlays[0].trackName).toBe('Book 1');
  });
});
