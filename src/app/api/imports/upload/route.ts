import { NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/parsers/pdf';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invalid form data' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 },
    );
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json(
      { error: 'Only PDF files are accepted' },
      { status: 415 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File exceeds 10MB limit' },
      { status: 413 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: 'File is empty' },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extraction = await extractPdfText(buffer, file.name);
    return NextResponse.json(extraction);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to process PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
