import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetText = vi.fn();
const mockDestroy = vi.fn().mockResolvedValue(undefined);

vi.mock('pdf-parse', () => {
  class MockPDFParse {
    getText = mockGetText;
    destroy = mockDestroy;
  }
  return { PDFParse: MockPDFParse };
});

import { extractPdfText } from './pdf';

describe('extractPdfText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDestroy.mockResolvedValue(undefined);
  });

  it('returns extraction result for valid PDF buffer', async () => {
    mockGetText.mockResolvedValue({
      text: 'Hello world',
      total: 2,
      pages: [],
    });

    const buffer = Buffer.from('fake-pdf-data');
    const result = await extractPdfText(buffer, 'test.pdf');

    expect(result).toEqual({
      filename: 'test.pdf',
      text: 'Hello world',
      pageCount: 2,
      fileSizeBytes: buffer.length,
    });
  });

  it('trims whitespace from extracted text', async () => {
    mockGetText.mockResolvedValue({
      text: '  spaced text  \n',
      total: 1,
      pages: [],
    });

    const result = await extractPdfText(
      Buffer.from('data'),
      'whitespace.pdf',
    );
    expect(result.text).toBe('spaced text');
  });

  it('throws for empty buffer', async () => {
    await expect(
      extractPdfText(Buffer.alloc(0), 'empty.pdf'),
    ).rejects.toThrow('PDF buffer is empty');
  });

  it('throws for oversized buffer', async () => {
    const big = Buffer.alloc(11 * 1024 * 1024);
    await expect(
      extractPdfText(big, 'big.pdf'),
    ).rejects.toThrow('exceeds maximum size');
  });

  it('throws for PDF with zero pages', async () => {
    mockGetText.mockResolvedValue({
      text: '',
      total: 0,
      pages: [],
    });

    await expect(
      extractPdfText(Buffer.from('data'), 'no-pages.pdf'),
    ).rejects.toThrow('no pages');
  });

  it('wraps parse errors with descriptive message', async () => {
    mockGetText.mockRejectedValue(new Error('Invalid XRef'));

    await expect(
      extractPdfText(Buffer.from('corrupt'), 'bad.pdf'),
    ).rejects.toThrow('Failed to parse PDF: Invalid XRef');
  });

  it('calls destroy after successful parse', async () => {
    mockGetText.mockResolvedValue({
      text: 'ok',
      total: 1,
      pages: [],
    });

    await extractPdfText(Buffer.from('data'), 'test.pdf');
    expect(mockDestroy).toHaveBeenCalled();
  });
});
