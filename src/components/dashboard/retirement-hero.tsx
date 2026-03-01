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
      {/* Hero ring section */}
      <div className="animate-scale-in relative overflow-hidden rounded-2xl border border-border bg-card p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-muted via-transparent to-gold-muted" />

        <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12">
          <div className="relative flex-shrink-0">
            <ProgressRing percentage={progressPct} size={200} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Progress
              </span>
              <span className="font-display text-4xl text-foreground">
                {progressPct}%
              </span>
            </div>
          </div>

          <div className="text-center md:text-left">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Retirement Target
            </p>
            <p className="font-display mt-1 text-5xl tracking-tight text-foreground">
              {formatCurrency(target)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatCurrency(settings.annualSpendTarget)}/yr at{' '}
              <span className="text-gold">
                {(settings.withdrawalRate * 100).toFixed(1)}%
              </span>{' '}
              withdrawal rate
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current Savings"
          value={formatCurrency(currentSavings)}
          delay="delay-1"
        />
        <StatCard
          label="Gap to Target"
          value={
            progress >= 1
              ? 'Reached!'
              : formatCurrency(target - currentSavings)
          }
          sub={progress >= 1 ? undefined : 'remaining'}
          accent={progress >= 1}
          delay="delay-2"
        />
        <StatCard
          label="Years to Retirement"
          value={years > 0 ? String(years) : 'Now!'}
          sub={`Age ${settings.currentAge} \u2192 ${settings.targetRetirementAge}`}
          delay="delay-3"
        />
        <StatCard
          label="Monthly Needed"
          value={
            progress >= 1 ? 'On track!' : formatCurrency(monthlyNeeded)
          }
          sub={progress >= 1 ? undefined : 'to reach your goal'}
          accent={progress >= 1}
          delay="delay-4"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  delay: string;
}) {
  return (
    <div
      className={`animate-fade-up card-hover rounded-xl border border-border bg-card p-5 ${delay}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold ${accent ? 'text-emerald' : 'text-foreground'}`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function ProgressRing({
  percentage,
  size,
}: {
  percentage: number;
  size: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="ring-glow -rotate-90"
      style={
        {
          '--ring-circumference': circumference,
          '--ring-offset': offset,
        } as React.CSSProperties
      }
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-emerald)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        className="animate-draw-ring"
      />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="animate-fade-up rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
      <p className="font-display text-3xl text-foreground">
        Am I on track to retire?
      </p>
      <p className="mt-3 text-muted-foreground">
        Set your retirement goals in{' '}
        <span className="font-medium text-emerald">Settings</span> and
        add your accounts to find out.
      </p>
    </div>
  );
}
