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
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          tickFormatter={formatCompact}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="type"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          tickFormatter={capitalize}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number | undefined) => [
            formatCurrency(value ?? 0),
            'Balance',
          ]}
          labelFormatter={(label) => capitalize(String(label))}
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
          }}
        />
        <Bar dataKey="balance" radius={[0, 6, 6, 0]} opacity={0.9}>
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
