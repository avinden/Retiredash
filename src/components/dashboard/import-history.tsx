'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import type { ImportLog } from '@/types';

interface ImportHistoryProps {
  imports: ImportLog[];
  onRetry?: (importId: string) => void;
}

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive'
> = {
  success: 'default',
  partial: 'secondary',
  failed: 'destructive',
};

export function ImportHistory({ imports, onRetry }: ImportHistoryProps) {
  if (imports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No imports yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Filename</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Records</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2">{entry.filename}</td>
                  <td className="py-2">{formatDate(entry.importedAt)}</td>
                  <td className="py-2">
                    <Badge variant={STATUS_VARIANT[entry.status] ?? 'secondary'}>
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">{entry.recordsCreated}</td>
                  <td className="py-2 text-right">
                    {entry.status === 'failed' && onRetry && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onRetry(entry.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
