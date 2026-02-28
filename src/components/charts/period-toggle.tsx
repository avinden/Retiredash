'use client';

import { Button } from '@/components/ui/button';
import type { Period } from '@/lib/calculations';

const PERIOD_LABELS: Record<Period, string> = {
  monthly: 'MoM',
  quarterly: 'QoQ',
  yearly: 'YoY',
};

interface PeriodToggleProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="flex gap-1">
      {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(
        ([period, label]) => (
          <Button
            key={period}
            variant={value === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(period)}
          >
            {label}
          </Button>
        ),
      )}
    </div>
  );
}
