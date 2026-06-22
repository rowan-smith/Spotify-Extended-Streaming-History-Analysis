import { buildCombinedSongs } from './insights';
import type {
  AlbumStats,
  ArtistStats,
  SongStats,
  SortMetric,
  StreamRecord,
} from '../types';

export function songKey(trackName: string, artistName: string): string {
  return `${trackName}\0${artistName}`;
}

export function aggregateSongs(records: StreamRecord[]): Map<string, SongStats> {
  const map = new Map<string, SongStats>();

  for (const record of records) {
    const key = songKey(record.trackName, record.artistName);
    const existing = map.get(key);

    if (existing) {
      existing.numPlays += 1;
      existing.totalMsPlayed += record.msPlayed;
      existing.totalHours = existing.totalMsPlayed / 3_600_000;
    } else {
      map.set(key, {
        trackName: record.trackName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }
  }

  return map;
}

export function aggregateArtists(records: StreamRecord[]): Map<string, ArtistStats> {
  const map = new Map<string, ArtistStats>();

  for (const record of records) {
    const existing = map.get(record.artistName);

    if (existing) {
      existing.listenCount += 1;
      existing.totalMsPlayed += record.msPlayed;
      existing.totalHours = existing.totalMsPlayed / 3_600_000;
    } else {
      map.set(record.artistName, {
        artistName: record.artistName,
        listenCount: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }
  }

  return map;
}

export function aggregateAlbums(records: StreamRecord[]): Map<string, AlbumStats> {
  const map = new Map<string, AlbumStats>();

  for (const record of records) {
    if (record.contentKind !== 'music') {
      continue;
    }

    const key = `${record.albumName}\0${record.artistName}`;
    const existing = map.get(key);

    if (existing) {
      existing.numPlays += 1;
      existing.totalMsPlayed += record.msPlayed;
      existing.totalHours = existing.totalMsPlayed / 3_600_000;
    } else {
      map.set(key, {
        albumName: record.albumName,
        artistName: record.artistName,
        numPlays: 1,
        totalMsPlayed: record.msPlayed,
        totalHours: record.msPlayed / 3_600_000,
      });
    }
  }

  return map;
}

export function sortSongs(items: SongStats[], sortBy: SortMetric): SongStats[] {
  if (sortBy === 'combined') {
    return buildCombinedSongs(items);
  }
  return [...items].sort((a, b) =>
    sortBy === 'plays' ? b.numPlays - a.numPlays : b.totalHours - a.totalHours,
  );
}

export function sortArtists(items: ArtistStats[], sortBy: SortMetric): ArtistStats[] {
  if (sortBy === 'combined') {
    const maxPlays = Math.max(...items.map((item) => item.listenCount), 1);
    const maxHours = Math.max(...items.map((item) => item.totalHours), 1);
    return [...items]
      .map((item) => ({
        ...item,
        combinedScore:
          (item.listenCount / maxPlays) * 0.5 + (item.totalHours / maxHours) * 0.5,
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .map(({ combinedScore: _removed, ...item }) => item);
  }
  return [...items].sort((a, b) =>
    sortBy === 'plays' ? b.listenCount - a.listenCount : b.totalHours - a.totalHours,
  );
}

export function sortAlbums(items: AlbumStats[], sortBy: SortMetric): AlbumStats[] {
  return [...items].sort((a, b) =>
    sortBy === 'plays' ? b.numPlays - a.numPlays : b.totalHours - a.totalHours,
  );
}

export function topSongs(
  map: Map<string, SongStats>,
  sortBy: SortMetric,
  limit: number,
): SongStats[] {
  return sortSongs([...map.values()], sortBy).slice(0, limit);
}

export function topArtists(
  map: Map<string, ArtistStats>,
  sortBy: SortMetric,
  limit: number,
): ArtistStats[] {
  return sortArtists([...map.values()], sortBy).slice(0, limit);
}

export function topAlbums(
  map: Map<string, AlbumStats>,
  sortBy: SortMetric,
  limit: number,
): AlbumStats[] {
  return sortAlbums([...map.values()], sortBy).slice(0, limit);
}
