import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { getAllSnapshots, createSnapshot } from '@/lib/db/queries/snapshots';
import { getAccountById } from '@/lib/db/queries/accounts';

export async function GET() {
  const allSnapshots = await getAllSnapshots(DEFAULT_USER_ID);
  return NextResponse.json(allSnapshots);
}

export async function POST(request: Request) {
  const body: unknown = await request.json();
  if (!isValidSnapshotBody(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const account = await getAccountById(body.accountId);
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  try {
    const snapshot = await createSnapshot(DEFAULT_USER_ID, {
      accountId: body.accountId,
      date: body.date,
      balance: body.balance,
      contributions: body.contributions,
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json(
        { error: 'Snapshot already exists for this account and date' },
        { status: 409 },
      );
    }
    throw err;
  }
}

function isValidSnapshotBody(
  body: unknown,
): body is {
  accountId: string;
  date: string;
  balance: number;
  contributions: number;
} {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.accountId === 'string' &&
    b.accountId.length > 0 &&
    typeof b.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
    typeof b.balance === 'number' &&
    Number.isInteger(b.balance) &&
    b.balance >= 0 &&
    typeof b.contributions === 'number' &&
    Number.isInteger(b.contributions) &&
    b.contributions >= 0
  );
}

function isUniqueConstraintError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes('UNIQUE constraint failed');
  }
  return false;
}
