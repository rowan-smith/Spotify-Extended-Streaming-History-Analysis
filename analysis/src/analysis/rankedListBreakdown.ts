import { aggregateSongs, sortSongs } from './aggregation';
import type { RankingMetric, SongStats, StreamRecord } from '../types';
import type { MobileRankedListItem } from '../components/charts/MobileRankedList';
import { formatHours } from '../utils/formatting';

function sortMetricFromRanking(rankingMetric: RankingMetric): 'plays' | 'time' {
  return rankingMetric === 'plays' ? 'plays' : 'time';
}

export function songsForArtist(
  records: StreamRecord[],
  artistName: string,
  rankingMetric: RankingMetric,
): SongStats[] {
  return sortSongs(
    [...aggregateSongs(records.filter((record) => record.artistName === artistName)).values()],
    sortMetricFromRanking(rankingMetric),
  );
}

export function songsOnAlbum(
  records: StreamRecord[],
  albumName: string,
  artistName: string,
  rankingMetric: RankingMetric,
): SongStats[] {
  return sortSongs(
    [
      ...aggregateSongs(
        records.filter(
          (record) => record.albumName === albumName && record.artistName === artistName,
        ),
      ).values(),
    ],
    sortMetricFromRanking(rankingMetric),
  );
}

export function songsToRankedItems(
  songs: SongStats[],
  rankingMetric: RankingMetric,
  options?: { hideArtist?: boolean },
): MobileRankedListItem[] {
  return songs.map((song) => ({
    primary: song.trackName,
    secondary: options?.hideArtist ? undefined : song.artistName,
    value: rankingMetric === 'plays' ? song.numPlays : song.totalHours,
    valueText:
      rankingMetric === 'plays'
        ? song.numPlays.toLocaleString()
        : formatHours(song.totalHours),
    meta:
      rankingMetric === 'plays'
        ? formatHours(song.totalHours)
        : `${song.numPlays.toLocaleString()} plays`,
  }));
}
