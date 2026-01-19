import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If Supabase isn't configured, allow all requests through
    // This prevents crashes when env vars are missing
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase environment variables not configured');
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );
                        supabaseResponse = NextResponse.next({
                            request,
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Allow sign-in page and auth callback without auth
        const isAuthRoute =
            request.nextUrl.pathname.startsWith('/sign-in') ||
            request.nextUrl.pathname.startsWith('/auth');

        if (!user && !isAuthRoute) {
            const url = request.nextUrl.clone();
            url.pathname = '/sign-in';
            return NextResponse.redirect(url);
        }

        // Redirect authenticated users away from sign-in
        if (user && request.nextUrl.pathname === '/sign-in') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        return supabaseResponse;
    } catch (error) {
        // Supabase is down or unreachable
        console.error('Supabase connection error:', error);

        // If trying to access maintenance page, allow it
        if (request.nextUrl.pathname === '/maintenance') {
            return NextResponse.next({ request });
        }

        // Redirect to maintenance page
        const url = request.nextUrl.clone();
        url.pathname = '/maintenance';
        return NextResponse.redirect(url);
    }
}
