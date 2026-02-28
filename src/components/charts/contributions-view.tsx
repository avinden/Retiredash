'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contributions vs. Gains</CardTitle>
          <PeriodToggle value={period} onChange={setPeriod} />
        </CardHeader>
        <CardContent>
          <ContributionsChart data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
