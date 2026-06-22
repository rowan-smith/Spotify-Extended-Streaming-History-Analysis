import { describe, it, expect } from 'vitest';
import { normalizeRawRecord, parseTimestamp } from '../../analysis/src/analysis/normalizeRecord';
import type { RawRecord } from '../../analysis/src/types';

describe('parseTimestamp', () => {
  it('parses ISO format with Z suffix', () => {
    const result = parseTimestamp('2024-01-15T10:30:00.123Z');
    expect(result.getTime()).toBe(new Date('2024-01-15T10:30:00.123Z').getTime());
  });

  it('parses legacy format with UTC', () => {
    const result = parseTimestamp('2024-01-15 10:30:00 UTC');
    expect(result.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime());
  });

  it('parses format with T but without Z', () => {
    const result = parseTimestamp('2024-01-15T10:30:00');
    expect(result.getTime()).toBe(new Date('2024-01-15T10:30:00').getTime());
  });
});

describe('normalizeRawRecord', () => {
  it('normalizes extended format fields', () => {
    const input: RawRecord = {
      ts: '2024-01-15T10:30:00Z',
      ms_played: 120000,
      master_metadata_track_name: 'Test Song',
      master_metadata_album_artist_name: 'Test Artist',
      master_metadata_album_album_name: 'Test Album',
      reason_end: 'trackdone',
      skipped: false,
      incognito_mode: false,
    };

    const result = normalizeRawRecord(input);

    expect(result.ts).toBe('2024-01-15T10:30:00Z');
    expect(result.ms_played).toBe(120000);
    expect(result.master_metadata_track_name).toBe('Test Song');
    expect(result.master_metadata_album_artist_name).toBe('Test Artist');
    expect(result.master_metadata_album_album_name).toBe('Test Album');
    expect(result.reason_end).toBe('trackdone');
  });

  it('normalizes legacy format fields', () => {
    const input: RawRecord = {
      endTime: '2024-01-15T10:30:00Z',
      msPlayed: 120000,
      trackName: 'Old Song',
      artistName: 'Old Artist',
      albumName: 'Old Album',
      reason_end_reason: 'endplay',
    };

    const result = normalizeRawRecord(input);

    expect(result.ts).toBe('2024-01-15T10:30:00Z');
    expect(result.ms_played).toBe(120000);
    expect(result.master_metadata_track_name).toBe('Old Song');
    expect(result.master_metadata_album_artist_name).toBe('Old Artist');
    expect(result.master_metadata_album_album_name).toBe('Old Album');
    expect(result.reason_end).toBe('endplay');
  });

  it('handles missing optional fields', () => {
    const input: RawRecord = {
      ts: '2024-01-15T10:30:00Z',
      ms_played: 0,
    };

    const result = normalizeRawRecord(input);

    expect(result.ts).toBe('2024-01-15T10:30:00Z');
    expect(result.ms_played).toBe(0);
    expect(result.master_metadata_track_name).toBeUndefined();
    expect(result.master_metadata_album_artist_name).toBeUndefined();
  });

  it('handles null master fields', () => {
    const input: RawRecord = {
      ts: '2024-01-15T10:30:00Z',
      ms_played: 50000,
      master_metadata_track_name: null,
      master_metadata_album_artist_name: null,
    };

    const result = normalizeRawRecord(input);

    expect(result.ts).toBe('2024-01-15T10:30:00Z');
    // null ?? undefined → undefined because ?? treats null as nullish
    expect(result.master_metadata_track_name).toBeUndefined();
    expect(result.master_metadata_album_artist_name).toBeUndefined();
  });

  it('prefers extended format over legacy when both present', () => {
    const input: RawRecord = {
      ts: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T10:30:00Z',
      ms_played: 120000,
      msPlayed: 99999,
      master_metadata_track_name: 'Extended Song',
      trackName: 'Legacy Song',
      master_metadata_album_artist_name: 'Extended Artist',
      artistName: 'Legacy Artist',
    };

    const result = normalizeRawRecord(input);

    expect(result.master_metadata_track_name).toBe('Extended Song');
    expect(result.master_metadata_album_artist_name).toBe('Extended Artist');
    expect(result.ms_played).toBe(120000);
  });

  it('preserves podcast fields', () => {
    const input: RawRecord = {
      ts: '2024-01-15T10:30:00Z',
      ms_played: 1800000,
      episode_name: 'Test Episode',
      episode_show_name: 'Test Show',
    };

    const result = normalizeRawRecord(input);

    expect(result.episode_name).toBe('Test Episode');
    expect(result.episode_show_name).toBe('Test Show');
  });

  it('preserves audiobook fields', () => {
    const input: RawRecord = {
      ts: '2024-01-15T10:30:00Z',
      ms_played: 3600000,
      audiobook_title: 'Test Audiobook',
      audiobook_uri: 'spotify:audiobook:test',
    };

    const result = normalizeRawRecord(input);

    expect(result.audiobook_title).toBe('Test Audiobook');
    expect(result.audiobook_uri).toBe('spotify:audiobook:test');
  });
});
