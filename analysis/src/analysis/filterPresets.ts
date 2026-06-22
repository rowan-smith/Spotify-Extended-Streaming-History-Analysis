export const DEFAULT_TOP_N = 10;
export const WRAPPED_TOP_N = 100;
export const TOP_N_OPTIONS = [10, 20, 50, WRAPPED_TOP_N];

export const WRAPPED_CUTOFF_MONTH = 11;
export const WRAPPED_CUTOFF_DAY = 15;
export const WRAPPED_MIN_MS = 30_000;

export const MIN_DURATION_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '30 seconds', value: WRAPPED_MIN_MS },
  { label: '1 minute', value: 60_000 },
] as const;

export const PRESET_DEFAULT = {
  hideSkipped: true,
  minMsPlayed: WRAPPED_MIN_MS,
  minMsPlayedExclusive: false,
  excludeIncognito: false,
  includeMusic: true,
  includePodcasts: false,
  includeAudiobooks: false,
  monthFrom: null,
  monthTo: null,
  dayFrom: null,
  dayTo: null,
} as const;

export const PRESET_WRAPPED = {
  hideSkipped: true,
  minMsPlayed: WRAPPED_MIN_MS,
  minMsPlayedExclusive: true,
  excludeIncognito: true,
  includeMusic: true,
  includePodcasts: false,
  includeAudiobooks: false,
  combineRanking: false,
  topN: WRAPPED_TOP_N,
  monthFrom: 1,
  monthTo: WRAPPED_CUTOFF_MONTH,
  dayFrom: 1,
  dayTo: WRAPPED_CUTOFF_DAY,
} as const;
