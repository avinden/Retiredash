import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { getAccounts } from '@/lib/db/queries/accounts';
import { parseStatementText } from '@/lib/parsers/claude-parser';
import type { PdfExtraction } from '@/types';

function isValidExtraction(body: unknown): body is PdfExtraction {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.filename === 'string' &&
    b.filename.trim().length > 0 &&
    typeof b.text === 'string' &&
    b.text.trim().length > 0 &&
    typeof b.pageCount === 'number' &&
    typeof b.fileSizeBytes === 'number'
  );
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!isValidExtraction(body)) {
    return NextResponse.json(
      { error: 'Missing required fields: filename, text, pageCount, fileSizeBytes' },
      { status: 400 },
    );
  }

  try {
    const accounts = await getAccounts(DEFAULT_USER_ID);
    const existingAccounts = accounts.map((a) => ({
      id: a.id,
      name: a.name,
    }));
    const result = await parseStatementText(body, existingAccounts);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown parsing error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
