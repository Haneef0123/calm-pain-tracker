import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

// Keep matcher tight to reduce middleware overhead.
// Only protect app routes that require authentication.
export const config = {
    matcher: ['/', '/history', '/patterns', '/settings', '/sign-in', '/auth/:path*'],
};
