import { METRIC_INFO } from '../content/siteContent';
import type { AlbumMetrics, ArtistMetrics, SongMetrics } from '../types';
import { formatHours, formatLocalDate } from '../utils/formatting';
import type { MetricItem } from '../components/MetricGrid';

function formatInsightDate(isoDate: string): string {
  return formatLocalDate(new Date(`${isoDate}T12:00:00`));
}

export function buildSongMetricItems(metrics: SongMetrics): MetricItem[] {
  const items: MetricItem[] = [
    {
      label: 'Unique songs',
      value: metrics.uniqueSongs.toLocaleString(),
      info: METRIC_INFO.uniqueSongs,
    },
    {
      label: 'Avg plays / song',
      value: metrics.avgPlaysPerSong.toFixed(1),
      info: METRIC_INFO.avgPlaysPerSong,
    },
    {
      label: 'Top song share',
      value: `${metrics.topSongShare.toFixed(1)}%`,
      info: METRIC_INFO.topSongShare,
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
      label: 'Most repeated track',
      value: metrics.mostRepeatedTrack.trackName,
      hint: `${metrics.mostRepeatedTrack.plays.toLocaleString()} plays · ${metrics.mostRepeatedTrack.artistName}`,
      info: METRIC_INFO.mostRepeatedTrack,
    });
  }

  if (metrics.biggestBingeDay) {
    items.push({
      label: 'Biggest binge day',
      value: `${metrics.biggestBingeDay.plays.toLocaleString()} plays`,
      hint: `${formatInsightDate(metrics.biggestBingeDay.day)} · top track ${metrics.biggestBingeDay.topTrack}`,
      info: METRIC_INFO.biggestBingeDay,
    });
  }

  if (metrics.bestDiscoveryDay) {
    items.push({
      label: 'Best discovery day',
      value: `${metrics.bestDiscoveryDay.discoveries} new tracks`,
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

export function buildArtistMetricItems(metrics: ArtistMetrics): MetricItem[] {
  const items: MetricItem[] = [
    {
      label: 'Unique artists',
      value: metrics.uniqueArtists.toLocaleString(),
      info: METRIC_INFO.uniqueArtists,
    },
    {
      label: 'Avg plays / artist',
      value: metrics.avgPlaysPerArtist.toFixed(1),
      info: METRIC_INFO.avgPlaysPerArtist,
    },
    {
      label: 'Top artist share',
      value: `${metrics.topArtistShare.toFixed(1)}%`,
      info: METRIC_INFO.topArtistShare,
    },
  ];

  if (metrics.topByPlays) {
    items.unshift({
      label: 'Top artist (plays)',
      value: metrics.topByPlays.artistName,
      hint: `${metrics.topByPlays.plays.toLocaleString()} plays · ${formatHours(metrics.topByPlays.hours)}`,
      info: METRIC_INFO.topArtistByPlays,
    });
  }

  if (metrics.topByTime && metrics.topByTime.artistName !== metrics.topByPlays?.artistName) {
    items.push({
      label: 'Top artist (playtime)',
      value: metrics.topByTime.artistName,
      hint: `${formatHours(metrics.topByTime.hours)} · ${metrics.topByTime.plays.toLocaleString()} plays`,
      info: METRIC_INFO.topArtistByTime,
    });
  }

  if (metrics.mostArtistsInOneDay) {
    items.push({
      label: 'Most artists in one day',
      value: metrics.mostArtistsInOneDay.count.toLocaleString(),
      hint: formatInsightDate(metrics.mostArtistsInOneDay.day),
      info: METRIC_INFO.mostArtistsInOneDay,
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
