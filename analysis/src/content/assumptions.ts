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
    title: 'Wrapped mode',
    body: 'Wrapped mode applies Spotify’s published rules across the whole dashboard where your export supports them: music only, Jan 1 through mid-November of the selected year, more than 30 seconds per listen, skips and private sessions excluded, and rankings by play count on the Songs, Artists, and Albums tabs. Spotify also weights featured artists differently and filters some non-music tracks — those cannot be replicated exactly from the export alone.',
  },
  {
    title: 'Minimum play duration (filters)',
    body: 'The default filters ignore plays under 30 seconds. Wrapped mode requires more than 30 seconds, matching Spotify’s definition.',
  },
  {
    title: 'Timestamps and local time',
    body: 'Spotify exports ts in UTC. Date filters, calendar-day stats, and hour-of-day charts use your browser’s local timezone so they match what you see on screen.',
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
    title: 'Private sessions',
    body: 'When incognito_mode is true in your export, Wrapped mode excludes that play. Spotify Wrapped does not use private sessions for taste-based rankings.',
  },
  {
    title: 'Skipped track',
    body: 'skipped == true in the export. Wrapped mode excludes these from rankings.',
  },
  {
    title: 'Listening session',
    body: 'Consecutive plays with no gap longer than 30 minutes between them.',
  },
  {
    title: 'Month/day seasonality charts',
    body: 'All Januaries, all 1sts of the month, etc. are pooled across your filtered date range. They show seasonal patterns within that range, not a running cumulative total over time.',
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
