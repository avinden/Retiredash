'use client';

import { useState, useMemo } from 'react';
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
      <div className="animate-fade-up delay-3 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-foreground">
            Net Worth Over Time
          </h3>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
        <NetWorthChart data={data} />
      </div>
    </div>
  );
}
