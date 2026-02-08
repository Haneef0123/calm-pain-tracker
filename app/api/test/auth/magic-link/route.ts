import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiError, fromError } from '@/lib/api/errors';
import { getPublicAppUrl } from '@/lib/env';

function assertTestAuthEnabled(request: NextRequest) {
  // Never allow this in production.
  if (process.env.NODE_ENV === 'production') {
    throw new ApiError('NOT_FOUND', 'Not found.', 404);
  }

  if (process.env.ENABLE_TEST_AUTH !== 'true') {
    throw new ApiError('NOT_FOUND', 'Not found.', 404);
  }

  const expected = process.env.TEST_AUTH_SECRET;
  const provided = request.headers.get('x-test-auth-secret');

  if (!expected || !provided || provided !== expected) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized.', 401);
  }
}

function isValidEmail(value: string): boolean {
  // Minimal validation; Supabase will do real validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function assertNextPath(value: string | undefined): string {
  if (!value) return '/';
  if (!value.startsWith('/')) {
    throw new ApiError('INVALID_REQUEST', 'next must start with "/".', 400);
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    assertTestAuthEnabled(request);

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      next?: string;
      ensureUser?: boolean;
    };

    const email = (body.email || '').trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      throw new ApiError('INVALID_REQUEST', 'A valid email is required.', 400);
    }

    const next = assertNextPath(body.next);
    const redirectTo = new URL('/auth/complete', getPublicAppUrl());
    redirectTo.searchParams.set('next', next);

    const admin = createAdminClient();

    // Prefer magiclink; optionally create user if missing (dev-only convenience).
    const generate = async () =>
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: redirectTo.toString() },
      });

    let result = await generate();

    if (result.error && body.ensureUser) {
      const createRes = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createRes.error) {
        throw new ApiError('TEST_AUTH_CREATE_USER_FAILED', createRes.error.message, 500);
      }

      result = await generate();
    }

    if (result.error || !result.data.properties?.action_link) {
      throw new ApiError(
        'TEST_AUTH_LINK_FAILED',
        result.error?.message || 'Unable to generate magic link.',
        500
      );
    }

    return NextResponse.json({
      actionLink: result.data.properties.action_link,
      redirectTo: redirectTo.toString(),
    });
  } catch (error) {
    return fromError(error);
  }
}

export const runtime = 'nodejs';

