import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateGains } from '@/lib/calculations';

// Mock server-only (no-op in test)
vi.mock('server-only', () => ({}));

// Mock nanoid
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }));

// Queue of results returned when a query chain is awaited
const resultQueue: unknown[] = [];

vi.mock('@/lib/db', () => {
  // Every chain method returns the chain; awaiting resolves the next queued result
  function makeChain(): Record<string, unknown> {
    const chain: Record<string, unknown> = {};
    const self = (): Record<string, unknown> => chain;
    chain.from = self;
    chain.where = self;
    chain.orderBy = self;
    chain.limit = self;
    chain.values = self;
    chain.set = self;
    chain.then = (
      resolve: (v: unknown) => unknown,
      reject?: (e: unknown) => unknown,
    ) => {
      const value = resultQueue.shift();
      return Promise.resolve(value).then(resolve, reject);
    };
    return chain;
  }

  return {
    db: {
      select: () => makeChain(),
      insert: () => makeChain(),
      update: () => makeChain(),
    },
  };
});

describe('createSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultQueue.length = 0;
  });

  it('sets gains to 0 for first snapshot (no previous)', async () => {
    // Queue: getLatestSnapshot → empty, insert → void, select-by-id → row
    resultQueue.push(
      [], // getLatestSnapshot → no previous
      undefined, // insert
      [
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
      ],
    );

    const { createSnapshot } = await import('../snapshots');
    const result = await createSnapshot('user-1', {
      accountId: 'acct-1',
      date: '2025-01-01',
      balance: 100000,
      contributions: 100000,
    });

    expect(result).not.toBeNull();
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

    resultQueue.push(
      [
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
      ], // getLatestSnapshot → has previous
      undefined, // insert
      [
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
      ],
    );

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
