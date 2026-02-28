export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/layout/page-header';
import { ContributionsView } from '@/components/charts/contributions-view';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { getAllSnapshots } from '@/lib/db/queries/snapshots';

export default async function ContributionsPage() {
  const snapshots = await getAllSnapshots(DEFAULT_USER_ID);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions vs. Performance"
        description="See how your savings and investment gains compare."
      />
      <ContributionsView snapshots={snapshots} />
    </div>
  );
}
