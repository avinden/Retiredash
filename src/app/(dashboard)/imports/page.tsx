export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/layout/page-header';
import { getImportHistory } from '@/lib/db/queries/imports';
import { getAccounts } from '@/lib/db/queries/accounts';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { ImportsClient } from './imports-client';

export default async function ImportsPage() {
  const [imports, accounts] = await Promise.all([
    getImportHistory(),
    getAccounts(DEFAULT_USER_ID),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Imports"
        description="Import financial data from PDF statements."
      />
      <ImportsClient imports={imports} accounts={accounts} />
    </div>
  );
}
