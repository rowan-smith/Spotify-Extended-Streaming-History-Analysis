import { METRIC_INFO } from '../content/siteContent';
import type { AlbumMetrics, ArtistMetrics, SongMetrics } from '../types';
import { formatHours, formatLocalDate } from '../utils/formatting';
import type { MetricItem } from '../components/MetricGrid';

export type TrackMetricVariant = 'song' | 'episode' | 'audiobook';
export type CreatorMetricVariant = 'artist' | 'show';

interface TrackMetricCopy {
  unique: { label: string; info: string };
  avgPlays: { label: string; info: string };
  topShare: { label: string; info: string };
  mostRepeated: { label: string; info: string };
  bingeTopItem: string;
  discoveryNew: string;
}

interface CreatorMetricCopy {
  unique: { label: string; info: string };
  avgPlays: { label: string; info: string };
  topShare: { label: string; info: string };
  topByPlays: { label: string; info: string };
  topByTime: { label: string; info: string };
  mostInOneDay: { label: string; info: string };
}

const TRACK_METRIC_COPY: Record<TrackMetricVariant, TrackMetricCopy> = {
  song: {
    unique: { label: 'Unique songs', info: METRIC_INFO.uniqueSongs },
    avgPlays: { label: 'Avg plays / song', info: METRIC_INFO.avgPlaysPerSong },
    topShare: { label: 'Top song share', info: METRIC_INFO.topSongShare },
    mostRepeated: { label: 'Most repeated track', info: METRIC_INFO.mostRepeatedTrack },
    bingeTopItem: 'top track',
    discoveryNew: 'new tracks',
  },
  episode: {
    unique: { label: 'Unique episodes', info: METRIC_INFO.uniqueEpisodes },
    avgPlays: { label: 'Avg plays / episode', info: METRIC_INFO.avgPlaysPerEpisode },
    topShare: { label: 'Top episode share', info: METRIC_INFO.topEpisodeShare },
    mostRepeated: { label: 'Most repeated episode', info: METRIC_INFO.mostRepeatedEpisode },
    bingeTopItem: 'top episode',
    discoveryNew: 'new episodes',
  },
  audiobook: {
    unique: { label: 'Unique audiobooks', info: METRIC_INFO.uniqueAudiobooks },
    avgPlays: { label: 'Avg plays / audiobook', info: METRIC_INFO.avgPlaysPerAudiobook },
    topShare: { label: 'Top audiobook share', info: METRIC_INFO.topAudiobookShare },
    mostRepeated: { label: 'Most listened audiobook', info: METRIC_INFO.mostRepeatedAudiobook },
    bingeTopItem: 'top audiobook',
    discoveryNew: 'new audiobooks',
  },
};

const CREATOR_METRIC_COPY: Record<CreatorMetricVariant, CreatorMetricCopy> = {
  artist: {
    unique: { label: 'Unique artists', info: METRIC_INFO.uniqueArtists },
    avgPlays: { label: 'Avg plays / artist', info: METRIC_INFO.avgPlaysPerArtist },
    topShare: { label: 'Top artist share', info: METRIC_INFO.topArtistShare },
    topByPlays: { label: 'Top artist (plays)', info: METRIC_INFO.topArtistByPlays },
    topByTime: { label: 'Top artist (playtime)', info: METRIC_INFO.topArtistByTime },
    mostInOneDay: { label: 'Most artists in one day', info: METRIC_INFO.mostArtistsInOneDay },
  },
  show: {
    unique: { label: 'Unique shows', info: METRIC_INFO.uniqueShows },
    avgPlays: { label: 'Avg plays / show', info: METRIC_INFO.avgPlaysPerShow },
    topShare: { label: 'Top show share', info: METRIC_INFO.topShowShare },
    topByPlays: { label: 'Top show (plays)', info: METRIC_INFO.topShowByPlays },
    topByTime: { label: 'Top show (playtime)', info: METRIC_INFO.topShowByTime },
    mostInOneDay: { label: 'Most shows in one day', info: METRIC_INFO.mostShowsInOneDay },
  },
};

function formatInsightDate(isoDate: string): string {
  return formatLocalDate(new Date(`${isoDate}T12:00:00`));
}

