import { describe, expect, it } from 'vitest';
import {
  buildYearTopEntries,
  buildYearTopSongBreakdowns,
  metricValueForEntry,
  topSongsForAlbumInYear,
  topSongsForArtistInYear,
} from '../../analysis/src/components/charts/yearTopBreakdown';
import type { StreamRecord } from '../../analysis/src/types';

function makeRecord(
  year: number,
  trackName: string,
  artistName: string,
  albumName: string,
  msPlayed: number,
): StreamRecord {
  return {
    ts: new Date(Date.UTC(year, 5, 15)),
    trackName,
    artistName,
    albumName,
    msPlayed,
    skipped: false,
    incognito: false,
    reasonEnd: 'trackdone',
    contentKind: 'music',
  };
}

describe('buildYearTopEntries', () => {
  it('returns the top row per year sorted newest first', () => {
    const entries = buildYearTopEntries(
      [2023, 2024, 2025],
      {
        2023: [{ albumName: 'Old Album', artistName: 'Artist A', numPlays: 10, totalMsPlayed: 0, totalHours: 1 }],
        2024: [{ albumName: 'Mid Album', artistName: 'Artist B', numPlays: 20, totalMsPlayed: 0, totalHours: 2 }],
        2025: [{ albumName: 'New Album', artistName: 'Artist C', numPlays: 30, totalMsPlayed: 0, totalHours: 3 }],
      },
      'albumName',
    );

    expect(entries.map((entry) => entry.year)).toEqual([2025, 2024, 2023]);
    expect(entries[0]).toMatchObject({
      year: 2025,
      name: 'New Album',
      detail: 'Artist C',
      plays: 30,
    });
  });

  it('skips years with no ranked rows', () => {
    const entries = buildYearTopEntries([2024, 2025], { 2025: [] }, 'artistName');
    expect(entries).toEqual([]);
  });
});

describe('metricValueForEntry', () => {
  const entry = { year: 2024, name: 'Test', plays: 12, hours: 1.5 };

  it('uses plays when ranking by plays', () => {
    expect(metricValueForEntry(entry, 'plays')).toBe(12);
  });

  it('uses hours when ranking by playtime', () => {
    expect(metricValueForEntry(entry, 'time')).toBe(1.5);
  });
});

describe('topSongsForAlbumInYear', () => {
  const records = [
    makeRecord(2024, 'Levitating', 'Dua Lipa', 'Future Nostalgia', 180_000),
    makeRecord(2024, 'Levitating', 'Dua Lipa', 'Future Nostalgia', 120_000),
    makeRecord(2024, 'Physical', 'Dua Lipa', 'Future Nostalgia', 200_000),
    makeRecord(2024, 'Blinding Lights', 'The Weeknd', 'After Hours', 300_000),
    makeRecord(2023, 'Levitating', 'Dua Lipa', 'Future Nostalgia', 60_000),
  ];

  it('returns songs on the album for that year only, sorted by plays', () => {
    const songs = topSongsForAlbumInYear(records, 2024, 'Future Nostalgia', 'Dua Lipa', 'plays');

    expect(songs).toHaveLength(2);
    expect(songs[0].trackName).toBe('Levitating');
    expect(songs[0].numPlays).toBe(2);
    expect(songs[1].trackName).toBe('Physical');
    expect(songs[1].numPlays).toBe(1);
  });
});

describe('topSongsForArtistInYear', () => {
  const records = [
    makeRecord(2024, 'Levitating', 'Dua Lipa', 'Future Nostalgia', 180_000),
    makeRecord(2024, 'Physical', 'Dua Lipa', 'Future Nostalgia', 200_000),
    makeRecord(2024, 'Physical', 'Dua Lipa', 'Future Nostalgia', 150_000),
    makeRecord(2024, 'Blinding Lights', 'The Weeknd', 'After Hours', 300_000),
  ];

  it('returns songs by the artist for that year only', () => {
    const songs = topSongsForArtistInYear(records, 2024, 'Dua Lipa', 'plays');

    expect(songs).toHaveLength(2);
    expect(songs.map((song) => song.trackName)).toEqual(['Physical', 'Levitating']);
  });
});

describe('buildYearTopSongBreakdowns', () => {
  const records = [
    makeRecord(2024, 'Levitating', 'Dua Lipa', 'Future Nostalgia', 180_000),
    makeRecord(2024, 'Physical', 'Dua Lipa', 'Future Nostalgia', 200_000),
  ];

  it('builds album breakdowns keyed by year and album', () => {
    const entries = buildYearTopEntries(
      [2024],
      {
        2024: [{ albumName: 'Future Nostalgia', artistName: 'Dua Lipa', numPlays: 2, totalMsPlayed: 0, totalHours: 1 }],
      },
      'albumName',
    );

    const breakdowns = buildYearTopSongBreakdowns(entries, records, 'albumName', 'plays');
    const key = '2024\0Future Nostalgia\0Dua Lipa';

    expect(breakdowns.get(key)).toHaveLength(2);
  });
});
