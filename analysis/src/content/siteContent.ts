export const REPO_URL =
  'https://github.com/rowan-smith/Spotify-Extended-Streaming-History-Analysis';

export const ISSUES_URL = `${REPO_URL}/issues`;

export const CONTRIBUTING_URL = `${REPO_URL}#contributing`;

export const SPOTIFY_PRIVACY_URL = 'https://www.spotify.com/account/privacy/';
export const SPOTIFY_PRIVACY_LABEL = 'spotify.com/account/privacy';
export const SPOTIFY_NEWSROOM_WRAPPED = 'https://newsroom.spotify.com/2025-12-03/how-your-wrapped-is-made/';

export const FILTER_PRESET_INFO = {
  default:
    'A good starting point: music only, at least 30 seconds per track, and skips left out.',
  custom: 'You set the filters yourself. Changing anything here switches to Custom.',
} as const;

export const WRAPPED_LIMITATIONS =
  'Approximation only. Spotify may also weight featured artists, filter ambient tracks, and honor Taste Profile settings — none of which appear in your export.';

export const RANKING_VIEW_INFO = {
  standard: 'Uses your global filters and ranks by plays or total playtime.',
  wrapped:
    'Matches Spotify Wrapped as closely as your export allows across every dashboard tab. Music only, Jan 1–Nov 15 of the selected year, more than 30 seconds per listen, skips and private sessions excluded, top 100 by play count on ranking tabs.',
} as const;

export const FILTER_OPTION_INFO = {
  hideSkipped:
    'Leave out tracks you skipped. Useful if you only want songs you actually listened to.',
  minDuration:
    'Ignore very short plays below this. Spotify Wrapped counts a listen only after more than 30 seconds.',
  excludeIncognito:
    'Leave out private sessions. Spotify Wrapped does not use these for top songs and artists.',
  includeMusic: 'Count songs from your listening history.',
  includePodcasts: 'Include podcast episodes if your export has them.',
  includeAudiobooks: 'Include audiobooks if your export has them.',
  combineRanking:
    'Ranks items using both how often you played something and how long you listened.',
  monthFrom:
    'Earliest month to include. Works with the year filters — for example, Oct–Dec 2025.',
  monthTo: 'Latest month to include. Works with the year filters.',
} as const;

export const METRIC_INFO = {
  totalPlays:
    'How many times you pressed play, after your filters are applied. Each play counts once.',
  totalListening:
    'Total time Spotify recorded you listening, added up across all your plays.',
  uniqueSongs:
    'Different tracks in your results. The same song by the same artist counts once.',
  uniqueArtists: 'Different artists in your results.',
  historySpan: 'From your earliest to your latest play in this date range, with total years covered.',
  favoriteMonth: 'The calendar month you played music most often, using your local time zone.',
  favoriteWeekday: 'The day of the week you listen most, using your local time zone.',
  favoriteHour: 'The hour of the day you listen most, in your local time zone.',
  longestStreak: 'The longest run of consecutive days where you listened at least once.',
  peakHour: 'The hour of the day you listen most, in your local time zone.',
  completedListens: 'Tracks you listened to all the way through, according to Spotify.',
  skippedPlays: 'Tracks you skipped before they finished.',
  avgCompletedPerDay:
    'On days you listened, how many tracks you finished on average.',
  avgSkippedPerDay: 'On days you listened, how many tracks you skipped on average.',
  avgPlaysPerDay: 'Your average number of plays on days you actually listened.',
  skipToCompleteRatio:
    'Skips compared to finished tracks. Higher means you skip more often. 0.5 is about one skip for every two finished tracks.',
  avgSessionLength:
    'How long a typical listening stretch lasts. A new session starts after 30 minutes with nothing playing.',
  earliestListen: 'The first track in your filtered date range.',
  latestListen: 'The most recent track in your filtered date range.',
  paceVsLastYear:
    'How this year compares to the same point last year. Shows the daily pace you would need to match last year’s total.',
  beatRecord:
    'The daily play count you would need for the rest of this year to beat your best year ever.',
  mostRepeatedTrack: 'The song you played the most times in this filtered range.',
  discoveryRate: 'Share of unique tracks you only played once in this filtered set.',
  skipMood: 'How often you skip tracks compared to finishing them.',
  topSongShare: 'What share of all your plays went to your #1 most-played song.',
  avgPlaysPerSong: 'Average number of plays per unique track.',
  bestDiscoveryDay: 'The day you heard the most new tracks for the first time.',
  biggestBingeDay: 'Your highest single-day play count.',
  seasonalFavorite: 'The track that peaks in one season more than any other.',
  topArtistByPlays: 'The artist with the most plays in this range.',
  topArtistByTime: 'The artist you spent the most time listening to.',
  topArtistShare: 'What share of all your plays went to your #1 artist.',
  avgPlaysPerArtist: 'Average number of plays per unique artist.',
  mostArtistsInOneDay: 'The day you listened to the widest variety of artists.',
  uniqueAlbums: 'Different albums in your results.',
  topAlbumByPlays: 'The album with the most plays in this range.',
  topAlbumByTime: 'The album you spent the most time listening to.',
  topAlbumShare: 'What share of all your plays went to your #1 album.',
  avgPlaysPerAlbum: 'Average number of plays per unique album.',
  uniqueEpisodes: 'Different podcast episodes in your results. The same episode from the same show counts once.',
  avgPlaysPerEpisode: 'Average number of plays per unique podcast episode.',
  topEpisodeShare: 'What share of all your podcast plays went to your #1 most-played episode.',
  mostRepeatedEpisode: 'The podcast episode you played the most times in this filtered range.',
  uniqueShows: 'Different podcast shows in your results.',
  avgPlaysPerShow: 'Average number of plays per unique podcast show.',
  topShowShare: 'What share of all your podcast plays went to your #1 show.',
  topShowByPlays: 'The podcast show with the most plays in this range.',
  topShowByTime: 'The podcast show you spent the most time listening to.',
  mostShowsInOneDay: 'The day you listened to the widest variety of podcast shows.',
  uniqueAudiobooks: 'Different audiobook titles in your results.',
  avgPlaysPerAudiobook: 'Average number of plays per unique audiobook title.',
  topAudiobookShare: 'What share of all your audiobook plays went to your #1 most-played title.',
  mostRepeatedAudiobook: 'The audiobook you played the most times in this filtered range.',
} as const;

