import { PDFParse } from 'pdf-parse';
import type { PdfExtraction } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function extractPdfText(
  buffer: Buffer,
  filename: string,
): Promise<PdfExtraction> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF buffer is empty');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File exceeds maximum size of 10MB (got ${(buffer.length / 1024 / 1024).toFixed(1)}MB)`,
    );
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();

    if (result.total === 0) {
      throw new Error('PDF contains no pages');
    }

    return {
      filename,
      text: result.text.trim(),
      pageCount: result.total,
      fileSizeBytes: buffer.length,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('PDF')) {
      throw err;
    }
    const message =
      err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to parse PDF: ${message}`);
  } finally {
    await parser.destroy().catch(() => {});
  }
}
