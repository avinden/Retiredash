import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { getAccounts, createAccount } from '@/lib/db/queries/accounts';
import { AccountType } from '@/types';

const VALID_TYPES = Object.values(AccountType);

export async function GET() {
  const accounts = await getAccounts(DEFAULT_USER_ID);
  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const body: unknown = await request.json();
  if (!isValidAccountBody(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const account = await createAccount(DEFAULT_USER_ID, {
    name: body.name,
    type: body.type,
    institution: body.institution,
  });

  return NextResponse.json(account, { status: 201 });
}

function isValidAccountBody(
  body: unknown,
): body is { name: string; type: string; institution: string } {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === 'string' &&
    b.name.trim().length > 0 &&
    typeof b.type === 'string' &&
    VALID_TYPES.includes(b.type as AccountType) &&
    typeof b.institution === 'string' &&
    b.institution.trim().length > 0
  );
}
