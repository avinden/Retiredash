import { formatCurrency } from '@/lib/utils/format';
import type { PeriodSummary } from '@/lib/calculations';

interface ContributionsStatsProps {
  data: PeriodSummary[];
}

export function ContributionsStats({ data }: ContributionsStatsProps) {
  if (data.length === 0) return null;

  const totalContributions = data.reduce(
    (sum, d) => sum + d.totalContributions,
    0,
  );
  const totalGains = data.reduce((sum, d) => sum + d.totalGains, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="animate-fade-up card-hover rounded-xl border border-border bg-card p-5 delay-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Total Contributions
        </p>
        <p className="mt-2 text-2xl font-bold text-foreground">
          {formatCurrency(totalContributions)}
        </p>
      </div>
      <div className="animate-fade-up card-hover rounded-xl border border-border bg-card p-5 delay-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Total Gains
        </p>
        <p
          className={`mt-2 text-2xl font-bold ${totalGains >= 0 ? 'text-emerald' : 'text-destructive'}`}
        >
          {formatCurrency(totalGains)}
        </p>
      </div>
    </div>
  );
}
