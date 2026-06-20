import type { RawRecord } from '../types';

/** Normalize extended and legacy Spotify export rows into a common shape. */
export function normalizeRawRecord(row: RawRecord): RawRecord {
  const ts = row.ts ?? row.endTime;
  const msPlayed = row.ms_played ?? row.msPlayed ?? 0;
  const trackName = row.master_metadata_track_name ?? row.trackName;
  const artistName = row.master_metadata_album_artist_name ?? row.artistName;
  const albumName = row.master_metadata_album_album_name ?? row.albumName;
  const reasonEnd = row.reason_end ?? row.reason_end_reason ?? '';
  const episodeName = row.episode_name ?? row.episode_name_show;
  const audiobookTitle = row.audiobook_title;

  return {
    ...row,
    ts,
    ms_played: msPlayed,
    master_metadata_track_name: trackName,
    master_metadata_album_artist_name: artistName,
    master_metadata_album_album_name: albumName,
    episode_name: episodeName,
    audiobook_title: audiobookTitle,
    reason_end: reasonEnd,
  };
}

export function parseTimestamp(value: string): Date {
  if (value.includes('UTC') && !value.includes('T')) {
    return new Date(value.replace(' UTC', 'Z').replace(' ', 'T'));
  }
  return new Date(value);
}
