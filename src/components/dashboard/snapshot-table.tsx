import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SnapshotForm } from '@/components/forms/snapshot-form';
import type { Account, Snapshot } from '@/types';

interface SnapshotSectionProps {
  accounts: Account[];
  snapshots: Snapshot[];
  onCreated: () => void;
}

export function SnapshotSection({
  accounts,
  snapshots,
  onCreated,
}: SnapshotSectionProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <SnapshotForm accounts={accounts} onCreated={onCreated} />
        </CardContent>
      </Card>

      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 text-right font-medium">Balance</th>
                    <th className="pb-2 text-right font-medium">
                      Contributions
                    </th>
                    <th className="pb-2 text-right font-medium">Gains</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.slice(0, 20).map((snap) => (
                    <tr key={snap.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(snap.date)}</td>
                      <td className="py-2">
                        {accounts.find((a) => a.id === snap.accountId)?.name ??
                          snap.accountId}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(snap.balance)}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(snap.contributions)}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(snap.gains)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
