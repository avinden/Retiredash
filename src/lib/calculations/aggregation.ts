import type { Snapshot } from '@/types';

export type Period = 'monthly' | 'quarterly' | 'yearly';

export interface PeriodSummary {
  period: string;
  totalBalance: number;
  totalContributions: number;
  totalGains: number;
}

/**
 * Aggregate snapshots by period (monthly, quarterly, yearly).
 * Groups by the latest snapshot per account per period,
 * then sums across accounts.
 */
export function aggregateByPeriod(
  snapshots: Snapshot[],
  period: Period,
): PeriodSummary[] {
  if (snapshots.length === 0) return [];

  const grouped = new Map<string, Map<string, Snapshot>>();

  for (const snap of snapshots) {
    const key = periodKey(snap.date, period);
    if (!grouped.has(key)) {
      grouped.set(key, new Map());
    }
    const accountMap = grouped.get(key)!;
    const existing = accountMap.get(snap.accountId);
    if (!existing || snap.date > existing.date) {
      accountMap.set(snap.accountId, snap);
    }
  }

  const result: PeriodSummary[] = [];
  const sortedKeys = [...grouped.keys()].sort();

  for (const key of sortedKeys) {
    const accountMap = grouped.get(key)!;
    let totalBalance = 0;
    let totalContributions = 0;
    let totalGains = 0;

    for (const snap of accountMap.values()) {
      totalBalance += snap.balance;
      totalContributions += snap.contributions;
      totalGains += snap.gains;
    }

    result.push({
      period: key,
      totalBalance,
      totalContributions,
      totalGains,
    });
  }

  return result;
}

function periodKey(dateStr: string, period: Period): string {
  const [year, month] = dateStr.split('-');
  switch (period) {
    case 'monthly':
      return `${year}-${month}`;
    case 'quarterly': {
      const q = Math.ceil(Number(month) / 3);
      return `${year}-Q${q}`;
    }
    case 'yearly':
      return year;
  }
}
