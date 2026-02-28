export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/layout/page-header';
import { NetWorthView } from '@/components/charts/net-worth-view';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { getAllSnapshots } from '@/lib/db/queries/snapshots';

export default async function NetWorthPage() {
  const snapshots = await getAllSnapshots(DEFAULT_USER_ID);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Net Worth"
        description="Track your net worth over time."
      />
      <NetWorthView snapshots={snapshots} />
    </div>
  );
}
