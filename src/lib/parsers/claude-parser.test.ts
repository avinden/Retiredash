import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PdfExtraction } from '@/types';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor() {}
    },
  };
});

vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');

const VALID_SINGLE = JSON.stringify([
  {
    accountName: 'Fidelity 401(k)',
    accountId: null,
    date: '2025-12-31',
    balance: 15234567,
    contributions: 250000,
    confidence: 0.95,
  },
]);

const VALID_MULTI = JSON.stringify([
  {
    accountName: 'Vanguard IRA',
    accountId: null,
    date: '2025-12-31',
    balance: 5000000,
    contributions: 100000,
    confidence: 0.92,
  },
  {
    accountName: 'Fidelity 401(k)',
    accountId: null,
    date: '2025-12-31',
    balance: 15234567,
    contributions: 250000,
    confidence: 0.88,
  },
]);

function makeExtraction(overrides?: Partial<PdfExtraction>): PdfExtraction {
  return {
    filename: 'statement.pdf',
    text: 'Account balance: $152,345.67',
    pageCount: 2,
    fileSizeBytes: 50000,
    ...overrides,
  };
}

function mockResponse(text: string) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text }],
  });
}

describe('parseStatementText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ParseResult with snapshots for valid extraction', async () => {
    mockResponse(VALID_SINGLE);
    const { parseStatementText } = await import('./claude-parser');
    const result = await parseStatementText(makeExtraction(), []);

    expect(result.filename).toBe('statement.pdf');
    expect(result.importId).toBeTruthy();
    expect(result.parsedAt).toBeTruthy();
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0].accountName).toBe('Fidelity 401(k)');
    expect(result.snapshots[0].balance).toBe(15234567);
    expect(result.snapshots[0].contributions).toBe(250000);
    expect(result.snapshots[0].confidence).toBe(0.95);
  });

  it('returns multiple snapshots for multi-account statement', async () => {
    mockResponse(VALID_MULTI);
    const { parseStatementText } = await import('./claude-parser');
    const result = await parseStatementText(makeExtraction(), []);

    expect(result.snapshots).toHaveLength(2);
    expect(result.snapshots[0].accountName).toBe('Vanguard IRA');
    expect(result.snapshots[1].accountName).toBe('Fidelity 401(k)');
  });

  it('throws descriptive error on API failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Rate limit exceeded'));
    const { parseStatementText } = await import('./claude-parser');

    await expect(
      parseStatementText(makeExtraction(), []),
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('handles invalid JSON response gracefully', async () => {
    mockResponse('Here is the data you requested...');
    const { parseStatementText } = await import('./claude-parser');

    await expect(
      parseStatementText(makeExtraction(), []),
    ).rejects.toThrow('No JSON array found in response');
  });

  it('matches existing accounts by name similarity', async () => {
    mockResponse(VALID_MULTI);
    const { parseStatementText } = await import('./claude-parser');
    const existing = [
      { id: 'acct-1', name: 'Vanguard IRA' },
      { id: 'acct-2', name: 'Schwab Brokerage' },
    ];
    const result = await parseStatementText(makeExtraction(), existing);

    expect(result.snapshots[0].accountId).toBe('acct-1');
    expect(result.snapshots[1].accountId).toBeNull();
  });

  it('matches accounts with partial name overlap', async () => {
    const response = JSON.stringify([
      {
        accountName: 'Fidelity 401(k) Plan',
        accountId: null,
        date: '2025-12-31',
        balance: 100000,
        contributions: 0,
        confidence: 0.9,
      },
    ]);
    mockResponse(response);
    const { parseStatementText } = await import('./claude-parser');
    const existing = [{ id: 'acct-f', name: 'Fidelity 401(k)' }];
    const result = await parseStatementText(makeExtraction(), existing);

    expect(result.snapshots[0].accountId).toBe('acct-f');
  });

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    // Re-import to get fresh module
    vi.resetModules();
    vi.mock('@anthropic-ai/sdk', () => {
      return {
        default: class MockAnthropic {
          messages = { create: mockCreate };
          constructor() {}
        },
      };
    });
    const mod = await import('./claude-parser');

    await expect(
      mod.parseStatementText(makeExtraction(), []),
    ).rejects.toThrow('ANTHROPIC_API_KEY is not configured');
  });

  it('clamps confidence to 0-1 range', async () => {
    const response = JSON.stringify([
      {
        accountName: 'Test',
        accountId: null,
        date: '2025-01-01',
        balance: 100,
        contributions: 0,
        confidence: 1.5,
      },
    ]);
    mockResponse(response);
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');
    const { parseStatementText } = await import('./claude-parser');
    const result = await parseStatementText(makeExtraction(), []);

    expect(result.snapshots[0].confidence).toBe(1);
  });
});
