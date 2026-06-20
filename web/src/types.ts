export interface RawRecord {
  ts: string;
  ms_played: number;
  master_metadata_track_name?: string | null;
  master_metadata_album_artist_name?: string | null;
  master_metadata_album_album_name?: string | null;
  episode_name?: string | null;
  audiobook_title?: string | null;
  reason_end?: string | null;
  skipped?: boolean | string | null;
}

export interface StreamRecord {
  ts: Date;
  trackName: string;
  artistName: string;
  albumName: string;
  msPlayed: number;
  skipped: boolean;
  reasonEnd: string;
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

export interface OverviewStats {
  totalPlays: number;
  totalHours: number;
  uniqueSongs: number;
  uniqueArtists: number;
  earliest: StreamRecord | null;
  latest: StreamRecord | null;
  yearMin: number;
  yearMax: number;
  totalCompleted: number;
  totalSkipped: number;
  avgCompletedPerDay: number;
  avgSkippedPerDay: number;
  skipToCompleteRatio: number;
  avgSessionSeconds: number;
  peakHourLabel: string;
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

export interface AnalysisFilters {
  yearFrom: number | null;
  yearTo: number | null;
  search: string;
  topN: number;
  hideSkipped: boolean;
}

export interface AnalysisResult {
  records: StreamRecord[];
  overview: OverviewStats;
  allSongs: SongStats[];
  allArtists: ArtistStats[];
  topSongsByPlays: SongStats[];
  topSongsByTime: SongStats[];
  topArtistsByPlays: ArtistStats[];
  topArtistsByTime: ArtistStats[];
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
  availableYears: number[];
}

export type SortMetric = 'plays' | 'time';

export type TabId =
  | 'overview'
  | 'songs'
  | 'artists'
  | 'timeline'
  | 'patterns'
  | 'explore'
  | 'assumptions';

export type AppView = 'landing' | 'assumptions' | 'dashboard';
