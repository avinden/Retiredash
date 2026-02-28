export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/layout/page-header';
import { RetirementHero } from '@/components/dashboard/retirement-hero';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { getRetirementSettings } from '@/lib/db/queries/retirement-settings';
import { getLatestSnapshotPerAccount } from '@/lib/db/queries/snapshots';

export default async function DashboardPage() {
  const [settings, latestSnapshots] = await Promise.all([
    getRetirementSettings(DEFAULT_USER_ID),
    getLatestSnapshotPerAccount(DEFAULT_USER_ID),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your retirement readiness at a glance."
      />
      <RetirementHero
        settings={settings}
        latestSnapshots={latestSnapshots}
      />
    </div>
  );
}
