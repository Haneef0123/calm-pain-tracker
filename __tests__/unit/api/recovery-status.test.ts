import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser, mockChain } = vi.hoisted(() => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return { mockGetUser: vi.fn(), mockChain: chain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue(mockChain),
  }),
}));

import { GET } from '@/app/api/recovery/status/route';

// ---------------------------------------------------------------------------

describe('GET /api/recovery/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain.select.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
  });

  it('returns backedUp: false when there is no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET();
    expect(await res.json()).toEqual({ backedUp: false });
  });

  it('returns backedUp: true when a recovery_codes row exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } } });
    mockChain.maybeSingle.mockResolvedValue({ data: { user_id: 'uid-1' } });

    const res = await GET();
    expect(await res.json()).toEqual({ backedUp: true });
  });

  it('returns backedUp: false when no row is found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } } });
    mockChain.maybeSingle.mockResolvedValue({ data: null });

    const res = await GET();
    expect(await res.json()).toEqual({ backedUp: false });
  });

  it('returns backedUp: false and does not throw on an unexpected exception', async () => {
    mockGetUser.mockRejectedValue(new Error('network timeout'));

    const res = await GET();
    expect(await res.json()).toEqual({ backedUp: false });
  });
});
