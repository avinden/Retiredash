/**
 * Retirement target = annual_spend / withdrawal_rate
 * All money values in cents.
 */
export function calculateRetirementTarget(
  annualSpendCents: number,
  withdrawalRate: number,
): number {
  if (withdrawalRate <= 0) return 0;
  return Math.round(annualSpendCents / withdrawalRate);
}

/**
 * Monthly contribution needed to reach target in N years.
 * Uses future value of annuity formula (assumes 0% real return for safety).
 * Returns cents per month.
 */
export function calculateMonthlyContributionNeeded(
  targetCents: number,
  currentSavingsCents: number,
  yearsRemaining: number,
): number {
  const gap = targetCents - currentSavingsCents;
  if (gap <= 0) return 0;
  if (yearsRemaining <= 0) return gap;
  const months = yearsRemaining * 12;
  return Math.round(gap / months);
}

/**
 * Years remaining until target retirement age.
 */
export function calculateYearsToTarget(
  currentAge: number,
  targetRetirementAge: number,
): number {
  const years = targetRetirementAge - currentAge;
  return Math.max(0, years);
}

/**
 * Gains = ending_balance - beginning_balance - contributions
 * All values in cents.
 */
export function calculateGains(
  endingBalanceCents: number,
  beginningBalanceCents: number,
  contributionsCents: number,
): number {
  return endingBalanceCents - beginningBalanceCents - contributionsCents;
}

/**
 * Gain ratio = gains / beginning_balance.
 * Returns a decimal (e.g., 0.10 for 10%).
 */
export function calculateGainRatio(
  gainsCents: number,
  beginningBalanceCents: number,
): number {
  if (beginningBalanceCents === 0) return 0;
  return gainsCents / beginningBalanceCents;
}

/**
 * Retirement progress as a fraction (0 to 1+).
 */
export function calculateProgress(
  currentSavingsCents: number,
  targetCents: number,
): number {
  if (targetCents <= 0) return 0;
  return currentSavingsCents / targetCents;
}
