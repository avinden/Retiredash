'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountBreakdownChart } from '@/components/charts/account-breakdown-chart';
import type { Account, Snapshot } from '@/types';

interface AccountBreakdownProps {
  accounts: Account[];
  latestSnapshots: Snapshot[];
}

export function AccountBreakdown({
  accounts,
  latestSnapshots,
}: AccountBreakdownProps) {
  const data = useMemo(() => {
    const byType = new Map<string, number>();
    for (const snap of latestSnapshots) {
      const account = accounts.find((a) => a.id === snap.accountId);
      const type = account?.type ?? 'other';
      byType.set(type, (byType.get(type) ?? 0) + snap.balance);
    }
    return [...byType.entries()]
      .map(([type, balance]) => ({ type, balance }))
      .sort((a, b) => b.balance - a.balance);
  }, [accounts, latestSnapshots]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <AccountBreakdownChart data={data} />
      </CardContent>
    </Card>
  );
}
