import { formatCurrency } from '@/lib/utils/format';
import type { PeriodSummary } from '@/lib/calculations';

interface NetWorthStatsProps {
  data: PeriodSummary[];
}

export function NetWorthStats({ data }: NetWorthStatsProps) {
  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;
  const change = previous
    ? latest.totalBalance - previous.totalBalance
    : 0;
  const changePct =
    previous && previous.totalBalance > 0
      ? (change / previous.totalBalance) * 100
      : 0;
  const totalContributions = data.reduce(
    (sum, d) => sum + d.totalContributions,
    0,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="animate-fade-up card-hover rounded-xl border border-border bg-card p-5 delay-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Total Net Worth
        </p>
        <p className="mt-2 text-2xl font-bold text-foreground">
          {formatCurrency(latest.totalBalance)}
        </p>
      </div>
      <div className="animate-fade-up card-hover rounded-xl border border-border bg-card p-5 delay-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Period Change
        </p>
        <p
          className={`mt-2 text-2xl font-bold ${change >= 0 ? 'text-emerald' : 'text-destructive'}`}
        >
          {change >= 0 ? '+' : ''}
          {formatCurrency(change)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {changePct >= 0 ? '+' : ''}
          {changePct.toFixed(1)}%
        </p>
      </div>
      <div className="animate-fade-up card-hover rounded-xl border border-border bg-card p-5 delay-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Total Contributions
        </p>
        <p className="mt-2 text-2xl font-bold text-foreground">
          {formatCurrency(totalContributions)}
        </p>
      </div>
    </div>
  );
}
