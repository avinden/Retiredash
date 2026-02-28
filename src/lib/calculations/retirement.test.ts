import { describe, it, expect } from 'vitest';
import {
  calculateRetirementTarget,
  calculateMonthlyContributionNeeded,
  calculateYearsToTarget,
  calculateGains,
  calculateGainRatio,
  calculateProgress,
} from './retirement';

describe('calculateRetirementTarget', () => {
  it('calculates target from annual spend and withdrawal rate', () => {
    // $60,000/yr at 4% = $1,500,000
    expect(calculateRetirementTarget(6_000_000, 0.04)).toBe(150_000_000);
  });

  it('returns 0 when withdrawal rate is 0', () => {
    expect(calculateRetirementTarget(6_000_000, 0)).toBe(0);
  });

  it('returns 0 when withdrawal rate is negative', () => {
    expect(calculateRetirementTarget(6_000_000, -0.05)).toBe(0);
  });

  it('handles zero annual spend', () => {
    expect(calculateRetirementTarget(0, 0.04)).toBe(0);
  });

  it('rounds to nearest cent', () => {
    // $50,000/yr at 3% = $1,666,666.67
    expect(calculateRetirementTarget(5_000_000, 0.03)).toBe(166_666_667);
  });
});

describe('calculateMonthlyContributionNeeded', () => {
  it('calculates monthly contribution for gap', () => {
    // Need $1M, have $500K, 10 years = $500K / 120 months
    const result = calculateMonthlyContributionNeeded(
      100_000_000,
      50_000_000,
      10,
    );
    expect(result).toBe(Math.round(50_000_000 / 120));
  });

  it('returns 0 when already at target', () => {
    expect(
      calculateMonthlyContributionNeeded(100_000_000, 100_000_000, 10),
    ).toBe(0);
  });

  it('returns 0 when over target', () => {
    expect(
      calculateMonthlyContributionNeeded(100_000_000, 150_000_000, 10),
    ).toBe(0);
  });

  it('returns full gap when 0 years remaining', () => {
    expect(
      calculateMonthlyContributionNeeded(100_000_000, 50_000_000, 0),
    ).toBe(50_000_000);
  });

  it('returns full gap when negative years', () => {
    expect(
      calculateMonthlyContributionNeeded(100_000_000, 50_000_000, -5),
    ).toBe(50_000_000);
  });
});

describe('calculateYearsToTarget', () => {
  it('calculates years remaining', () => {
    expect(calculateYearsToTarget(35, 65)).toBe(30);
  });

  it('returns 0 when at retirement age', () => {
    expect(calculateYearsToTarget(65, 65)).toBe(0);
  });

  it('returns 0 when past retirement age', () => {
    expect(calculateYearsToTarget(70, 65)).toBe(0);
  });
});

describe('calculateGains', () => {
  it('calculates positive gains', () => {
    // Started at $100K, ended at $120K, contributed $10K = $10K gains
    expect(calculateGains(12_000_000, 10_000_000, 1_000_000)).toBe(1_000_000);
  });

  it('calculates negative gains (losses)', () => {
    // Started at $100K, ended at $95K, contributed $5K = -$10K loss
    expect(calculateGains(9_500_000, 10_000_000, 500_000)).toBe(-1_000_000);
  });

  it('handles zero beginning balance', () => {
    // New account: $0 -> $5K with $5K contribution = $0 gains
    expect(calculateGains(500_000, 0, 500_000)).toBe(0);
  });

  it('handles all zeros', () => {
    expect(calculateGains(0, 0, 0)).toBe(0);
  });
});

describe('calculateGainRatio', () => {
  it('calculates gain percentage', () => {
    // $10K gain on $100K = 10%
    expect(calculateGainRatio(1_000_000, 10_000_000)).toBeCloseTo(0.1);
  });

  it('handles negative gains', () => {
    expect(calculateGainRatio(-500_000, 10_000_000)).toBeCloseTo(-0.05);
  });

  it('returns 0 when beginning balance is 0', () => {
    expect(calculateGainRatio(1_000_000, 0)).toBe(0);
  });
});

describe('calculateProgress', () => {
  it('calculates progress fraction', () => {
    expect(calculateProgress(50_000_000, 100_000_000)).toBeCloseTo(0.5);
  });

  it('returns 0 when target is 0', () => {
    expect(calculateProgress(50_000_000, 0)).toBe(0);
  });

  it('can exceed 1.0 when over target', () => {
    expect(calculateProgress(150_000_000, 100_000_000)).toBeCloseTo(1.5);
  });

  it('returns 0 when savings is 0', () => {
    expect(calculateProgress(0, 100_000_000)).toBe(0);
  });
});
