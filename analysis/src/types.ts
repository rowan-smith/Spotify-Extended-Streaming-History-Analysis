export interface RawRecord {
  ts?: string;
  endTime?: string;
  ms_played?: number;
  msPlayed?: number;
  master_metadata_track_name?: string | null;
  master_metadata_album_artist_name?: string | null;
  master_metadata_album_album_name?: string | null;
  trackName?: string | null;
  artistName?: string | null;
  albumName?: string | null;
  episode_name?: string | null;
  episode_name_show?: string | null;
  audiobook_title?: string | null;
  audiobook_uri?: string | null;
  reason_end?: string | null;
  reason_end_reason?: string | null;
  skipped?: boolean | string | null;
  incognito_mode?: boolean | string | null;
  episode_show_name?: string | null;
}

export type ContentKind = 'music' | 'podcast' | 'audiobook';

export interface StreamRecord {
  ts: Date;
  trackName: string;
  artistName: string;
  albumName: string;
  msPlayed: number;
  skipped: boolean;
  incognito: boolean;
  reasonEnd: string;
  contentKind: ContentKind;
}

export interface SongStats {
  trackName: string;
  artistName: string;
  numPlays: number;
  totalMsPlayed: number;
  totalHours: number;
}

export interface ArtistStats {
  artistName: string;
  listenCount: number;
  totalMsPlayed: number;
  totalHours: number;
}

export interface AlbumStats {
  albumName: string;
  artistName: string;
  numPlays: number;
  totalMsPlayed: number;
  totalHours: number;
}

export interface LongestStreak {
  days: number;
  start: string;
  end: string;
}

export interface OverviewStats {
  totalPlays: number;
  totalHours: number;
  uniqueSongs: number;
  uniqueArtists: number;
  earliest: StreamRecord | null;
  latest: StreamRecord | null;
  yearMin: number;
  yearMax: number;
  historySpanLabel: string;
  favoriteMonth: string;
  favoriteWeekday: string;
  longestStreak: LongestStreak | null;
  totalCompleted: number;
  totalSkipped: number;
  avgCompletedPerDay: number;
  avgSkippedPerDay: number;
  avgPlaysPerDay: number;
  skipToCompleteRatio: number;
  avgSessionSeconds: number;
  peakHourLabel: string;
  paceVsLastYear: string | null;
  beatRecord: string | null;
}

export interface SongMetrics {
  uniqueSongs: number;
  avgPlaysPerSong: number;
  mostRepeatedTrack: { trackName: string; artistName: string; plays: number } | null;
  discoveryRate: number;
  skipMood: { label: string; detail: string };
  bestDiscoveryDay: { day: string; discoveries: number; topDiscovery: string } | null;
  biggestBingeDay: { day: string; plays: number; topTrack: string } | null;
  seasonalFavorite: { trackName: string; season: string; plays: number } | null;
  topSongShare: number;
}

export interface ArtistMetrics {
  uniqueArtists: number;
  topByPlays: { artistName: string; plays: number; hours: number } | null;
  topByTime: { artistName: string; plays: number; hours: number } | null;
  topArtistShare: number;
  avgPlaysPerArtist: number;
  mostArtistsInOneDay: { day: string; count: number } | null;
}

export interface AlbumMetrics {
  uniqueAlbums: number;
  topByPlays: { albumName: string; artistName: string; plays: number; hours: number } | null;
  topByTime: { albumName: string; artistName: string; plays: number; hours: number } | null;
  topAlbumShare: number;
  avgPlaysPerAlbum: number;
}

export interface InsightFact {
  title: string;
  value: string;
  detail: string;
}

export interface TimelinePoint {
  label: string;
  value: number;
  topItem?: string;
  sortKey?: string | number;
}

export interface YearSeries {
  year: number;
  points: TimelinePoint[];
}

export type FilterPreset = 'default' | 'wrapped' | 'custom';
export type FilterMode = 'basic' | 'advanced';

export interface AnalysisFilters {
  preset: FilterPreset;
  mode: FilterMode;
  yearFrom: number | null;
  yearTo: number | null;
  monthFrom: number | null;
  monthTo: number | null;
  dayFrom: number | null;
  dayTo: number | null;
  search: string;
  topN: number;
  hideSkipped: boolean;
  minMsPlayed: number;
  minMsPlayedExclusive: boolean;
  excludeIncognito: boolean;
  includeMusic: boolean;
  includePodcasts: boolean;
  includeAudiobooks: boolean;
  combineRanking: boolean;
}

export interface FilterBounds {
  yearMin: number;
  yearMax: number;
}

export interface FilterContext {
  singleYear: boolean;
  multiYear: boolean;
  spanLabel: string;
}

export interface AnalysisResult {
  records: StreamRecord[];
  overview: OverviewStats;
  insights: InsightFact[];
  songMetrics: SongMetrics;
  artistMetrics: ArtistMetrics;
  albumMetrics: AlbumMetrics;
  allSongs: SongStats[];
  allArtists: ArtistStats[];
  allAlbums: AlbumStats[];
  topSongsByPlays: SongStats[];
  topSongsByTime: SongStats[];
  topArtistsByPlays: ArtistStats[];
  topArtistsByTime: ArtistStats[];
  topAlbumsByPlays: AlbumStats[];
  topAlbumsByTime: AlbumStats[];
  combinedSongs: SongStats[];
  combinedArtists: ArtistStats[];
  playsByYear: TimelinePoint[];
  hoursByYear: TimelinePoint[];
  playsByDate: TimelinePoint[];
  hoursByDate: TimelinePoint[];
  playtimeByYearMonth: TimelinePoint[];
  monthlyHistoryByYear: YearSeries[];
  playsByMonth: TimelinePoint[];
  hoursByMonth: TimelinePoint[];
  playsByDayOfMonth: TimelinePoint[];
  playsByHour: TimelinePoint[];
  topSongsByYear: Record<number, SongStats[]>;
  topSongsByYearByTime: Record<number, SongStats[]>;
  topArtistsByYear: Record<number, ArtistStats[]>;
  topArtistsByYearByTime: Record<number, ArtistStats[]>;
  topAlbumsByYear: Record<number, AlbumStats[]>;
  topAlbumsByYearByTime: Record<number, AlbumStats[]>;
  availableYears: number[];
}

export type SortMetric = 'plays' | 'time' | 'combined';

export type TabId = 'summary' | 'wrapped' | 'songs' | 'artists' | 'albums' | 'timeline' | 'habits' | 'browse';

export type AppView =
  | 'landing'
  | 'assumptions'
  | 'data-handling'
  | 'request-data'
  | 'dashboard';
