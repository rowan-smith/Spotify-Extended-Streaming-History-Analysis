import { aggregateSongs, sortSongs, topSongs } from '../../analysis/aggregation';
import type { AlbumStats, ArtistStats, RankingMetric, SongStats, StreamRecord } from '../../types';

export type YearTopLabelKey = 'trackName' | 'artistName' | 'albumName';

export interface YearTopEntry {
  year: number;
  name: string;
  detail?: string;
  plays: number;
  hours: number;
}

type YearRankedRow = SongStats | ArtistStats | AlbumStats;

function playsForRow(row: YearRankedRow): number {
  return 'numPlays' in row ? row.numPlays : row.listenCount;
}

function nameForRow(row: YearRankedRow, labelKey: YearTopLabelKey): string {
  if (labelKey === 'trackName') return (row as SongStats).trackName;
  if (labelKey === 'artistName') return (row as ArtistStats).artistName;
  return (row as AlbumStats).albumName;
}

function detailForRow(row: YearRankedRow, labelKey: YearTopLabelKey): string | undefined {
  if (labelKey === 'trackName') return (row as SongStats).artistName;
  if (labelKey === 'albumName') return (row as AlbumStats).artistName;
  return undefined;
}

export function buildYearTopEntries(
  years: number[],
  data: Record<number, YearRankedRow[]>,
  labelKey: YearTopLabelKey,
): YearTopEntry[] {
  return [...years]
    .sort((a, b) => b - a)
    .flatMap((year) => {
      const row = data[year]?.[0];
      if (!row) return [];

      return [
        {
          year,
          name: nameForRow(row, labelKey),
          detail: detailForRow(row, labelKey),
          plays: playsForRow(row),
          hours: row.totalHours,
        },
      ];
    });
}

export function metricValueForEntry(entry: YearTopEntry, rankingMetric: RankingMetric): number {
  return rankingMetric === 'plays' ? entry.plays : entry.hours;
}

export const YEAR_TOP_SONGS_BREAKDOWN_LIMIT = 5;

export const YEAR_TOP_ENTITY_LABELS: Record<YearTopLabelKey, { column: string; singular: string }> = {
  trackName: { column: 'Song', singular: 'song' },
  artistName: { column: 'Artist', singular: 'artist' },
  albumName: { column: 'Album', singular: 'album' },
};

function recordsInYear(records: StreamRecord[], year: number): StreamRecord[] {
  return records.filter((record) => record.ts.getUTCFullYear() === year);
}

function sortMetricFromRanking(rankingMetric: RankingMetric): 'plays' | 'time' {
  return rankingMetric === 'plays' ? 'plays' : 'time';
}

export function yearTopEntryKey(entry: YearTopEntry): string {
  return `${entry.year}\0${entry.name}\0${entry.detail ?? ''}`;
}

export function topSongsForAlbumInYear(
  records: StreamRecord[],
  year: number,
  albumName: string,
  artistName: string,
  rankingMetric: RankingMetric,
): SongStats[] {
  const yearRecords = recordsInYear(records, year).filter(
    (record) => record.albumName === albumName && record.artistName === artistName,
  );

  return sortSongs(
    [...aggregateSongs(yearRecords).values()],
    sortMetricFromRanking(rankingMetric),
  );
}

export function topSongsForArtistInYear(
  records: StreamRecord[],
  year: number,
  artistName: string,
  rankingMetric: RankingMetric,
): SongStats[] {
  const yearRecords = recordsInYear(records, year).filter(
    (record) => record.artistName === artistName,
  );

  return sortSongs(
    [...aggregateSongs(yearRecords).values()],
    sortMetricFromRanking(rankingMetric),
  );
}

export function topSongsInYear(
  records: StreamRecord[],
  year: number,
  rankingMetric: RankingMetric,
  limit = YEAR_TOP_SONGS_BREAKDOWN_LIMIT,
): SongStats[] {
  const yearRecords = recordsInYear(records, year);

  return topSongs(
    aggregateSongs(yearRecords),
    sortMetricFromRanking(rankingMetric),
    limit,
  );
}

export function buildYearTopSongBreakdowns(
  entries: YearTopEntry[],
  records: StreamRecord[],
  labelKey: YearTopLabelKey,
  rankingMetric: RankingMetric,
): Map<string, SongStats[]> {
  const breakdowns = new Map<string, SongStats[]>();

  for (const entry of entries) {
    const key = yearTopEntryKey(entry);
    if (labelKey === 'albumName' && entry.detail) {
      breakdowns.set(
        key,
        topSongsForAlbumInYear(records, entry.year, entry.name, entry.detail, rankingMetric),
      );
    } else if (labelKey === 'artistName') {
      breakdowns.set(key, topSongsForArtistInYear(records, entry.year, entry.name, rankingMetric));
    } else if (labelKey === 'trackName') {
      breakdowns.set(key, topSongsInYear(records, entry.year, rankingMetric));
    }
  }

  return breakdowns;
}
