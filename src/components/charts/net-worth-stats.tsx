import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
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
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Net Worth</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(latest.totalBalance)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Period Change</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {change >= 0 ? '+' : ''}
            {formatCurrency(change)}
          </p>
          <p className="text-sm text-muted-foreground">
            {changePct >= 0 ? '+' : ''}
            {changePct.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(totalContributions)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
