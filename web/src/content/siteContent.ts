export const REPO_URL =
  'https://github.com/rowan-smith/Spotify-Extended-Streaming-History-Analysis';

export const ISSUES_URL = `${REPO_URL}/issues`;

export const CONTRIBUTING_URL = `${REPO_URL}#contributing`;

export const FILTER_PRESET_INFO = {
  default: 'Sensible defaults: music only, listens of at least 30 seconds, skipped plays excluded.',
  wrapped:
    'Approximates Spotify Wrapped: music only, at least 30 seconds listened, skips excluded, completed listens preferred.',
  custom: 'You control every filter. Changes here switch the preset to Custom.',
} as const;

export const FILTER_OPTION_INFO = {
  hideSkipped:
    'Removes rows where Spotify marked the play as skipped. Useful when you only want intentional listens.',
  minDuration:
    'Ignores very short plays below this threshold. Spotify Wrapped roughly uses 30 seconds.',
  includeMusic:
    'Standard track rows from your audio streaming history export.',
  includePodcasts:
    'Includes podcast episode rows from your export (when present).',
  includeAudiobooks:
    'Includes audiobook rows from your export (when present).',
  combineRanking:
    'Ranks items using both play count and total playtime together instead of picking one metric.',
  monthFrom:
    'Start of your date window. Combined with the year filters to narrow results (e.g. Oct–Dec 2025).',
  monthTo:
    'End of your date window. Combined with the year filters to narrow results.',
} as const;

export const METRIC_INFO = {
  totalPlays:
    'Count of streaming events after your filters. Each JSON row is one play, regardless of duration.',
  totalListening:
    'Sum of ms_played for filtered rows — total time Spotify recorded you listening.',
  uniqueSongs: 'Distinct (track, artist) pairs in the filtered data.',
  uniqueArtists: 'Distinct artist names in the filtered data.',
  historySpan: 'Earliest to latest play in the filtered range.',
  peakHour:
    'Hour of day with the most plays, shown in your browser’s local timezone.',
  completedListens:
    "Plays where reason_end is 'trackdone' — the track reached the end according to Spotify.",
  skippedPlays: 'Plays where skipped is true in the export.',
  avgCompletedPerDay:
    'Average completed listens per calendar day that has at least one play in the filtered range.',
  avgSkippedPerDay:
    'Average skipped plays per calendar day that has at least one play in the filtered range.',
  avgPlaysPerDay:
    'Total filtered plays divided by the number of distinct calendar days with activity.',
  skipToCompleteRatio:
    'Skipped plays divided by completed listens. Higher values mean more skips relative to full listens. A ratio of 0.5 means one skip for every two completed listens.',
  avgSessionLength:
    'Average listening session length. A new session starts after 30 minutes with no plays.',
  earliestListen: 'First play in the filtered dataset.',
  latestListen: 'Most recent play in the filtered dataset.',
  paceVsLastYear:
    'Compares your current calendar year pace to the same point last year. Shows daily average needed to match last year’s total.',
  beatRecord:
    'How many plays per day you need for the rest of this year to beat your best yearly play count.',
} as const;

export const PLAYS_VS_TIME_INFO = {
  plays:
    'Play count ranks by how often you started a track. Skips and short listens count the same as long sessions.',
  time: 'Playtime ranks by total ms_played — long listens and repeat sessions boost a track’s score.',
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
  },
  {
    title: 'Request your data',
    body: 'Choose "Download your data" or "Privacy settings", then request Extended streaming history (and optionally other packages). Spotify emails you when the export is ready — this can take several days.',
  },
  {
    title: 'Download the ZIP',
    body: 'Open the link in Spotify’s email and download the archive. Extract it on your computer.',
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

export const SHORT_UPLOAD_DISCLAIMER =
  'Files are processed locally in your browser and cleared when you leave this page.';
