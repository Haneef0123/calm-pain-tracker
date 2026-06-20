'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TrackShell } from '@/components/track/TrackShell';
import { RecoveryStatusCard } from '@/components/track/RecoveryStatusCard';
import { BackupDrawer } from '@/components/track/BackupDrawer';
import { useBackupStatus } from '@/hooks/use-backup-status';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { useActionOverlay } from '@/components/ui/action-overlay';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

const RowDivider = () => <div className="mx-[18px] h-px bg-[#f0f2f0]" />;

interface SettingsRowProps {
  icon: ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  danger?: boolean;
}

function SettingsRow({ icon, label, onClick, disabled = false, danger = false }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={() => { void onClick(); }}
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
  setConfirming: (v: boolean) => void,
  timerRef: React.MutableRefObject<number | null>,
) {
  setConfirming(true);
  if (timerRef.current) window.clearTimeout(timerRef.current);
  timerRef.current = window.setTimeout(() => {
    setConfirming(false);
    timerRef.current = null;
  }, 3000);
}

function clearConfirmation(
  setConfirming: (v: boolean) => void,
  timerRef: React.MutableRefObject<number | null>,
) {
  setConfirming(false);
  if (timerRef.current) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

export default function TrackSettingsPage() {
  const router = useRouter();
  const { isBackedUp, isLoading, markBackedUp } = useBackupStatus();
  const { entries, exportToCsv, clearAllEntries } = usePainEntries();
  const { showOverlay } = useActionOverlay();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isClearingEntries, setIsClearingEntries] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const clearTimerRef = useRef<number | null>(null);
  const deleteTimerRef = useRef<number | null>(null);

  const handleExport = () => {
    if (entries.length === 0) {
      toast({ title: 'No data to export', description: 'Log an entry first.' });
      return;
    }
    exportToCsv();
  };

  const handleClearAll = async () => {
    clearConfirmation(setConfirmingClear, clearTimerRef);
    setIsClearingEntries(true);
    try {
      await clearAllEntries();
      showOverlay({ title: 'Cleared.', subtitle: 'All entries removed', accent: '#d53627' });
    } catch {
      // Error toast handled in hook
    } finally {
      setIsClearingEntries(false);
    }
  };

  const handleClearClick = async () => {
    if (isClearingEntries) return;
    if (!confirmingClear) {
      armConfirmation(setConfirmingClear, clearTimerRef);
      return;
    }
    await handleClearAll();
  };

  const handleDeleteAll = async () => {
    clearConfirmation(setConfirmingDelete, deleteTimerRef);
    setIsDeletingData(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        toast({ title: 'Deletion failed', description: 'Please try again.', variant: 'destructive' });
        return;
      }
      router.push('/track');
      toast({ title: 'All data deleted', description: 'Your data has been permanently removed.' });
    } catch {
      toast({ title: 'Deletion failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteClick = async () => {
    if (isDeletingData) return;
    if (!confirmingDelete) {
      armConfirmation(setConfirmingDelete, deleteTimerRef);
      return;
    }
    await handleDeleteAll();
  };

  return (
    <TrackShell>
      <div className="page-shell page-stack">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#919191] hover:bg-[#eef1ee] hover:text-[#1c211d]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="page-title">Settings</h1>
        </header>

        <RecoveryStatusCard
          isBackedUp={isBackedUp}
          isLoading={isLoading}
          onBackup={() => setDrawerOpen(true)}
          onRestore={() => router.push('/track/restore')}
        />

        <div className="flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
          <SettingsRow
            label="View past entries"
            onClick={() => router.push('/track/history')}
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5h14M3 10h14M3 15h8" />
              </svg>
            }
          />
          <RowDivider />
          <SettingsRow
            label="Export CSV"
            onClick={handleExport}
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 16h12" />
              </svg>
            }
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
          <SettingsRow
            label={
              isClearingEntries
                ? 'Clearing entries…'
                : confirmingClear
                  ? `Confirm clear all ${entries.length} entries`
                  : 'Clear all entries'
            }
            onClick={handleClearClick}
            disabled={isClearingEntries}
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2.5 0-.7 9a1.8 1.8 0 0 1-1.8 1.7H8a1.8 1.8 0 0 1-1.8-1.7l-.7-9" />
              </svg>
            }
          />
          <RowDivider />
          <SettingsRow
            label={
              isDeletingData
                ? 'Deleting…'
                : confirmingDelete
                  ? 'Confirm delete all data'
                  : 'Delete all data'
            }
            onClick={handleDeleteClick}
            disabled={isDeletingData}
            danger
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="3.5" />
                <path d="M3 17.5c0-3 3-5.5 7-5.5s7 2.5 7 5.5" />
              </svg>
            }
          />
        </div>

        <p className="mt-1 text-center text-[11.5px] text-[#ababab]">
          Pain Tracker · Your data is yours
        </p>
      </div>

      <BackupDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onBackedUp={markBackedUp}
      />
    </TrackShell>
  );
}
