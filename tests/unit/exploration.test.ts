import { describe, it, expect } from 'vitest';
import {
  buildDayOfWeekDistribution,
  buildDiscoveryDays,
  buildDiscoveryHistory,
  buildSkipRankings,
  MIN_PLAYS_FOR_LEAST_SKIPPED,
} from '../../analysis/src/analysis/exploration';
import type { StreamRecord } from '../../analysis/src/types';

function record(
  overrides: Partial<StreamRecord> & Pick<StreamRecord, 'ts' | 'trackName'>,
): StreamRecord {
  return {
    artistName: 'Artist',
    albumName: 'Album',
    msPlayed: 120_000,
    skipped: false,
    incognito: false,
    reasonEnd: 'trackdone',
    contentKind: 'music',
    ...overrides,
  };
}

describe('buildDayOfWeekDistribution', () => {
  it('pools plays by local weekday', () => {
    const records = [
      record({ ts: new Date('2024-01-07T12:00:00'), trackName: 'Sunday Song' }),
      record({ ts: new Date('2024-01-08T12:00:00'), trackName: 'Monday Song' }),
      record({ ts: new Date('2024-01-08T18:00:00'), trackName: 'Monday Song 2' }),
    ];

    const points = buildDayOfWeekDistribution(records);
    expect(points).toHaveLength(7);
    expect(points.find((point) => point.label === 'Sunday')?.value).toBe(1);
    expect(points.find((point) => point.label === 'Monday')?.value).toBe(2);
  });
});

describe('buildSkipRankings', () => {
  it('ranks most skipped tracks by skip count', () => {
    const records = [
      record({ ts: new Date('2024-01-01T10:00:00'), trackName: 'A', skipped: true }),
      record({ ts: new Date('2024-01-01T11:00:00'), trackName: 'A', skipped: true }),
      record({ ts: new Date('2024-01-01T12:00:00'), trackName: 'B', skipped: true }),
      record({ ts: new Date('2024-01-01T13:00:00'), trackName: 'C', skipped: false }),
    ];

    const { mostSkipped, leastSkipped } = buildSkipRankings(records, 10);
    expect(mostSkipped[0].trackName).toBe('A');
    expect(mostSkipped[0].skipCount).toBe(2);
    expect(leastSkipped).toHaveLength(0);
  });

  it('ranks least skipped tracks with enough completed plays', () => {
    const records = [
      ...Array.from({ length: MIN_PLAYS_FOR_LEAST_SKIPPED }, (_, index) =>
        record({
          ts: new Date(`2024-01-0${index + 1}T10:00:00`),
          trackName: 'Reliable',
          skipped: false,
        }),
      ),
      record({ ts: new Date('2024-01-04T10:00:00'), trackName: 'Reliable', skipped: true }),
      record({ ts: new Date('2024-01-05T10:00:00'), trackName: 'Skipper', skipped: true }),
      record({ ts: new Date('2024-01-06T10:00:00'), trackName: 'Skipper', skipped: true }),
      record({ ts: new Date('2024-01-07T10:00:00'), trackName: 'Skipper', skipped: true }),
    ];

    const { leastSkipped } = buildSkipRankings(records, 10);
    expect(leastSkipped[0].trackName).toBe('Reliable');
    expect(leastSkipped[0].skipRate).toBeCloseTo(1 / (MIN_PLAYS_FOR_LEAST_SKIPPED + 1));
  });
});

describe('buildDiscoveryHistory', () => {
  it('returns first listens in chronological order', () => {
    const records = [
      record({ ts: new Date('2024-01-01T10:00:00'), trackName: 'First', artistName: 'A' }),
      record({ ts: new Date('2024-01-02T10:00:00'), trackName: 'Second', artistName: 'B' }),
      record({ ts: new Date('2024-01-03T10:00:00'), trackName: 'First', artistName: 'A' }),
    ];

    const discoveries = buildDiscoveryHistory(records);
    expect(discoveries).toHaveLength(2);
    expect(discoveries[0].trackName).toBe('First');
    expect(discoveries[1].trackName).toBe('Second');
  });
});

describe('buildDiscoveryDays', () => {
  it('ranks days by number of first-time listens', () => {
    const records = [
      record({ ts: new Date('2024-01-01T10:00:00'), trackName: 'A' }),
      record({ ts: new Date('2024-01-01T11:00:00'), trackName: 'B' }),
      record({ ts: new Date('2024-01-02T10:00:00'), trackName: 'C' }),
      record({ ts: new Date('2024-01-01T12:00:00'), trackName: 'A' }),
    ];

    const days = buildDiscoveryDays(records, 10);
    expect(days[0].day).toBe('2024-01-01');
    expect(days[0].discoveries).toBe(2);
    expect(days[0].topDiscovery).toBe('A');
    expect(days[1].discoveries).toBe(1);
  });
});
