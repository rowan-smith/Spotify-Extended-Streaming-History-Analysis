export const ASSUMPTIONS_INTRO =
  'This analysis is built on explicit assumptions about Spotify Extended Streaming History data. Understanding them helps interpret the charts and stats.';

export interface Assumption {
  title: string;
  body: string;
}

export const ASSUMPTIONS: Assumption[] = [
  {
    title: 'One row = one streaming event',
    body: 'Each JSON record is counted as a single play/listen, regardless of how long you actually listened.',
  },
  {
    title: 'Content type filters',
    body: 'By default only music rows are included. Podcast and audiobook rows can be enabled in advanced filters.',
  },
  {
    title: 'Minimum play duration (filters)',
    body: 'The default preset ignores plays under 30 seconds. Wrapped-style presets use similar thresholds. Custom filters can change this.',
  },
  {
    title: 'Timestamps and local time',
    body: 'Spotify exports ts in UTC. Calendar day boundaries for habits use your browser local timezone. Hour-of-day charts also use local time.',
  },
  {
    title: 'Duplicate exports are deduplicated',
    body: 'If multiple JSON files overlap, rows with the same ts, track name, artist name, and ms_played are kept once.',
  },
  {
    title: 'Legacy JSON support',
    body: 'Older exports using endTime, trackName, and msPlayed field names are normalized to the extended format automatically.',
  },
  {
    title: '"Listen count" = row count',
    body: 'Grouped counts reflect streaming events, not unique songs or album plays.',
  },
  {
    title: '"Playtime" = sum of ms_played',
    body: 'Total listening time is the sum of milliseconds reported by Spotify for each event.',
  },
  {
    title: 'Track identity = (track name, artist name)',
    body: 'Same song title by different artists, or metadata changes over time, appear as separate entries.',
  },
  {
    title: '"Most listened" for a period',
    body: 'The track with the highest metric for that chart (play count or total playtime). Ties are broken by sort order.',
  },
  {
    title: 'Completed listen',
    body: "reason_end == 'trackdone' indicates the track finished playing, not necessarily that you listened intentionally start to finish.",
  },
  {
    title: 'Skipped track',
    body: 'skipped == true in the export.',
  },
  {
    title: 'Listening session',
    body: 'Consecutive plays with no gap longer than 30 minutes between them.',
  },
  {
    title: 'Month/day seasonality charts',
    body: 'All Januaries, all 1sts of the month, etc. are pooled across every year in your history. They show seasonal patterns, not a running cumulative total over time.',
  },
];

export const UPLOAD_DISCLAIMER =
  'By uploading your files, you agree they are processed locally in this browser tab and cleared when you leave.';

export const PRIVACY_POINTS = [
  'Your JSON files are read locally using standard browser file APIs.',
  'Parsed data lives only in memory for as long as this tab stays open.',
  'When you close the tab, navigate away, or refresh the page, that in-memory data is discarded.',
  'See the Data handling page for full details.',
];
