import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted() runs before vi.mock() hoisting, so the refs are available inside factories
const { mockGetUser, mockUpdateUserById, mockSignInWithPassword, mockUpsert, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUpdateUserById: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockUpsert: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser, signInWithPassword: mockSignInWithPassword },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    auth: { admin: { updateUserById: mockUpdateUserById } },
    from: mockFrom,
  }),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('$2a$10$hashed') },
}));

vi.mock('@/lib/recovery/code', () => ({
  generateCode: vi.fn().mockReturnValue('ABCDEFGHJKMN'),
  formatGrouped: vi.fn().mockReturnValue('ABCD-EFGH-JKMN'),
}));

import { POST } from '@/app/api/recovery/create/route';

// ---------------------------------------------------------------------------

describe('POST /api/recovery/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RECOVERY_SYNTHETIC_EMAIL_DOMAIN = 'anon.test.com';

    mockUpdateUserById.mockResolvedValue({ error: null });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });
  });

  it('returns 401 when there is no authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: 'Not authenticated' });
  });

  it('returns 401 when getUser itself errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('auth error') });

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 500 when RECOVERY_SYNTHETIC_EMAIL_DOMAIN is not set', async () => {
    delete process.env.RECOVERY_SYNTHETIC_EMAIL_DOMAIN;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null });

    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'Server misconfigured' });
  });

  it('returns 500 when upgrading the Supabase user fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null });
    mockUpdateUserById.mockResolvedValue({ error: new Error('update failed') });

    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'Failed to create recovery code' });
  });

  it('returns 500 when the DB upsert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null });
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: new Error('db error') }),
    });

    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'Failed to store recovery code' });
  });

  it('returns 500 when refreshing the session after upgrade fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null });
    mockSignInWithPassword.mockResolvedValue({ error: new Error('sign in failed') });

    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'Failed to refresh session' });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('returns the formatted code on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null });

    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ code: 'ABCD-EFGH-JKMN' });
  });

  it('upserts with the correct user_id and synthetic email', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-42' } }, error: null });

    await POST();

    expect(mockFrom).toHaveBeenCalledWith('recovery_codes');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'uid-42',
        synthetic_email: 'uid-42@anon.test.com',
      }),
      { onConflict: 'user_id' }
    );
  });

  it('refreshes the current device session using the new synthetic credentials', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-42' } }, error: null });

    await POST();

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'uid-42@anon.test.com',
      password: 'ABCDEFGHJKMN',
    });
  });
});
