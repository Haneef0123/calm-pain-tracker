'use client';

import type { Dispatch, MutableRefObject, ReactNode, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { useActionOverlay } from '@/components/ui/action-overlay';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { AccountInfo } from '@/components/pain/AccountInfo';

interface SettingsProps {
    entryCount: number;
    userEmail: string | null;
    showAdminAnalytics: boolean;
}

interface SettingsRowProps {
    icon: ReactNode;
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    danger?: boolean;
}

const RowDivider = () => <div className="mx-[18px] h-px bg-[#f0f2f0]" />;

const SETTINGS_OVERLAY_ACCENTS = {
    export: '#008391',
    clear: '#d53627',
} as const;

function SettingsRow({ icon, label, onClick, disabled = false, danger = false }: SettingsRowProps) {
    return (
        <button
            type="button"
            onClick={() => {
                void onClick();
            }}
            disabled={disabled}
            className={[
                'flex w-full items-center gap-[14px] border-none bg-transparent px-[18px] py-[15px] text-left font-[inherit] text-[14px] transition-colors',
                danger
                    ? 'font-semibold text-[#d53627] hover:bg-[#fdf7f6]'
                    : 'font-medium text-[#1c211d] hover:bg-[#fafbfa]',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ].join(' ')}
        >
            <span className={danger ? 'text-current' : 'text-[#525252]'} aria-hidden="true">
                {icon}
            </span>
            <span className="flex-1">{label}</span>
            {!danger && (
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="#c6c6c6"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M8 5l5 5-5 5" />
                </svg>
            )}
        </button>
    );
}

function armConfirmation(
    setConfirming: Dispatch<SetStateAction<boolean>>,
    timerRef: MutableRefObject<number | null>,
) {
    setConfirming(true);
    if (timerRef.current) {
        window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
        setConfirming(false);
        timerRef.current = null;
    }, 3000);
}

function clearConfirmation(
    setConfirming: Dispatch<SetStateAction<boolean>>,
    timerRef: MutableRefObject<number | null>,
) {
    setConfirming(false);
    if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
    }
}

export default function Settings({ entryCount, userEmail, showAdminAnalytics }: SettingsProps) {
    const { entries, exportToCsv, clearAllEntries, isLoaded } = usePainEntries();
    const { showOverlay } = useActionOverlay();
    const displayCount = isLoaded ? entries.length : entryCount;
    const { signOut } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isClearingEntries, setIsClearingEntries] = useState(false);
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const supabase = createClient();
    const clearTimerRef = useRef<number | null>(null);
    const deleteTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const clearTimer = clearTimerRef.current;
        const deleteTimer = deleteTimerRef.current;

        return () => {
            if (clearTimer) {
                window.clearTimeout(clearTimer);
            }
            if (deleteTimer) {
                window.clearTimeout(deleteTimer);
            }
        };
    }, []);

    const handleExport = () => {
        if (entries.length === 0) {
            toast({
                title: 'No data to export',
                description: 'Start tracking pain to create data.',
            });
            return;
        }

        const exportedCount = entries.length;
        exportToCsv();
        showOverlay({
            title: 'Exported.',
            subtitle: `${exportedCount} ${exportedCount === 1 ? 'entry' : 'entries'} in CSV`,
            accent: SETTINGS_OVERLAY_ACCENTS.export,
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
        clearConfirmation(setConfirmingDelete, deleteTimerRef);
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
        clearConfirmation(setConfirmingClear, clearTimerRef);
        setIsClearingEntries(true);

        try {
            await clearAllEntries();
            showOverlay({
                title: 'Cleared.',
                subtitle: 'All entries removed',
                accent: SETTINGS_OVERLAY_ACCENTS.clear,
            });
        } catch {
            // Error already shown by hook.
        } finally {
            setIsClearingEntries(false);
        }
    };

    const handleClearRowClick = async () => {
        if (isClearingEntries) {
            return;
        }

        if (!confirmingClear) {
            armConfirmation(setConfirmingClear, clearTimerRef);
            return;
        }

        await handleClearAll();
    };

    const handleDeleteRowClick = async () => {
        if (isDeletingAccount) {
            return;
        }

        if (!confirmingDelete) {
            armConfirmation(setConfirmingDelete, deleteTimerRef);
            return;
        }

        await handleDeleteAccount();
    };

    return (
        <PageLayout>
            <div className="flex flex-col gap-[14px] pb-6 pt-7">
                <h1 className="text-[24px] font-semibold leading-[30px] tracking-[-0.02em] text-[#1c211d]">
                    Settings
                </h1>

                <AccountInfo email={userEmail} entryCount={displayCount} />

                <div className="flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
                    {showAdminAnalytics && (
                        <>
                            <SettingsRow
                                label="Admin analytics"
                                onClick={() => router.push('/admin/analytics')}
                                icon={(
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M4 16V9M10 16V4M16 16v-5" />
                                    </svg>
                                )}
                            />
                            <RowDivider />
                        </>
                    )}

                    <SettingsRow
                        label="Export CSV"
                        onClick={handleExport}
                        icon={(
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 16h12" />
                            </svg>
                        )}
                    />
                    <RowDivider />
                    <SettingsRow
                        label={
                            isClearingEntries
                                ? 'Clearing entries...'
                                : confirmingClear
                                  ? `Confirm clear all ${displayCount} entries`
                                  : 'Clear all entries'
                        }
                        onClick={handleClearRowClick}
                        disabled={isClearingEntries}
                        icon={(
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2.5 0-.7 9a1.8 1.8 0 0 1-1.8 1.7H8a1.8 1.8 0 0 1-1.8-1.7l-.7-9" />
                            </svg>
                        )}
                    />
                </div>

                <div className="flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
                    <SettingsRow
                        label={isSigningOut ? 'Signing out...' : 'Sign out'}
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        icon={(
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M8 17H5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 5 3h3M13 14l4-4-4-4M17 10H8" />
                            </svg>
                        )}
                    />
                    <RowDivider />
                    <SettingsRow
                        label={
                            isDeletingAccount
                                ? 'Deleting account...'
                                : confirmingDelete
                                  ? `Confirm delete account and ${displayCount} entries`
                                  : 'Delete account'
                        }
                        onClick={handleDeleteRowClick}
                        disabled={isDeletingAccount}
                        danger
                        icon={(
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="8" cy="6.5" r="3" />
                                <path d="M3 17c0-2.8 2.2-5 5-5 1 0 1.9.3 2.7.8M14 13l4 4M18 13l-4 4" />
                            </svg>
                        )}
                    />
                </div>

                <p className="mt-1 text-center text-[11.5px] text-[#ababab]">
                    Pain Tracker · Your data stays yours
                </p>
            </div>
        </PageLayout>
    );
}
