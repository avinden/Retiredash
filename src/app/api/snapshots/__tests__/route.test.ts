import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockGetAccountById = vi.fn();
const mockGetAllSnapshots = vi.fn();
const mockCreateSnapshot = vi.fn();

vi.mock('@/lib/db/queries/accounts', () => ({
  getAccountById: (...args: unknown[]) => mockGetAccountById(...args),
}));

vi.mock('@/lib/db/queries/snapshots', () => ({
  getAllSnapshots: (...args: unknown[]) => mockGetAllSnapshots(...args),
  createSnapshot: (...args: unknown[]) => mockCreateSnapshot(...args),
}));

import { GET, POST } from '../route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/snapshots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  accountId: 'acc-123',
  date: '2025-01-15',
  balance: 500000,
  contributions: 100000,
};

describe('GET /api/snapshots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all snapshots', async () => {
    mockGetAllSnapshots.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe('POST /api/snapshots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for negative balance', async () => {
    const res = await POST(makeRequest({ ...validBody, balance: -100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid request body');
  });

  it('returns 400 for negative contributions', async () => {
    const res = await POST(makeRequest({ ...validBody, contributions: -50 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid request body');
  });

  it('returns 404 for nonexistent accountId', async () => {
    mockGetAccountById.mockResolvedValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Account not found');
  });

  it('returns 409 for duplicate snapshot (same accountId + date)', async () => {
    mockGetAccountById.mockResolvedValue({ id: 'acc-123' });
    mockCreateSnapshot.mockRejectedValue(
      new Error('UNIQUE constraint failed: snapshots.account_id, snapshots.date'),
    );
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe('Snapshot already exists for this account and date');
  });

  it('returns 201 for valid snapshot', async () => {
    const created = { id: 'snap-1', ...validBody, gains: 0, source: 'manual', userId: 'default' };
    mockGetAccountById.mockResolvedValue({ id: 'acc-123' });
    mockCreateSnapshot.mockResolvedValue(created);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('snap-1');
  });
});
