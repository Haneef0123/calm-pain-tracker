'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Download, Trash2, LogOut, UserX } from 'lucide-react';
import { AccountInfo } from '@/components/pain/AccountInfo';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { PainEntry } from '@/types/pain-entry';

interface SettingsProps {
    initialEntries: PainEntry[];
    userEmail: string | null;
}

export default function Settings({ initialEntries, userEmail }: SettingsProps) {
    const { entries, exportToCsv, clearAllEntries } = usePainEntries(initialEntries);
    const { signOut } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const supabase = createClient();

    const handleExport = () => {
        if (entries.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Start tracking pain to create data.',
            });
            return;
        }
        exportToCsv();
        toast({
            title: 'Export complete',
            description: `Exported ${entries.length} entries.`,
        });
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            router.push('/sign-in');
        } catch {
            toast({
                title: 'Sign out failed',
                description: 'Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSigningOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);
        try {
            const { error } = await supabase.rpc('delete_user');

            if (error) {
                await signOut();
                router.push('/sign-in');
                toast({
                    title: 'Signed out',
                    description: 'Contact support to complete account deletion.',
                });
                return;
            }

            router.push('/sign-in');
            toast({
                title: 'Account deleted',
                description: 'Your account and all data have been removed.',
            });
        } catch {
            toast({
                title: 'Deletion failed',
                description: 'Please try again or contact support.',
                variant: 'destructive',
            });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllEntries();
            toast({
                title: 'Data cleared',
                description: 'All entries have been deleted.',
            });
        } catch {
            // Error already shown by hook
        }
    };

    return (
        <PageLayout>
            <div className="pt-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-heading">About</h1>
                </header>

                <div className="mb-8 space-y-4 text-sm text-muted-foreground">
                    <p>
                        PainMap is a simple way to record pain and notice patterns over time.
                    </p>
                    <p>
                        It doesn&apos;t diagnose or treat — it helps you remember what your body is already telling you.
                    </p>
                    <p>
                        Built for people living with pain, not for tracking perfection.
                    </p>
                </div>

                <div className="h-px bg-border my-6" />

                <div className="mb-8">
                    <AccountInfo email={userEmail} entryCount={entries.length} />
                </div>

                <div className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full justify-start h-12 bg-card border-border"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4 mr-3" />
                        Export CSV
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 border-border"
                            >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Clear all entries
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Clear all entries?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all {entries.length} pain entries.
                                    Consider exporting your data first. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClearAll}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete all
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <div className="h-px bg-border my-6" />

                    <Button
                        variant="outline"
                        className="w-full justify-start h-12 border-border"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isSigningOut ? 'Signing out...' : 'Sign out'}
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            >
                                <UserX className="w-4 h-4 mr-3" />
                                Delete account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your account and all {entries.length} pain entries.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    disabled={isDeletingAccount}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isDeletingAccount ? 'Deleting...' : 'Delete account'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </PageLayout>
    );
}
