'use client';

import { useState, useMemo } from 'react';
import { ContributionsChart } from './contributions-chart';
import { ContributionsStats } from './contributions-stats';
import { PeriodToggle } from './period-toggle';
import { aggregateByPeriod } from '@/lib/calculations';
import type { Period } from '@/lib/calculations';
import type { Snapshot } from '@/types';

interface ContributionsViewProps {
  snapshots: Snapshot[];
}

export function ContributionsView({ snapshots }: ContributionsViewProps) {
  const [period, setPeriod] = useState<Period>('monthly');

  const data = useMemo(
    () => aggregateByPeriod(snapshots, period),
    [snapshots, period],
  );

  return (
    <div className="space-y-6">
      <ContributionsStats data={data} />
      <div className="animate-fade-up delay-3 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-foreground">
            Contributions vs. Gains
          </h3>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
        <ContributionsChart data={data} />
      </div>
    </div>
  );
}
