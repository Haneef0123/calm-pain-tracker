import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ApiError, fromError } from '@/lib/api/errors';

function assertTestAuthEnabled(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  try {
    assertTestAuthEnabled(request);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new ApiError('SERVER_MISCONFIGURED', 'Supabase env not configured.', 500);
    }

    const body = (await request.json().catch(() => ({}))) as {
      accessToken?: string;
      refreshToken?: string;
    };

    if (!body.accessToken || !body.refreshToken) {
      throw new ApiError('INVALID_REQUEST', 'accessToken and refreshToken are required.', 400);
    }

    // IMPORTANT: Don't recreate the response after setting cookies, or you'd drop them.
    const response = NextResponse.json({ ok: true });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.setSession({
      access_token: body.accessToken,
      refresh_token: body.refreshToken,
    });

    if (error) {
      throw new ApiError('TEST_AUTH_SET_SESSION_FAILED', error.message, 401);
    }

    return response;
  } catch (error) {
    return fromError(error);
  }
}

export const runtime = 'nodejs';

