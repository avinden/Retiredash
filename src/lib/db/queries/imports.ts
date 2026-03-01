import 'server-only';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { importLog } from '@/lib/db/schema';
import type { ImportLog, NewImportLog, ImportStatus } from '@/types';

export async function getImportHistory(): Promise<ImportLog[]> {
  return db
    .select()
    .from(importLog)
    .orderBy(desc(importLog.importedAt))
    .all();
}

export async function createImportEntry(
  data: NewImportLog,
): Promise<ImportLog | null> {
  db.insert(importLog).values(data).run();
  const rows = db
    .select()
    .from(importLog)
    .where(eq(importLog.id, data.id))
    .all();
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
  db.update(importLog).set(updates).where(eq(importLog.id, id)).run();
}
