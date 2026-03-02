import 'server-only';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { importLog } from '@/lib/db/schema';
import type { ImportLog, NewImportLog, ImportStatus } from '@/types';

export async function getImportHistory(): Promise<ImportLog[]> {
  return db
    .select()
    .from(importLog)
    .orderBy(desc(importLog.importedAt));
}

export async function createImportEntry(
  data: NewImportLog,
): Promise<ImportLog | null> {
  await db.insert(importLog).values(data);
  const rows = await db
    .select()
    .from(importLog)
    .where(eq(importLog.id, data.id));
  return rows[0] ?? null;
}

export async function updateImportStatus(
  id: string,
  status: ImportStatus,
  recordCount?: number,
): Promise<void> {
  const updates: Partial<ImportLog> = { status };
  if (recordCount !== undefined) {
    updates.recordsCreated = recordCount;
  }
  await db.update(importLog).set(updates).where(eq(importLog.id, id));
}
