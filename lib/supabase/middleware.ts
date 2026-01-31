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
    const isAuthRoute =
        request.nextUrl.pathname.startsWith('/sign-in') ||
        request.nextUrl.pathname.startsWith('/auth');

    // NOTE: Keep middleware edge-fast:
    // - no Supabase client creation
    // - no network calls (no getSession/getUser)
    // Middleware is only responsible for routing/redirects.

    // Allow auth routes to proceed so OAuth callbacks can complete.
    if (isAuthRoute) {
        return NextResponse.next({ request });
    }

    const { isValid } = getSessionFromCookies(request);

    // Not authenticated (or token is expiring soon) => send to sign-in.
    if (!isValid) {
        const url = request.nextUrl.clone();
        url.pathname = '/sign-in';
        return NextResponse.redirect(url);
    }

    // Already authenticated => keep users out of sign-in.
    if (request.nextUrl.pathname === '/sign-in') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
}
