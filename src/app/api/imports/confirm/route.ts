import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { createSnapshot, findDuplicateSnapshot } from '@/lib/db/queries/snapshots';
import { createImportEntry, updateImportStatus } from '@/lib/db/queries/imports';
import type { ConfirmedSnapshot } from '@/types';

export async function POST(request: Request) {
  const body: unknown = await request.json();
  if (!isValidConfirmBody(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const importId = body.importId || nanoid();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  await createImportEntry({
    id: importId,
    userId: DEFAULT_USER_ID,
    source: 'pdf_import',
    filename: `import-${importId}`,
    importedAt: new Date().toISOString(),
    recordsCreated: 0,
    recordsUpdated: 0,
    status: 'partial',
  });

  for (const snap of body.snapshots) {
    try {
      const duplicate = await findDuplicateSnapshot(snap.accountId, snap.date);
      if (duplicate) {
        skipped++;
        continue;
      }
      await createSnapshot(DEFAULT_USER_ID, {
        accountId: snap.accountId,
        date: snap.date,
        balance: snap.balance,
        contributions: snap.contributions,
        source: 'pdf_import',
      });
      created++;
    } catch {
      errors++;
    }
  }

  const status = errors > 0 && created === 0 ? 'failed' : errors > 0 ? 'partial' : 'success';
  await updateImportStatus(importId, status, created);

  return NextResponse.json({ created, skipped, errors }, { status: 201 });
}

function isValidConfirmBody(
  body: unknown,
): body is { importId: string; snapshots: ConfirmedSnapshot[] } {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.importId !== 'string') return false;
  if (!Array.isArray(b.snapshots)) return false;
  return b.snapshots.every(isValidSnapshot);
}

function isValidSnapshot(snap: unknown): snap is ConfirmedSnapshot {
  if (typeof snap !== 'object' || snap === null) return false;
  const s = snap as Record<string, unknown>;
  return (
    typeof s.accountId === 'string' &&
    s.accountId.length > 0 &&
    typeof s.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
    typeof s.balance === 'number' &&
    Number.isInteger(s.balance) &&
    typeof s.contributions === 'number' &&
    Number.isInteger(s.contributions)
  );
}
