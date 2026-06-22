import { fakerEN as faker } from '@faker-js/faker';
import { cleanRecords } from '../analysis/processData';
import type { RawRecord, StreamRecord } from '../types';

interface DemoTrack {
  track: string;
  artist: string;
  album: string;
  weight: number;
  durationMs: number;
}

const SAMPLE_SEED = 42;
const ARTIST_COUNT = 50;
const TRACK_COUNT = 500;

const REASON_END_OPTIONS = [
  { weight: 72, value: 'trackdone' },
  { weight: 10, value: 'endplay' },
  { weight: 8, value: 'fwdbtn' },
  { weight: 5, value: 'backbtn' },
  { weight: 5, value: 'clickrow' },
] as const;

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function resolveSamplePeriod(): { startYear: number; endYear: number } {
  const startYear = faker.number.int({ min: 2019, max: 2021 });
  const endYear = Math.min(
    new Date().getUTCFullYear(),
    startYear + faker.number.int({ min: 4, max: 5 }),
  );

  return { startYear, endYear };
}

function buildCatalog(): DemoTrack[] {
  const artists = Array.from({ length: ARTIST_COUNT }, () => faker.company.name());

  return Array.from({ length: TRACK_COUNT }, () => ({
    track: faker.music.songName(),
    artist: faker.helpers.arrayElement(artists),
    album: titleCase(faker.word.words({ count: 2 })),
    weight: faker.number.int({ min: 1, max: 15 }),
    durationMs: faker.number.int({ min: 160_000, max: 260_000 }),
  }));
}

function weightedTrack(catalog: DemoTrack[]): DemoTrack {
  return faker.helpers.weightedArrayElement(
    catalog.map((entry) => ({ weight: entry.weight, value: entry })),
  );
}

function listeningHour(weekend: boolean): number {
  const eveningHours = weekend
    ? [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
    : [7, 8, 12, 13, 17, 18, 19, 20, 21, 22, 23];
  const weights = eveningHours.map((hour) => {
    if (hour >= 19 && hour <= 22) return 3.2;
    if (hour >= 17 && hour <= 23) return 2.1;
    if (hour >= 7 && hour <= 9) return weekend ? 1.8 : 1.2;
    return 1;
  });

  return faker.helpers.weightedArrayElement(
    eveningHours.map((hour, index) => ({ weight: weights[index], value: hour })),
  );
}

function dayActivityChance(startYear: number, year: number, month: number): number {
  const yearBoost = (year - startYear) * 0.04;
  const winterBoost = month === 11 || month === 0 || month === 1 ? 0.08 : 0;
  const summerDip = month >= 5 && month <= 7 ? -0.05 : 0;
  const jitter = (faker.number.float({ min: 0, max: 1 }) - 0.5) * 0.04;
  return Math.min(0.92, 0.48 + yearBoost + winterBoost + summerDip + jitter);
}

function pickReasonEnd(skipped: boolean): string {
  if (skipped) {
    return faker.helpers.arrayElement(['fwdbtn', 'backbtn', 'clickrow']);
  }

  return faker.helpers.weightedArrayElement(
    REASON_END_OPTIONS.map((option) => ({ weight: option.weight, value: option.value })),
  );
}

function buildSampleRawRecords(
  catalog: DemoTrack[],
  startYear: number,
  endYear: number,
): RawRecord[] {
  const records: RawRecord[] = [];
  const start = Date.UTC(startYear, 0, 1);
  const end = Date.UTC(endYear, 11, 31, 23, 59, 59);

  for (let dayMs = start; dayMs <= end; dayMs += 86_400_000) {
    const day = new Date(dayMs);
    const year = day.getUTCFullYear();
    const month = day.getUTCMonth();
    const weekday = day.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;

    if (faker.number.float({ min: 0, max: 1 }) > dayActivityChance(startYear, year, month)) {
      continue;
    }

    const sessionsToday = weekend
      ? faker.number.int({ min: 1, max: 3 })
      : faker.number.int({ min: 1, max: 2 });
    let cursorMs =
      dayMs +
      listeningHour(weekend) * 3_600_000 +
      faker.number.int({ min: 0, max: 3_599_999 });

    for (let session = 0; session < sessionsToday; session += 1) {
      const tracksInSession = faker.number.int({ min: 2, max: 8 });

      for (let play = 0; play < tracksInSession; play += 1) {
        if (cursorMs > end) {
          break;
        }

        const entry = weightedTrack(catalog);
        const skipped = faker.number.float({ min: 0, max: 1 }) < 0.1;
        const msPlayed = skipped
          ? faker.number.int({ min: 8_000, max: 29_999 })
          : Math.max(
              35_000,
              Math.floor(entry.durationMs * faker.number.float({ min: 0.72, max: 1.07 })),
            );

        records.push({
          ts: new Date(cursorMs).toISOString().replace('.000Z', 'Z'),
          ms_played: msPlayed,
          master_metadata_track_name: entry.track,
          master_metadata_album_artist_name: entry.artist,
          master_metadata_album_album_name: entry.album,
          reason_end: pickReasonEnd(skipped),
          skipped,
          incognito_mode: faker.number.float({ min: 0, max: 1 }) < 0.02,
        });

        cursorMs += msPlayed + 15_000 + faker.number.int({ min: 0, max: 239_999 });
      }

      cursorMs += 1_800_000 + faker.number.int({ min: 0, max: 7_199_999 });
    }
  }

  return records;
}

export function loadSampleRecords(): StreamRecord[] {
  faker.seed(SAMPLE_SEED);
  const { startYear, endYear } = resolveSamplePeriod();
  const catalog = buildCatalog();
  const cleaned = cleanRecords(buildSampleRawRecords(catalog, startYear, endYear));

  if (cleaned.length === 0) {
    throw new Error('Sample data could not be loaded.');
  }

  return cleaned;
}
