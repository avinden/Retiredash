'use client';

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { PeriodSummary } from '@/lib/calculations';

interface ContributionsChartProps {
  data: PeriodSummary[];
}

export function ContributionsChart({ data }: ContributionsChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No data yet. Add account snapshots to see contributions vs gains.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart
        data={data}
        margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <Tooltip
          formatter={(
            value: number | undefined,
            name: string | undefined,
          ) => [
            formatCurrency(value ?? 0),
            name === 'totalContributions' ? 'Contributions' : 'Gains',
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === 'totalContributions' ? 'Contributions' : 'Gains'
          }
        />
        <Bar
          dataKey="totalContributions"
          stackId="a"
          fill="var(--color-chart-2)"
        />
        <Bar
          dataKey="totalGains"
          stackId="a"
          fill="var(--color-chart-1)"
        />
        <Line
          type="monotone"
          dataKey="totalBalance"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={false}
          name="Net Total"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function formatCompact(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000)
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (Math.abs(dollars) >= 1_000)
    return `$${(dollars / 1_000).toFixed(0)}K`;
  return `$${dollars.toFixed(0)}`;
}
