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
import { AccountType } from '@/types';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investment',
  retirement: 'Retirement (401k/IRA)',
  debt: 'Debt',
};

interface AccountFormProps {
  onCreated: () => void;
}

export function AccountForm({ onCreated }: AccountFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [institution, setInstitution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, institution }),
      });
      if (!res.ok) throw new Error('Failed to create account');
      setName('');
      setType('');
      setInstitution('');
      onCreated();
    } catch {
      setError('Failed to add account. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="accountName">Account Name</Label>
          <Input
            id="accountName"
            placeholder="My 401k"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountType">Type</Label>
          <Select value={type} onValueChange={setType} required>
            <SelectTrigger id="accountType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            placeholder="Fidelity"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving || !type}>
        {saving ? 'Adding...' : 'Add Account'}
      </Button>
    </form>
  );
}
