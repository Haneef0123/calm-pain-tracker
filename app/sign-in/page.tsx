'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { GoogleIcon, SpinnerIcon } from '@/components/icons';

export default function SignInPage() {
    const { signInWithGoogle } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch {
            setError('Sign-in failed. Please try again.');
            setIsSigningIn(false);
        }
    };

    // No loading check needed - middleware handles auth redirects server-side
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-8 text-center animate-fade-in">
                <div className="space-y-2">
                    <h1 className="text-display text-3xl font-semibold tracking-tight">
                        PainMap
                    </h1>
                    <p className="text-muted-foreground">
                        Your first pain trend appears after 3 check-ins — takes 30 seconds to start
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={handleSignIn}
                        disabled={isSigningIn}
                        className="w-full h-12 text-base"
                        size="lg"
                    >
                        {isSigningIn ? (
                            <span className="flex items-center gap-2">
                                <SpinnerIcon size={16} />
                                Signing in...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <GoogleIcon size={20} />
                                Sign in with Google
                            </span>
                        )}
                    </Button>

                    {error && (
                        <p className="text-sm text-destructive animate-fade-in">{error}</p>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    Your data is stored securely in the cloud
                </p>
            </div>
        </div>
    );
}
