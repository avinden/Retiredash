'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { PeriodSummary } from '@/lib/calculations';

interface NetWorthChartProps {
  data: PeriodSummary[];
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No data yet. Add account snapshots to see your net worth over time.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-emerald)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-emerald)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          tickFormatter={formatCompact}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number | undefined) => [
            formatCurrency(value ?? 0),
            'Net Worth',
          ]}
          labelFormatter={(label) => String(label)}
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
          }}
        />
        <Area
          type="monotone"
          dataKey="totalBalance"
          stroke="var(--color-emerald)"
          strokeWidth={2.5}
          fill="url(#netWorthGradient)"
          dot={{ r: 3, fill: 'var(--color-emerald)', strokeWidth: 0 }}
          activeDot={{
            r: 5,
            fill: 'var(--color-emerald)',
            strokeWidth: 2,
            stroke: 'var(--color-card)',
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function formatCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}K`;
  return `$${dollars.toFixed(0)}`;
}