export const PLAYS_VS_TIME_INFO = {
  plays:
    'Ranked by how many times you played something. A quick skip counts the same as a long listen.',
  time: 'Ranked by total listening time. Long sessions and repeats help a track rank higher.',
} as const;

export const DISCOVER_INFO = {
  mostSkipped:
    'Tracks you skipped the most in this date range. Skip rankings always include skipped plays, even when the hide-skips filter is on.',
  leastSkipped:
    'Tracks you rarely skip, with at least three plays in this range. Zero-skip favourites rank highest.',
  discoveryHistory:
    'The first time each track appeared in your filtered history, in chronological order.',
  discoveryDays:
    'Days when you heard the most new tracks for the first time within your current filters.',
  dayOfWeek:
    'Plays pooled by weekday across your filtered history, using your local time zone.',
} as const;

export const DATA_HANDLING_SECTIONS = [
  {
    title: 'Where your data goes',
    body: 'Files you select are read with standard browser file APIs. Parsing and analysis run entirely in this tab. Nothing is sent to a backend operated by this project.',
  },
  {
    title: 'How long data is kept',
    body: 'Parsed history lives in memory only while this page is open. Closing the tab, refreshing, or navigating away clears it. Loading new files replaces the previous dataset.',
  },
  {
    title: 'What we do not collect',
    body: 'This open-source project does not operate a database or user accounts for your listening history. Anonymous page-view analytics may be collected by the hosting provider (see below).',
  },
  {
    title: 'Hosting analytics',
    body: 'If Cloudflare Web Analytics is enabled for the deployed site, aggregate visit counts may be recorded without personal identifiers. Your Spotify JSON files are never part of that.',
  },
  {
    title: 'Your responsibility',
    body: 'Only load exports on devices you trust. Anyone with access to your screen can see the stats you generate.',
  },
] as const;

export const REQUEST_DATA_STEPS = [
  {
    title: 'Open Spotify account privacy settings',
    body: 'Go to spotify.com/account/privacy while logged in to your Spotify account.',
    image: 'account-privacy.png',
    imageAlt: 'Spotify Account privacy page',
  },
  {
    title: 'Select Extended streaming history',
    body: 'Scroll to Manage your data and check Extended streaming history, the package with track names, timestamps, and play duration. Spotify can take up to 30 days to prepare it.',
    image: 'extended-streaming-history.png',
    imageAlt: 'Extended streaming history option selected in the Spotify data request form',
    imageVariant: 'compact',
  },
  {
    title: 'Click Request data',
    body: 'With Extended streaming history selected, click Request data to submit the export.',
    image: 'request-data.png',
    imageAlt: 'Request data button on the Spotify account privacy page',
    imageVariant: 'inline',
  },
  {
    title: 'Confirm your request by email',
    body: 'Spotify sends a confirmation email. Open it and click CONFIRM (check spam if you do not see it). The link expires after 14 days.',
    image: 'email-confirm.png',
    imageAlt: 'Spotify email asking you to confirm your data download request',
  },
  {
    title: 'Wait for your export',
    body: 'After confirming, Spotify prepares your file. You will get another email when the ZIP is ready to download.',
    image: 'account-privacy-preparing.png',
    imageAlt: 'Spotify account privacy page showing your data export is being prepared',
  },
  {
    title: 'Download the ZIP',
    body: 'Open the link in Spotify’s ready-to-download email and save the archive. You can upload the ZIP file here directly — no need to extract it first.',
  },
  {
    title: 'Upload the ZIP',
    body: 'Drag your downloaded ZIP file onto this site or use the file picker. The Streaming_History_Audio_*.json files inside are extracted automatically — no manual extraction needed.',
  },
  {
    title: 'Individual JSON files (fallback)',
    body: 'If you only have individual JSON files (Streaming_History_Audio_*.json or older endTime exports), you can still drag them here or use the file picker. You can select multiple files if your export is split.',
  },
] as const;
