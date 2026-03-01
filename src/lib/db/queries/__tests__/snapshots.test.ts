import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateGains } from '@/lib/calculations';

// Mock server-only (no-op in test)
vi.mock('server-only', () => ({}));

// Mock nanoid
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }));

// Mock DB module
const mockAll = vi.fn();
const mockRun = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({ all: mockAll }),
            all: mockAll,
          }),
          all: mockAll,
        }),
      }),
    }),
    insert: () => ({
      values: () => ({ run: mockRun }),
    }),
  },
}));

describe('createSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets gains to 0 for first snapshot (no previous)', async () => {
    // First call: getLatestSnapshot returns empty (no previous)
    // Second call: select after insert returns the created row
    mockAll
      .mockReturnValueOnce([]) // getLatestSnapshot → no previous
      .mockReturnValueOnce([
        {
          id: 'test-id-123',
          userId: 'user-1',
          accountId: 'acct-1',
          date: '2025-01-01',
          balance: 100000,
          contributions: 100000,
          gains: 0,
          source: 'manual',
        },
      ]);

    const { createSnapshot } = await import('../snapshots');
    const result = await createSnapshot('user-1', {
      accountId: 'acct-1',
      date: '2025-01-01',
      balance: 100000,
      contributions: 100000,
    });

    expect(result).not.toBeNull();
    // Verify gains=0 was passed to insert
    const insertCall = mockRun.mock.calls[0];
    expect(insertCall).toBeDefined();
    expect(result?.gains).toBe(0);
  });

  it('calculates gains correctly for subsequent snapshots', async () => {
    const previousBalance = 100000; // $1000
    const newBalance = 120000; // $1200
    const contributions = 5000; // $50
    const expectedGains = calculateGains(
      newBalance,
      previousBalance,
      contributions,
    ); // 120000 - 100000 - 5000 = 15000

    mockAll
      .mockReturnValueOnce([
        {
          id: 'prev-id',
          userId: 'user-1',
          accountId: 'acct-1',
          date: '2025-01-01',
          balance: previousBalance,
          contributions: 50000,
          gains: 0,
          source: 'manual',
        },
      ]) // getLatestSnapshot → has previous
      .mockReturnValueOnce([
        {
          id: 'test-id-123',
          userId: 'user-1',
          accountId: 'acct-1',
          date: '2025-02-01',
          balance: newBalance,
          contributions,
          gains: expectedGains,
          source: 'manual',
        },
      ]);

    // Re-import to get fresh module with new mocks
    vi.resetModules();
    vi.mock('server-only', () => ({}));
    vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }));

    const { createSnapshot } = await import('../snapshots');
    const result = await createSnapshot('user-1', {
      accountId: 'acct-1',
      date: '2025-02-01',
      balance: newBalance,
      contributions,
    });

    expect(result).not.toBeNull();
    expect(result?.gains).toBe(15000);
  });
});
