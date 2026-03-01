'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/format';
import type { Account, ParseResult, ConfirmedSnapshot } from '@/types';

interface ImportConfirmationProps {
  parsedData: ParseResult;
  accounts: Account[];
  onConfirm: (snapshots: ConfirmedSnapshot[]) => void;
  onCancel: () => void;
}

interface EditableRow {
  accountId: string;
  date: string;
  balance: number;
  contributions: number;
  confidence: number;
  originalName: string;
}

function confidenceBadge(confidence: number) {
  if (confidence > 0.8) return <Badge variant="default">High</Badge>;
  if (confidence > 0.5) return <Badge variant="secondary">Medium</Badge>;
  return <Badge variant="destructive">Low</Badge>;
}

export function ImportConfirmation({
  parsedData,
  accounts,
  onConfirm,
  onCancel,
}: ImportConfirmationProps) {
  const [rows, setRows] = useState<EditableRow[]>(
    parsedData.snapshots.map((s) => ({
      accountId: s.accountId ?? '',
      date: s.date,
      balance: s.balance,
      contributions: s.contributions,
      confidence: s.confidence,
      originalName: s.accountName,
    })),
  );

  function updateRow(idx: number, field: keyof EditableRow, value: string | number) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  }

  function handleConfirm() {
    const valid = rows.filter((r) => r.accountId);
    onConfirm(
      valid.map((r) => ({
        accountId: r.accountId,
        date: r.date,
        balance: r.balance,
        contributions: r.contributions,
      })),
    );
  }

  const hasUnmapped = rows.some((r) => !r.accountId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Confirm Import: {parsedData.filename}</span>
          <Badge variant="outline">{rows.length} records</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Confidence</th>
                <th className="pb-2 font-medium">Parsed Name</th>
                <th className="pb-2 font-medium">Account</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 text-right font-medium">Balance</th>
                <th className="pb-2 text-right font-medium">Contributions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <ConfirmationRow
                  key={idx}
                  row={row}
                  accounts={accounts}
                  onUpdate={(field, value) => updateRow(idx, field, value)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {hasUnmapped && (
          <p className="mt-3 text-sm text-yellow-500">
            Some rows have no account mapped. They will be skipped.
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <Button onClick={handleConfirm}>
            Confirm {rows.filter((r) => r.accountId).length} Records
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface RowProps {
  row: EditableRow;
  accounts: Account[];
  onUpdate: (field: keyof EditableRow, value: string | number) => void;
}

function ConfirmationRow({ row, accounts, onUpdate }: RowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2">{confidenceBadge(row.confidence)}</td>
      <td className="py-2 text-muted-foreground">{row.originalName}</td>
      <td className="py-2">
        <Select
          value={row.accountId}
          onValueChange={(v) => onUpdate('accountId', v)}
        >
          <SelectTrigger className="w-[180px]">
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
      </td>
      <td className="py-2">
        <Input
          type="date"
          value={row.date}
          onChange={(e) => onUpdate('date', e.target.value)}
          className="w-[150px]"
        />
      </td>
      <td className="py-2 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-xs">
            {formatCurrency(row.balance)}
          </span>
          <Input
            type="number"
            value={row.balance / 100}
            onChange={(e) => onUpdate('balance', Math.round(Number(e.target.value) * 100))}
            className="w-[120px] text-right"
            step="0.01"
          />
        </div>
      </td>
      <td className="py-2 text-right">
        <Input
          type="number"
          value={row.contributions / 100}
          onChange={(e) => onUpdate('contributions', Math.round(Number(e.target.value) * 100))}
          className="w-[120px] text-right"
          step="0.01"
        />
      </td>
    </tr>
  );
}
