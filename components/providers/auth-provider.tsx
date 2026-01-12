'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setIsLoading(false);
        };

        getUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const signInWithGoogle = useCallback(async () => {
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
    }, [supabase.auth]);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error.message);
            throw error;
        }
    }, [supabase.auth]);

    return (
        <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
