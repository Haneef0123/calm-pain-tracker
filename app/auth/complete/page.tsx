'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const supabase = createClient();

        // Creating the client + calling getSession() triggers URL detection
        // (implicit grant or PKCE) and persists the session to cookies.
        await supabase.auth.getSession();

        const next = params.get('next') || '/';
        router.replace(next.startsWith('/') ? next : '/');
      } catch (e) {
        if (cancelled) return;
        setMessage('Sign-in failed. Please try again.');
        // Fall back to sign-in.
        setTimeout(() => router.replace('/sign-in?error=auth_failed'), 600);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}

