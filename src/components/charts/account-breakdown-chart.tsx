'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface BreakdownItem {
  type: string;
  balance: number;
}

interface AccountBreakdownChartProps {
  data: BreakdownItem[];
}

const TYPE_COLORS: Record<string, string> = {
  retirement: 'var(--color-chart-1)',
  investment: 'var(--color-chart-2)',
  savings: 'var(--color-chart-3)',
  checking: 'var(--color-chart-4)',
  debt: 'var(--color-chart-5)',
};

export function AccountBreakdownChart({ data }: AccountBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No accounts with balances yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <YAxis
          type="category"
          dataKey="type"
          tick={{ fontSize: 12 }}
          tickFormatter={capitalize}
        />
        <Tooltip
          formatter={(value: number | undefined) => [
            formatCurrency(value ?? 0),
            'Balance',
          ]}
          labelFormatter={(label) => capitalize(String(label))}
        />
        <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.type}
              fill={TYPE_COLORS[entry.type] ?? 'var(--color-primary)'}
            />
          ))}
        </Bar>
      </BarChart>
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
