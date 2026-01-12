'use client';

import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Auth actions only - auth state is handled server-side via middleware
interface AuthActionsContextType {
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const supabaseRef = useRef<SupabaseClient | null>(null);

    const getSupabase = useCallback(() => {
        if (!supabaseRef.current) {
            supabaseRef.current = createClient();
        }
        return supabaseRef.current;
    }, []);

    const signInWithGoogle = useCallback(async () => {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error('Sign in error:', error.message);
            throw error;
        }
    }, [getSupabase]);

    const signOut = useCallback(async () => {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error.message);
            throw error;
        }
    }, [getSupabase]);

    return (
        <AuthActionsContext.Provider value={{ signInWithGoogle, signOut }}>
            {children}
        </AuthActionsContext.Provider>
    );
}

export function useAuth(): AuthActionsContextType {
    const context = useContext(AuthActionsContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
