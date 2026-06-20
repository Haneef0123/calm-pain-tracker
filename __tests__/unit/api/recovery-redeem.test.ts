import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const {
  mockRateChain,
  mockSelectAttempts,
  mockInsertAttempts,
  mockSelectCodes,
  mockFrom,
  mockSignInWithPassword,
} = vi.hoisted(() => {
  const rateChain = { eq: vi.fn(), gte: vi.fn() };
  rateChain.eq.mockReturnValue(rateChain);

  const selectAttempts = vi.fn().mockReturnValue(rateChain);
  const insertAttempts = vi.fn().mockResolvedValue({});
  const selectCodes = vi.fn();

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'recovery_redeem_attempts') {
      return { select: selectAttempts, insert: insertAttempts };
    }
    return { select: selectCodes };
  });

  return {
    mockRateChain: rateChain,
    mockSelectAttempts: selectAttempts,
    mockInsertAttempts: insertAttempts,
    mockSelectCodes: selectCodes,
    mockFrom: from,
    mockSignInWithPassword: vi.fn(),
  };
});

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({ from: mockFrom }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { signInWithPassword: mockSignInWithPassword },
  }),
}));

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));

import { POST } from '@/app/api/recovery/redeem/route';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------

function makeRequest(body: unknown, ip = '203.0.113.1') {
  return new Request('http://localhost/api/recovery/redeem', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/recovery/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateChain.eq.mockReturnValue(mockRateChain);
    mockRateChain.gte.mockResolvedValue({ count: 0, error: null });
    mockSelectAttempts.mockReturnValue(mockRateChain);
    mockInsertAttempts.mockResolvedValue({});
    mockSelectCodes.mockResolvedValue({ data: [], error: null });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
  });

  // --- Rate limiting ---

  it('returns 429 when the IP has reached the attempt limit', async () => {
    mockRateChain.gte.mockResolvedValue({ count: 5, error: null });

    const res = await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('rate_limited');
    expect(body.retryAfterMinutes).toBe(15);
  });

  it('returns 500 when the rate-limit DB query itself errors', async () => {
    mockRateChain.gte.mockResolvedValue({ count: null, error: new Error('db fail') });

    const res = await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'server_error' });
  });

  // --- Input validation ---

  it('returns 400 when the request body contains no code', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'code_required' });
  });

  it('returns 400 when the request body is malformed JSON', async () => {
    const req = new Request('http://localhost/api/recovery/redeem', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json!!',
    }) as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_body' });
  });

  // --- Code matching ---

  it('returns 401 when no code in DB matches', async () => {
    mockSelectCodes.mockResolvedValue({
      data: [{ code_hash: '$2a$10$fakehash', synthetic_email: 'x@test.com' }],
      error: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: 'invalid_code' });
  });

  it('returns 200 with success: true when a code matches', async () => {
    mockSelectCodes.mockResolvedValue({
      data: [{ code_hash: '$2a$10$realhash', synthetic_email: 'uid@test.com' }],
      error: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it('signs in with the synthetic email found in the matching row', async () => {
    const syntheticEmail = 'uid-99@anon.test.com';
    mockSelectCodes.mockResolvedValue({
      data: [{ code_hash: '$2a$10$hash', synthetic_email: syntheticEmail }],
      error: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(mockSignInWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ email: syntheticEmail })
    );
  });

  it('returns 500 when sign-in fails after a code match', async () => {
    mockSelectCodes.mockResolvedValue({
      data: [{ code_hash: '$2a$10$hash', synthetic_email: 'uid@test.com' }],
      error: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    mockSignInWithPassword.mockResolvedValue({ error: new Error('sign in failed') });

    const res = await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'sign_in_failed' });
  });

  // --- Attempt logging ---

  it('logs a failed attempt to the DB', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(mockInsertAttempts).toHaveBeenCalledWith(
      expect.objectContaining({ succeeded: false })
    );
  });

  it('logs a successful attempt to the DB', async () => {
    mockSelectCodes.mockResolvedValue({
      data: [{ code_hash: '$2a$10$hash', synthetic_email: 'u@test.com' }],
      error: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(mockInsertAttempts).toHaveBeenCalledWith(
      expect.objectContaining({ succeeded: true })
    );
  });

  it('normalises a grouped code (strips dashes) before comparing', async () => {
    mockSelectCodes.mockResolvedValue({
      data: [{ code_hash: '$2a$10$hash', synthetic_email: 'u@test.com' }],
      error: null,
    });
    vi.mocked(bcrypt.compare).mockImplementation(async (plain) => plain === 'ABCDEFGHJKMN');

    const res = await POST(makeRequest({ code: 'ABCD-EFGH-JKMN' }));
    expect(res.status).toBe(200);
  });
});
