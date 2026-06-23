import type { AlbumStats, ArtistStats, SongMetrics, ArtistMetrics, AlbumMetrics, StreamRecord, SongStats } from '../types';
import { songKey } from './aggregation';
import {
  computeBestDiscoveryDay,
  computeBiggestBingeDay,
  computeDiscoveryRate,
  computeSeasonalFavorite,
  computeSkipRate,
} from './insightHelpers';

function dateKeyLocal(ts: Date): string {
  const year = ts.getFullYear();
  const month = String(ts.getMonth() + 1).padStart(2, '0');
  const day = String(ts.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildRepeatMap(records: StreamRecord[]) {
  const repeatMap = new Map<string, { count: number; trackName: string; artistName: string }>();
  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    const existing = repeatMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      repeatMap.set(key, {
        count: 1,
        trackName: record.trackName,
        artistName: record.artistName,
      });
    }
  }
  return repeatMap;
}

export function computeSongMetrics(records: StreamRecord[], allSongs: SongStats[]): SongMetrics {
  if (records.length === 0) {
    return {
      uniqueSongs: 0,
      avgPlaysPerSong: 0,
      mostRepeatedTrack: null,
      discoveryRate: 0,
      skipMood: { label: '—', detail: 'No plays in this range.' },
      bestDiscoveryDay: null,
      biggestBingeDay: null,
      seasonalFavorite: null,
      topSongShare: 0,
    };
  }

  const repeatMap = buildRepeatMap(records);
  const mostRepeated = [...repeatMap.values()].sort((a, b) => b.count - a.count)[0];
  const topSong = allSongs[0] ?? null;

  return {
    uniqueSongs: repeatMap.size,
    avgPlaysPerSong: records.length / repeatMap.size,
    mostRepeatedTrack:
      mostRepeated && mostRepeated.count > 1
        ? {
            trackName: mostRepeated.trackName,
            artistName: mostRepeated.artistName,
            plays: mostRepeated.count,
          }
        : null,
    discoveryRate: computeDiscoveryRate(repeatMap),
    skipMood: computeSkipRate(records),
    bestDiscoveryDay: computeBestDiscoveryDay(records),
    biggestBingeDay: computeBiggestBingeDay(records),
    seasonalFavorite: computeSeasonalFavorite(records),
    topSongShare: topSong ? (topSong.numPlays / records.length) * 100 : 0,
  };
}

export function computeArtistMetrics(records: StreamRecord[], allArtists: ArtistStats[]): ArtistMetrics {
  if (records.length === 0) {
    return {
      uniqueArtists: 0,
      topByPlays: null,
      topByTime: null,
      topArtistShare: 0,
      avgPlaysPerArtist: 0,
      mostArtistsInOneDay: null,
    };
  }

  const topByPlays = allArtists[0] ?? null;
  const topByTime = [...allArtists].sort((a, b) => b.totalHours - a.totalHours)[0] ?? null;

  const artistsByDay = new Map<string, Set<string>>();
  for (const record of records) {
    const day = dateKeyLocal(record.ts);
    const artists = artistsByDay.get(day) ?? new Set<string>();
    artists.add(record.artistName);
    artistsByDay.set(day, artists);
  }

  let mostArtistsInOneDay: { day: string; count: number } | null = null;
  for (const [day, artists] of artistsByDay.entries()) {
    if (!mostArtistsInOneDay || artists.size > mostArtistsInOneDay.count) {
      mostArtistsInOneDay = { day, count: artists.size };
    }
  }

  return {
    uniqueArtists: allArtists.length,
    topByPlays: topByPlays
      ? {
          artistName: topByPlays.artistName,
          plays: topByPlays.listenCount,
          hours: topByPlays.totalHours,
        }
      : null,
    topByTime: topByTime
      ? {
          artistName: topByTime.artistName,
          plays: topByTime.listenCount,
          hours: topByTime.totalHours,
        }
      : null,
    topArtistShare: topByPlays ? (topByPlays.listenCount / records.length) * 100 : 0,
    avgPlaysPerArtist: records.length / allArtists.length,
    mostArtistsInOneDay,
  };
}

export function computeAlbumMetrics(records: StreamRecord[], allAlbums: AlbumStats[]): AlbumMetrics {
  if (records.length === 0) {
    return {
      uniqueAlbums: 0,
      topByPlays: null,
      topByTime: null,
      topAlbumShare: 0,
      avgPlaysPerAlbum: 0,
    };
  }

  const topByPlays = allAlbums[0] ?? null;
  const topByTime = [...allAlbums].sort((a, b) => b.totalHours - a.totalHours)[0] ?? null;

  return {
    uniqueAlbums: allAlbums.length,
    topByPlays: topByPlays
      ? {
          albumName: topByPlays.albumName,
          artistName: topByPlays.artistName,
          plays: topByPlays.numPlays,
          hours: topByPlays.totalHours,
        }
      : null,
    topByTime: topByTime
      ? {
          albumName: topByTime.albumName,
          artistName: topByTime.artistName,
          plays: topByTime.numPlays,
          hours: topByTime.totalHours,
        }
      : null,
    topAlbumShare: topByPlays ? (topByPlays.numPlays / records.length) * 100 : 0,
    avgPlaysPerAlbum: records.length / allAlbums.length,
  };
}
