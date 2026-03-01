import 'server-only';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import type { Account } from '@/types';

export async function getAccounts(userId: string): Promise<Account[]> {
  return db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.isActive, true)),
    );
}

export async function getAccountById(id: string): Promise<Account | null> {
  const rows = await db.select().from(accounts).where(eq(accounts.id, id));
  return rows[0] ?? null;
}

export async function createAccount(
  userId: string,
  data: { name: string; type: string; institution: string },
): Promise<Account | null> {
  const id = nanoid();
  await db.insert(accounts)
    .values({
      id,
      userId,
      name: data.name,
      type: data.type as 'checking' | 'savings' | 'investment' | 'retirement' | 'debt',
      institution: data.institution,
      createdAt: new Date().toISOString(),
    });
  return getAccountById(id);
}

export async function softDeleteAccount(id: string): Promise<void> {
  await db.update(accounts)
    .set({ isActive: false })
    .where(eq(accounts.id, id));
}
