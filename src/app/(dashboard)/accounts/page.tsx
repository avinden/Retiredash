'use client';

import { useState, useEffect, useReducer } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { AccountForm } from '@/components/forms/account-form';
import { SnapshotSection } from '@/components/dashboard/snapshot-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Account, Snapshot } from '@/types';

const TYPE_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  retirement: 'default',
  investment: 'secondary',
  savings: 'outline',
  checking: 'outline',
  debt: 'destructive',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [refreshKey, refresh] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [acctRes, snapRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/snapshots'),
      ]);
      if (cancelled) return;
      const acctData: Account[] = await acctRes.json();
      const snapData: Snapshot[] = await snapRes.json();
      if (cancelled) return;
      setAccounts(acctData);
      setSnapshots(snapData);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleDelete(id: string) {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your financial accounts."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Account</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm onCreated={refresh} />
        </CardContent>
      </Card>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No accounts yet. Add one above to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{account.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_VARIANTS[account.type] ?? 'outline'}>
                    {account.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {account.institution}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SnapshotSection
        accounts={accounts}
        snapshots={snapshots}
        onCreated={refresh}
      />
    </div>
  );
}
