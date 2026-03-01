'use client';

import { useState, useReducer } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportConfirmation } from '@/components/forms/import-confirmation';
import { ImportHistory } from '@/components/dashboard/import-history';
import { FileUp } from 'lucide-react';
import type {
  Account,
  ImportLog,
  ParseResult,
  ConfirmedSnapshot,
} from '@/types';

interface ImportsClientProps {
  imports: ImportLog[];
  accounts: Account[];
}

export function ImportsClient({ imports: initialImports, accounts }: ImportsClientProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importHistory, setImportHistory] = useState(initialImports);
  const [, refresh] = useReducer((x: number) => x + 1, 0);

  async function reloadHistory() {
    const res = await fetch('/api/imports');
    if (res.ok) {
      const data: ImportLog[] = await res.json();
      setImportHistory(data);
    }
  }

  async function handleConfirm(snapshots: ConfirmedSnapshot[]) {
    if (!parseResult) return;
    const res = await fetch('/api/imports/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId: parseResult.importId, snapshots }),
    });
    if (res.ok) {
      setParseResult(null);
      await reloadHistory();
      refresh();
    }
  }

  function handleCancel() {
    setParseResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Upload placeholder — PdfUpload component from Agent 3 will go here */}
      {!parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-muted-foreground">
              <FileUp className="mb-3 h-10 w-10" />
              <p className="text-sm">PDF upload component will be connected here</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation area */}
      {parseResult && (
        <ImportConfirmation
          parsedData={parseResult}
          accounts={accounts}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Import history */}
      <ImportHistory imports={importHistory} onRetry={reloadHistory} />
    </div>
  );
}
