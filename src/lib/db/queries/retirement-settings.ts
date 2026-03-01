import 'server-only';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { retirementSettings } from '@/lib/db/schema';
import type { RetirementSettings } from '@/types';

export async function getRetirementSettings(
  userId: string,
): Promise<RetirementSettings | null> {
  const rows = await db
    .select()
    .from(retirementSettings)
    .where(eq(retirementSettings.userId, userId));
  return rows[0] ?? null;
}

export async function upsertRetirementSettings(
  userId: string,
  data: {
    annualSpendTarget: number;
    withdrawalRate: number;
    targetRetirementAge: number;
    currentAge: number;
  },
): Promise<RetirementSettings | null> {
  const existing = await getRetirementSettings(userId);
  const now = new Date().toISOString();

  if (existing) {
    await db.update(retirementSettings)
      .set({ ...data, updatedAt: now })
      .where(eq(retirementSettings.id, existing.id));
  } else {
    await db.insert(retirementSettings)
      .values({
        id: nanoid(),
        userId,
        ...data,
        updatedAt: now,
      });
  }

  return getRetirementSettings(userId);
}
