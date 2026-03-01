import 'server-only';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { snapshots } from '@/lib/db/schema';
import { calculateGains } from '@/lib/calculations';
import type { Snapshot, SnapshotSource } from '@/types';

export async function getSnapshotsByAccount(
  accountId: string,
): Promise<Snapshot[]> {
  return db
    .select()
    .from(snapshots)
    .where(eq(snapshots.accountId, accountId))
    .orderBy(desc(snapshots.date))
    .all();
}

export async function getAllSnapshots(userId: string): Promise<Snapshot[]> {
  return db
    .select()
    .from(snapshots)
    .where(eq(snapshots.userId, userId))
    .orderBy(desc(snapshots.date))
    .all();
}

export async function getLatestSnapshot(
  accountId: string,
): Promise<Snapshot | null> {
  const rows = db
    .select()
    .from(snapshots)
    .where(eq(snapshots.accountId, accountId))
    .orderBy(desc(snapshots.date))
    .limit(1)
    .all();
  return rows[0] ?? null;
}

export async function getLatestSnapshotPerAccount(
  userId: string,
): Promise<Snapshot[]> {
  const allSnaps = await getAllSnapshots(userId);
  const latest = new Map<string, (typeof allSnaps)[0]>();
  for (const snap of allSnaps) {
    if (!latest.has(snap.accountId) || snap.date > latest.get(snap.accountId)!.date) {
      latest.set(snap.accountId, snap);
    }
  }
  return [...latest.values()];
}

export async function findDuplicateSnapshot(
  accountId: string,
  date: string,
): Promise<Snapshot | null> {
  const rows = db
    .select()
    .from(snapshots)
    .where(and(eq(snapshots.accountId, accountId), eq(snapshots.date, date)))
    .all();
  return rows[0] ?? null;
}

export async function createSnapshot(
  userId: string,
  data: {
    accountId: string;
    date: string;
    balance: number;
    contributions: number;
    source?: SnapshotSource;
  },
): Promise<Snapshot | null> {
  const previous = await getLatestSnapshot(data.accountId);
  const gains = previous
    ? calculateGains(data.balance, previous.balance, data.contributions)
    : 0;

  const id = nanoid();
  db.insert(snapshots)
    .values({
      id,
      userId,
      accountId: data.accountId,
      date: data.date,
      balance: data.balance,
      contributions: data.contributions,
      gains,
      source: data.source ?? 'manual',
    })
    .run();

  const rows = db.select().from(snapshots).where(eq(snapshots.id, id)).all();
  return rows[0] ?? null;
}
