'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetWorthChart } from './net-worth-chart';
import { NetWorthStats } from './net-worth-stats';
import { PeriodToggle } from './period-toggle';
import { aggregateByPeriod } from '@/lib/calculations';
import type { Period } from '@/lib/calculations';
import type { Snapshot } from '@/types';

interface NetWorthViewProps {
  snapshots: Snapshot[];
}

export function NetWorthView({ snapshots }: NetWorthViewProps) {
  const [period, setPeriod] = useState<Period>('monthly');

  const data = useMemo(
    () => aggregateByPeriod(snapshots, period),
    [snapshots, period],
  );

  return (
    <div className="space-y-6">
      <NetWorthStats data={data} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Net Worth Over Time</CardTitle>
          <PeriodToggle value={period} onChange={setPeriod} />
        </CardHeader>
        <CardContent>
          <NetWorthChart data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