export function buildSongMetricItems(
  metrics: SongMetrics,
  variant: TrackMetricVariant = 'song',
): MetricItem[] {
  const copy = TRACK_METRIC_COPY[variant];
  const items: MetricItem[] = [
    {
      label: copy.unique.label,
      value: metrics.uniqueSongs.toLocaleString(),
      info: copy.unique.info,
    },
    {
      label: copy.avgPlays.label,
      value: metrics.avgPlaysPerSong.toFixed(1),
      info: copy.avgPlays.info,
    },
    {
      label: copy.topShare.label,
      value: `${metrics.topSongShare.toFixed(1)}%`,
      info: copy.topShare.info,
    },
    {
      label: 'Discovery rate',
      value: `${metrics.discoveryRate.toFixed(0)}% one-and-done`,
      info: METRIC_INFO.discoveryRate,
    },
    {
      label: 'Skip mood',
      value: metrics.skipMood.label,
      hint: metrics.skipMood.detail,
      info: METRIC_INFO.skipMood,
    },
  ];

  if (metrics.mostRepeatedTrack) {
    items.unshift({
      label: copy.mostRepeated.label,
      value: metrics.mostRepeatedTrack.trackName,
      hint: `${metrics.mostRepeatedTrack.plays.toLocaleString()} plays · ${metrics.mostRepeatedTrack.artistName}`,
      info: copy.mostRepeated.info,
    });
  }

  if (metrics.biggestBingeDay) {
    items.push({
      label: 'Biggest binge day',
      value: `${metrics.biggestBingeDay.plays.toLocaleString()} plays`,
      hint: `${formatInsightDate(metrics.biggestBingeDay.day)} · ${copy.bingeTopItem} ${metrics.biggestBingeDay.topTrack}`,
      info: METRIC_INFO.biggestBingeDay,
    });
  }

  if (metrics.bestDiscoveryDay) {
    items.push({
      label: 'Best discovery day',
      value: `${metrics.bestDiscoveryDay.discoveries} ${copy.discoveryNew}`,
      hint: `${formatInsightDate(metrics.bestDiscoveryDay.day)} · first was ${metrics.bestDiscoveryDay.topDiscovery}`,
      info: METRIC_INFO.bestDiscoveryDay,
    });
  }

  if (metrics.seasonalFavorite) {
    items.push({
      label: 'Seasonal favorite',
      value: metrics.seasonalFavorite.trackName,
      hint: `Peaks in ${metrics.seasonalFavorite.season}: ${metrics.seasonalFavorite.plays.toLocaleString()} plays`,
      info: METRIC_INFO.seasonalFavorite,
    });
  }

  return items;
}

export function buildArtistMetricItems(
  metrics: ArtistMetrics,
  variant: CreatorMetricVariant = 'artist',
): MetricItem[] {
  const copy = CREATOR_METRIC_COPY[variant];
  const items: MetricItem[] = [
    {
      label: copy.unique.label,
      value: metrics.uniqueArtists.toLocaleString(),
      info: copy.unique.info,
    },
    {
      label: copy.avgPlays.label,
      value: metrics.avgPlaysPerArtist.toFixed(1),
      info: copy.avgPlays.info,
    },
    {
      label: copy.topShare.label,
      value: `${metrics.topArtistShare.toFixed(1)}%`,
      info: copy.topShare.info,
    },
  ];

  if (metrics.topByPlays) {
    items.unshift({
      label: copy.topByPlays.label,
      value: metrics.topByPlays.artistName,
      hint: `${metrics.topByPlays.plays.toLocaleString()} plays · ${formatHours(metrics.topByPlays.hours)}`,
      info: copy.topByPlays.info,
    });
  }

  if (metrics.topByTime && metrics.topByTime.artistName !== metrics.topByPlays?.artistName) {
    items.push({
      label: copy.topByTime.label,
      value: metrics.topByTime.artistName,
      hint: `${formatHours(metrics.topByTime.hours)} · ${metrics.topByTime.plays.toLocaleString()} plays`,
      info: copy.topByTime.info,
    });
  }

  if (metrics.mostArtistsInOneDay) {
    items.push({
      label: copy.mostInOneDay.label,
      value: metrics.mostArtistsInOneDay.count.toLocaleString(),
      hint: formatInsightDate(metrics.mostArtistsInOneDay.day),
      info: copy.mostInOneDay.info,
    });
  }

  return items;
}

export function buildAlbumMetricItems(metrics: AlbumMetrics): MetricItem[] {
  const items: MetricItem[] = [
    {
      label: 'Unique albums',
      value: metrics.uniqueAlbums.toLocaleString(),
      info: METRIC_INFO.uniqueAlbums,
    },
    {
      label: 'Avg plays / album',
      value: metrics.avgPlaysPerAlbum.toFixed(1),
      info: METRIC_INFO.avgPlaysPerAlbum,
    },
    {
      label: 'Top album share',
      value: `${metrics.topAlbumShare.toFixed(1)}%`,
      info: METRIC_INFO.topAlbumShare,
    },
  ];

  if (metrics.topByPlays) {
    items.unshift({
      label: 'Top album (plays)',
      value: metrics.topByPlays.albumName,
      hint: `${metrics.topByPlays.plays.toLocaleString()} plays · ${metrics.topByPlays.artistName}`,
      info: METRIC_INFO.topAlbumByPlays,
    });
  }

  if (
    metrics.topByTime &&
    (metrics.topByTime.albumName !== metrics.topByPlays?.albumName ||
      metrics.topByTime.artistName !== metrics.topByPlays?.artistName)
  ) {
    items.push({
      label: 'Top album (playtime)',
      value: metrics.topByTime.albumName,
      hint: `${formatHours(metrics.topByTime.hours)} · ${metrics.topByTime.artistName}`,
      info: METRIC_INFO.topAlbumByTime,
    });
  }

  return items;
}
