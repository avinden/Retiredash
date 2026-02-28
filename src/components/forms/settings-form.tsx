'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { calculateRetirementTarget } from '@/lib/calculations';

interface SettingsData {
  annualSpendTarget: number;
  withdrawalRate: number;
  targetRetirementAge: number;
  currentAge: number;
}

export function SettingsForm() {
  const [annualSpend, setAnnualSpend] = useState('');
  const [withdrawalRate, setWithdrawalRate] = useState('4');
  const [targetAge, setTargetAge] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/settings');
      const data: SettingsData | null = await res.json();
      if (cancelled) return;
      if (data) {
        setAnnualSpend(String(data.annualSpendTarget / 100));
        setWithdrawalRate(String(data.withdrawalRate * 100));
        setTargetAge(String(data.targetRetirementAge));
        setCurrentAge(String(data.currentAge));
      }
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const spendCents = Math.round(Number(annualSpend) * 100);
  const rate = Number(withdrawalRate) / 100;
  const target = rate > 0 ? calculateRetirementTarget(spendCents, rate) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annualSpendTarget: spendCents,
          withdrawalRate: rate,
          targetRetirementAge: Number(targetAge),
          currentAge: Number(currentAge),
        }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Retirement Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="annualSpend">Annual Spending ($)</Label>
              <Input
                id="annualSpend"
                type="number"
                min="0"
                step="1000"
                placeholder="60000"
                value={annualSpend}
                onChange={(e) => setAnnualSpend(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawalRate">Withdrawal Rate (%)</Label>
              <Input
                id="withdrawalRate"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                placeholder="4"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentAge">Current Age</Label>
              <Input
                id="currentAge"
                type="number"
                min="1"
                max="120"
                placeholder="35"
                value={currentAge}
                onChange={(e) => setCurrentAge(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAge">Target Retirement Age</Label>
              <Input
                id="targetAge"
                type="number"
                min="1"
                max="120"
                placeholder="65"
                value={targetAge}
                onChange={(e) => setTargetAge(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {target > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              Retirement Target
            </p>
            <p className="text-3xl font-bold">{formatCurrency(target)}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Based on {formatCurrency(spendCents)}/yr at{' '}
              {withdrawalRate}% withdrawal rate
            </p>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </Button>
    </form>
  );
}
