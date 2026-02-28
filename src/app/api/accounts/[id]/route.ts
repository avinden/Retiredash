import { NextResponse } from 'next/server';
import { softDeleteAccount, getAccountById } from '@/lib/db/queries/accounts';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const account = await getAccountById(id);
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  await softDeleteAccount(id);
  return NextResponse.json({ success: true });
}
