import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function parseJwtPayload(token: string): { exp?: number; sub?: string } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function getSessionFromCookies(request: NextRequest): { isValid: boolean; userId?: string } {
    const cookies = request.cookies.getAll();
    
    const authCookies = cookies.filter(c => 
        c.name.startsWith('sb-') && c.name.includes('-auth-token')
    );
    
    if (authCookies.length === 0) {
        return { isValid: false };
    }

    try {
        let tokenData: { access_token?: string } | null = null;
        
        const mainCookie = authCookies.find(c => c.name.endsWith('-auth-token'));
        const chunkedCookies = authCookies
            .filter(c => c.name.match(/-auth-token\.\d+$/))
            .sort((a, b) => {
                const aNum = parseInt(a.name.match(/\.(\d+)$/)?.[1] || '0');
                const bNum = parseInt(b.name.match(/\.(\d+)$/)?.[1] || '0');
                return aNum - bNum;
            });

        let cookieValue = '';
        
        if (chunkedCookies.length > 0) {
            cookieValue = chunkedCookies.map(c => c.value).join('');
        } else if (mainCookie) {
            cookieValue = mainCookie.value;
        } else {
            return { isValid: false };
        }

        if (cookieValue.startsWith('base64-')) {
            const base64Value = cookieValue.replace('base64-', '');
            const decoded = atob(base64Value);
            tokenData = JSON.parse(decoded);
        } else {
            tokenData = JSON.parse(cookieValue);
        }

        if (!tokenData?.access_token) {
            return { isValid: false };
        }

        const payload = parseJwtPayload(tokenData.access_token);
        if (!payload?.exp) {
            return { isValid: false };
        }

        const now = Math.floor(Date.now() / 1000);
        const bufferSeconds = 60;
        const isExpired = payload.exp < (now + bufferSeconds);

        if (isExpired) {
            return { isValid: false };
        }

        return { isValid: true, userId: payload.sub };
    } catch {
        return { isValid: false };
    }
}

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase environment variables not configured');
        return NextResponse.next({ request });
    }

    const pathname = request.nextUrl.pathname;
    const isApiRoute = pathname.startsWith('/api/');
    const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/auth');
    const isPublicRoute =
        isApiRoute ||
        isAuthRoute ||
        pathname.startsWith('/pricing') ||
        pathname.startsWith('/share/') ||
        pathname === '/share' ||
        pathname.startsWith('/api/webhooks/razorpay') ||
        pathname.startsWith('/api/reports/share/');

    let supabaseResponse = NextResponse.next({ request });

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
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { isValid } = getSessionFromCookies(request);

    if (!isValid) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && !isPublicRoute) {
            const url = request.nextUrl.clone();
            url.pathname = '/sign-in';
            return NextResponse.redirect(url);
        }

        if (session && pathname === '/sign-in') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    } else {
        if (pathname === '/sign-in') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
