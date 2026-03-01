import { NextResponse } from 'next/server';
import { getImportHistory } from '@/lib/db/queries/imports';

export async function GET() {
  const imports = await getImportHistory();
  return NextResponse.json(imports);
}
