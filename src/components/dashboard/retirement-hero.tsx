import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import {
  calculateRetirementTarget,
  calculateYearsToTarget,
  calculateMonthlyContributionNeeded,
  calculateProgress,
} from '@/lib/calculations';
import type { RetirementSettings, Snapshot } from '@/types';

interface RetirementHeroProps {
  settings: RetirementSettings | null;
  latestSnapshots: Snapshot[];
}

export function RetirementHero({
  settings,
  latestSnapshots,
}: RetirementHeroProps) {
  if (!settings) {
    return <EmptyState />;
  }

  const target = calculateRetirementTarget(
    settings.annualSpendTarget,
    settings.withdrawalRate,
  );
  const currentSavings = latestSnapshots.reduce(
    (sum, s) => sum + s.balance,
    0,
  );
  const years = calculateYearsToTarget(
    settings.currentAge,
    settings.targetRetirementAge,
  );
  const monthlyNeeded = calculateMonthlyContributionNeeded(
    target,
    currentSavings,
    years,
  );
  const progress = calculateProgress(currentSavings, target);
  const progressPct = Math.min(Math.round(progress * 100), 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Retirement Target
          </p>
          <p className="text-4xl font-bold">{formatCurrency(target)}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatCurrency(settings.annualSpendTarget)}/yr at{' '}
            {(settings.withdrawalRate * 100).toFixed(1)}% withdrawal
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Savings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(currentSavings)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{progressPct}%</p>
            <div className="bg-secondary mt-2 h-2 rounded-full">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Years to Retirement</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {years > 0 ? years : 'Now!'}
            </p>
            <p className="text-muted-foreground text-sm">
              Age {settings.currentAge} → {settings.targetRetirementAge}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Contribution Needed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {progress >= 1
                ? 'On track!'
                : formatCurrency(monthlyNeeded)}
            </p>
            {progress < 1 && (
              <p className="text-muted-foreground text-sm">
                to reach your goal
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-lg font-medium">Am I on track to retire?</p>
        <p className="text-muted-foreground mt-2">
          Set your retirement goals in Settings and add your accounts to
          find out.
        </p>
      </CardContent>
    </Card>
  );
}
