'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Account } from '@/types';

interface SnapshotFormProps {
  accounts: Account[];
  onCreated: () => void;
}

export function SnapshotForm({ accounts, onCreated }: SnapshotFormProps) {
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayString());
  const [balance, setBalance] = useState('');
  const [contributions, setContributions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          date,
          balance: Math.round(Number(balance) * 100),
          contributions: Math.round(Number(contributions) * 100),
        }),
      });
      if (!res.ok) throw new Error('Failed to save snapshot');
      setBalance('');
      setContributions('');
      onCreated();
    } catch {
      setError('Failed to save snapshot. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add an account first to record snapshots.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="snapshotAccount">Account</Label>
          <Select value={accountId} onValueChange={setAccountId} required>
            <SelectTrigger id="snapshotAccount">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="snapshotDate">Date</Label>
          <Input
            id="snapshotDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="snapshotBalance">Balance ($)</Label>
          <Input
            id="snapshotBalance"
            type="number"
            min="0"
            step="0.01"
            placeholder="50000.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="snapshotContributions">
            Contributions ($)
          </Label>
          <Input
            id="snapshotContributions"
            type="number"
            min="0"
            step="0.01"
            placeholder="5000.00"
            value={contributions}
            onChange={(e) => setContributions(e.target.value)}
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving || !accountId}>
        {saving ? 'Saving...' : 'Add Snapshot'}
      </Button>
    </form>
  );
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
