import { describe, it, expect } from 'vitest';
import { aggregateByPeriod } from './aggregation';
import type { Snapshot } from '@/types';

function makeSnapshot(
  overrides: Partial<Snapshot> & { accountId: string; date: string },
): Snapshot {
  return {
    id: `snap-${overrides.accountId}-${overrides.date}`,
    userId: 'default',
    balance: 0,
    contributions: 0,
    gains: 0,
    source: 'manual',
    ...overrides,
  };
}

describe('aggregateByPeriod', () => {
  const snapshots: Snapshot[] = [
    makeSnapshot({
      accountId: 'a1',
      date: '2024-01-15',
      balance: 100_000,
      contributions: 10_000,
      gains: 5_000,
    }),
    makeSnapshot({
      accountId: 'a1',
      date: '2024-01-31',
      balance: 110_000,
      contributions: 12_000,
      gains: 6_000,
    }),
    makeSnapshot({
      accountId: 'a2',
      date: '2024-01-20',
      balance: 200_000,
      contributions: 20_000,
      gains: 10_000,
    }),
    makeSnapshot({
      accountId: 'a1',
      date: '2024-02-15',
      balance: 120_000,
      contributions: 15_000,
      gains: 8_000,
    }),
  ];

  it('aggregates monthly — picks latest snapshot per account', () => {
    const result = aggregateByPeriod(snapshots, 'monthly');
    expect(result).toHaveLength(2);

    // Jan: a1 uses 01-31 (latest), a2 uses 01-20
    expect(result[0]).toEqual({
      period: '2024-01',
      totalBalance: 310_000,
      totalContributions: 32_000,
      totalGains: 16_000,
    });

    // Feb: only a1
    expect(result[1]).toEqual({
      period: '2024-02',
      totalBalance: 120_000,
      totalContributions: 15_000,
      totalGains: 8_000,
    });
  });

  it('aggregates quarterly', () => {
    const result = aggregateByPeriod(snapshots, 'quarterly');
    // All in Q1 2024
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2024-Q1');
    // Latest per account in Q1: a1=Feb(120K), a2=Jan(200K)
    expect(result[0].totalBalance).toBe(320_000);
  });

  it('aggregates yearly', () => {
    const result = aggregateByPeriod(snapshots, 'yearly');
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2024');
    // Latest per account in 2024: a1=Feb(120K), a2=Jan(200K)
    expect(result[0].totalBalance).toBe(320_000);
  });

  it('returns empty array for empty input', () => {
    expect(aggregateByPeriod([], 'monthly')).toEqual([]);
  });

  it('sorts periods chronologically', () => {
    const unordered: Snapshot[] = [
      makeSnapshot({
        accountId: 'a1',
        date: '2024-03-01',
        balance: 300_000,
      }),
      makeSnapshot({
        accountId: 'a1',
        date: '2024-01-01',
        balance: 100_000,
      }),
    ];
    const result = aggregateByPeriod(unordered, 'monthly');
    expect(result[0].period).toBe('2024-01');
    expect(result[1].period).toBe('2024-03');
  });

  it('handles single snapshot', () => {
    const single = [
      makeSnapshot({
        accountId: 'a1',
        date: '2024-06-15',
        balance: 500_000,
        contributions: 50_000,
        gains: 25_000,
      }),
    ];
    const result = aggregateByPeriod(single, 'monthly');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      period: '2024-06',
      totalBalance: 500_000,
      totalContributions: 50_000,
      totalGains: 25_000,
    });
  });
});
