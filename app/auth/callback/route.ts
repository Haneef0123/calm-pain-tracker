import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics/events';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await trackEvent(supabase, 'signup_completed', {}, user.id);
            }
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return to sign-in on error
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
}
