import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
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
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Gains</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(totalGains)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
