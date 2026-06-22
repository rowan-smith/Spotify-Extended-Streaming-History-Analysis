import { describe, it, expect } from 'vitest';
import {
  cleanRecords,
  aggregateSongs,
  aggregateArtists,
  aggregateAlbums,
  topSongs,
  topArtists,
  topAlbums,
  formatDuration,
  formatHours,
  songKey,
  analyzeRecords,
} from '../../analysis/src/analysis/processData';
import { normalizeRawRecord } from '../../analysis/src/analysis/normalizeRecord';
import type { RawRecord, StreamRecord } from '../../analysis/src/types';

function r(overrides: Partial<RawRecord> = {}): RawRecord {
  return normalizeRawRecord({
    ts: '2024-01-15T10:30:00Z',
    ms_played: 120000,
    master_metadata_track_name: 'Test Song',
    master_metadata_album_artist_name: 'Test Artist',
    master_metadata_album_album_name: 'Test Album',
    reason_end: 'trackdone',
    skipped: false,
    incognito_mode: false,
    ...overrides,
  });
}

describe('cleanRecords', () => {
  it('returns music records', () => {
    const result = cleanRecords([r()]);
    expect(result).toHaveLength(1);
    expect(result[0].trackName).toBe('Test Song');
    expect(result[0].artistName).toBe('Test Artist');
    expect(result[0].albumName).toBe('Test Album');
    expect(result[0].contentKind).toBe('music');
  });

  it('returns podcast records', () => {
    const raw = r({
      master_metadata_track_name: undefined,
      master_metadata_album_artist_name: undefined,
      episode_name: 'Podcast Episode',
      episode_show_name: 'Podcast Show',
    });
    const result = cleanRecords([raw]);
    expect(result).toHaveLength(1);
    expect(result[0].trackName).toBe('Podcast Episode');
    expect(result[0].artistName).toBe('Podcast Show');
    expect(result[0].contentKind).toBe('podcast');
  });

  it('returns audiobook records', () => {
    const raw = r({
      master_metadata_track_name: undefined,
      master_metadata_album_artist_name: undefined,
      episode_name: undefined,
      episode_show_name: undefined,
      audiobook_title: 'Great Audiobook',
      audiobook_uri: 'spotify:audiobook:abc123',
    });
    const result = cleanRecords([raw]);
    expect(result).toHaveLength(1);
    expect(result[0].trackName).toBe('Great Audiobook');
    expect(result[0].artistName).toBe('Audiobook');
    expect(result[0].contentKind).toBe('audiobook');
  });

  it('filters out records with no track name', () => {
    const raw = r({
      master_metadata_track_name: null,
      trackName: null,
      episode_name: null,
      audiobook_title: null,
    });
    const result = cleanRecords([raw]);
    expect(result).toHaveLength(0);
  });

  it('filters out records with no timestamp', () => {
    const raw = r({ ts: undefined, endTime: undefined });
    const result = cleanRecords([raw]);
    expect(result).toHaveLength(0);
  });

  it('filters out unclassifiable records', () => {
    const raw = r({
      master_metadata_track_name: undefined,
      trackName: undefined,
      episode_name: undefined,
      audiobook_title: undefined,
    });
    const result = cleanRecords([raw]);
    expect(result).toHaveLength(0);
  });

  it('deduplicates identical records', () => {
    const raw = r();
    const result = cleanRecords([raw, raw, raw]);
    expect(result).toHaveLength(1);
  });

  it('sorts by timestamp ascending', () => {
    const raw1 = r({ ts: '2024-01-15T10:30:00Z' });
    const raw2 = r({ ts: '2023-06-01T08:00:00Z' });
    const raw3 = r({ ts: '2024-12-31T23:59:59Z' });

    const result = cleanRecords([raw1, raw2, raw3]);
    expect(result).toHaveLength(3);
    expect(result[0].ts.toISOString()).toBe('2023-06-01T08:00:00.000Z');
    expect(result[1].ts.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    expect(result[2].ts.toISOString()).toBe('2024-12-31T23:59:59.000Z');
  });

  it('handles boolean skipped and incognito flags', () => {
    const raw = r({ skipped: true, incognito_mode: true });
    const result = cleanRecords([raw]);
    expect(result[0].skipped).toBe(true);
    expect(result[0].incognito).toBe(true);
  });

  it('handles string skipped and incognito flags', () => {
    const raw = r({ skipped: 'True' as unknown as boolean, incognito_mode: 'true' as unknown as boolean });
    const result = cleanRecords([raw]);
    expect(result[0].skipped).toBe(true);
    expect(result[0].incognito).toBe(true);
  });
});

describe('aggregateSongs', () => {
  it('counts plays and sums msPlayed', () => {
    const records: StreamRecord[] = [
      { ts: new Date('2024-01-01'), trackName: 'Song A', artistName: 'Artist X', albumName: 'Album A', msPlayed: 120000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
      { ts: new Date('2024-01-02'), trackName: 'Song A', artistName: 'Artist X', albumName: 'Album A', msPlayed: 80000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
      { ts: new Date('2024-01-03'), trackName: 'Song B', artistName: 'Artist Y', albumName: 'Album B', msPlayed: 200000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
    ];

    const map = aggregateSongs(records);
    expect(map.size).toBe(2);

    const songA = map.get(songKey('Song A', 'Artist X'));
    expect(songA?.numPlays).toBe(2);
    expect(songA?.totalMsPlayed).toBe(200000);

    const songB = map.get(songKey('Song B', 'Artist Y'));
    expect(songB?.numPlays).toBe(1);
    expect(songB?.totalMsPlayed).toBe(200000);
  });
});

describe('aggregateArtists', () => {
  it('groups by artist and sums plays', () => {
    const records: StreamRecord[] = [
      { ts: new Date('2024-01-01'), trackName: 'Song A', artistName: 'Artist X', albumName: 'Album A', msPlayed: 120000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
      { ts: new Date('2024-01-02'), trackName: 'Song B', artistName: 'Artist X', albumName: 'Album B', msPlayed: 80000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
      { ts: new Date('2024-01-03'), trackName: 'Song C', artistName: 'Artist Z', albumName: 'Album C', msPlayed: 200000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
    ];

    const map = aggregateArtists(records);
    expect(map.size).toBe(2);

    const artistX = map.get('Artist X');
    expect(artistX?.listenCount).toBe(2);
    expect(artistX?.totalMsPlayed).toBe(200000);

    const artistZ = map.get('Artist Z');
    expect(artistZ?.listenCount).toBe(1);
  });
});

describe('aggregateAlbums', () => {
  it('only aggregates music records by album + artist', () => {
    const records: StreamRecord[] = [
      { ts: new Date('2024-01-01'), trackName: 'Song A', artistName: 'Artist X', albumName: 'Album A', msPlayed: 120000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
      { ts: new Date('2024-01-02'), trackName: 'Song B', artistName: 'Artist X', albumName: 'Album A', msPlayed: 80000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
      { ts: new Date('2024-01-03'), trackName: 'Song C', artistName: 'Artist Z', albumName: 'Album C', msPlayed: 200000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'podcast' },
    ];

    const map = aggregateAlbums(records);
    expect(map.size).toBe(1);

    const albumA = map.get('Album A\0Artist X');
    expect(albumA?.numPlays).toBe(2);
    expect(albumA?.totalMsPlayed).toBe(200000);
  });
});

describe('topSongs', () => {
  const map = new Map([
    [songKey('A', 'X'), { trackName: 'A', artistName: 'X', numPlays: 10, totalMsPlayed: 100000, totalHours: 100000 / 3600000 }],
    [songKey('B', 'X'), { trackName: 'B', artistName: 'X', numPlays: 5, totalMsPlayed: 500000, totalHours: 500000 / 3600000 }],
    [songKey('C', 'Y'), { trackName: 'C', artistName: 'Y', numPlays: 20, totalMsPlayed: 200000, totalHours: 200000 / 3600000 }],
  ]);

  it('returns top N by plays', () => {
    const result = topSongs(map, 'plays', 2);
    expect(result).toHaveLength(2);
    expect(result[0].trackName).toBe('C');
    expect(result[1].trackName).toBe('A');
  });

  it('returns top N by time', () => {
    const result = topSongs(map, 'time', 2);
    expect(result).toHaveLength(2);
    expect(result[0].trackName).toBe('B');
    expect(result[1].trackName).toBe('C');
  });

  it('returns top N by combined', () => {
    const result = topSongs(map, 'combined', 3);
    expect(result).toHaveLength(3);
  });
});

describe('topArtists', () => {
  const map = new Map([
    ['X', { artistName: 'X', listenCount: 10, totalMsPlayed: 500000, totalHours: 500000 / 3600000 }],
    ['Y', { artistName: 'Y', listenCount: 20, totalMsPlayed: 200000, totalHours: 200000 / 3600000 }],
    ['Z', { artistName: 'Z', listenCount: 5, totalMsPlayed: 1000000, totalHours: 1000000 / 3600000 }],
  ]);

  it('returns top N by plays', () => {
    const result = topArtists(map, 'plays', 2);
    expect(result).toHaveLength(2);
    expect(result[0].artistName).toBe('Y');
    expect(result[1].artistName).toBe('X');
  });

  it('returns top N by time', () => {
    const result = topArtists(map, 'time', 2);
    expect(result).toHaveLength(2);
    expect(result[0].artistName).toBe('Z');
    expect(result[1].artistName).toBe('X');
  });
});

describe('topAlbums', () => {
  const map = new Map([
    ['Album A\0X', { albumName: 'Album A', artistName: 'X', numPlays: 15, totalMsPlayed: 300000, totalHours: 300000 / 3600000 }],
    ['Album B\0X', { albumName: 'Album B', artistName: 'X', numPlays: 5, totalMsPlayed: 600000, totalHours: 600000 / 3600000 }],
    ['Album C\0Y', { albumName: 'Album C', artistName: 'Y', numPlays: 10, totalMsPlayed: 500000, totalHours: 500000 / 3600000 }],
  ]);

  it('returns top N by plays', () => {
    const result = topAlbums(map, 'plays', 2);
    expect(result).toHaveLength(2);
    expect(result[0].albumName).toBe('Album A');
    expect(result[1].albumName).toBe('Album C');
  });

  it('returns top N by time', () => {
    const result = topAlbums(map, 'time', 2);
    expect(result).toHaveLength(2);
    expect(result[0].albumName).toBe('Album B');
    expect(result[1].albumName).toBe('Album C');
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125000)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3725000)).toBe('1h 2m 5s');
  });

  it('formats days and hours', () => {
    expect(formatDuration(90061000)).toBe('1d 1h 1m');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('formatHours', () => {
  it('formats minutes for < 1 hour', () => {
    expect(formatHours(0.5)).toBe('30 min');
  });

  it('formats hours for < 24 hours', () => {
    expect(formatHours(12.5)).toBe('12.5 hr');
  });

  it('formats days for >= 24 hours', () => {
    expect(formatHours(48)).toBe('2.0 days');
  });
});

describe('analyzeRecords', () => {
  it('produces analysis from stream records', () => {
    const records: StreamRecord[] = [
      { ts: new Date('2024-01-01T10:00:00Z'), trackName: 'Song A', artistName: 'Artist X', albumName: 'Album A', msPlayed: 120000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
      { ts: new Date('2024-01-01T11:00:00Z'), trackName: 'Song B', artistName: 'Artist Y', albumName: 'Album B', msPlayed: 200000, skipped: true, incognito: false, reasonEnd: 'fwdbtn', contentKind: 'music' },
      { ts: new Date('2024-06-15T14:00:00Z'), trackName: 'Song C', artistName: 'Artist X', albumName: 'Album A', msPlayed: 180000, skipped: false, incognito: false, reasonEnd: 'trackdone', contentKind: 'music' },
    ];

    const result = analyzeRecords(records, 10);

    expect(result.records).toHaveLength(3);
    expect(result.overview.totalPlays).toBe(3);
    expect(result.overview.totalCompleted).toBe(2);
    expect(result.overview.totalSkipped).toBe(1);
    expect(result.overview.uniqueSongs).toBe(3);
    expect(result.overview.uniqueArtists).toBe(2);
    expect(result.availableYears).toEqual([2024]);
    expect(result.allSongs).toHaveLength(3);
    expect(result.allArtists).toHaveLength(2);
    expect(result.allAlbums).toHaveLength(2);
    expect(result.topSongsByPlays).toHaveLength(3);
    expect(result.topArtistsByPlays).toHaveLength(2);
    expect(result.topAlbumsByPlays).toHaveLength(2);
  });

  it('handles empty available years', () => {
    const result = analyzeRecords([], 10);
    expect(result.records).toHaveLength(0);
    expect(result.overview.totalPlays).toBe(0);
    expect(result.overview.totalCompleted).toBe(0);
    expect(result.overview.totalSkipped).toBe(0);
    expect(result.availableYears).toEqual([]);
  });
});
