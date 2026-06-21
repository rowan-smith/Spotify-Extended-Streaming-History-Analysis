export const REPO_URL =
  'https://github.com/rowan-smith/Spotify-Extended-Streaming-History-Analysis';

export const ISSUES_URL = `${REPO_URL}/issues`;

export const CONTRIBUTING_URL = `${REPO_URL}#contributing`;

export const SPOTIFY_PRIVACY_URL = 'https://www.spotify.com/account/privacy/';
export const SPOTIFY_PRIVACY_LABEL = 'spotify.com/account/privacy';

export const FILTER_PRESET_INFO = {
  default:
    'A good starting point: music only, at least 30 seconds per track, and skips left out.',
  wrapped:
    'Matches Spotify Wrapped as closely as your export allows: music only, Jan 1–Nov 15 of the latest Wrapped year, more than 30 seconds per listen, skips and private sessions excluded, top 100 by play count.',
  custom: 'You set the filters yourself. Changing anything here switches to Custom.',
} as const;

export const WRAPPED_LIMITATIONS =
  'Approximation only. Spotify may also weight featured artists, filter ambient tracks, and honor Taste Profile settings — none of which appear in your export.';

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
  historySpan: 'From your earliest to your latest play in this date range.',
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
} as const;

export const PLAYS_VS_TIME_INFO = {
  plays:
    'Ranked by how many times you played something. A quick skip counts the same as a long listen.',
  time: 'Ranked by total listening time. Long sessions and repeats help a track rank higher.',
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
    body: 'Open the link in Spotify’s ready-to-download email and save the archive. Extract it on your computer.',
  },
  {
    title: 'Find the JSON files',
    body: 'Look for Streaming_History_Audio_*.json (extended format) or older endTime JSON files. You can select multiple files if your export is split.',
  },
  {
    title: 'Load them here',
    body: 'Drag the JSON files onto this site or use the file picker on the home page. Processing stays in your browser.',
  },
] as const;
