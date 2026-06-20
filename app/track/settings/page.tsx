'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TrackShell } from '@/components/track/TrackShell';
import { RecoveryStatusCard } from '@/components/track/RecoveryStatusCard';
import { BackupDrawer } from '@/components/track/BackupDrawer';
import { useBackupStatus } from '@/hooks/use-backup-status';

export default function TrackSettingsPage() {
  const router = useRouter();
  const { isBackedUp, isLoading, markBackedUp } = useBackupStatus();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <TrackShell>
      <div className="page-shell page-stack">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#919191] hover:bg-[#eef1ee] hover:text-[#1c211d]"
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
      </div>

      <BackupDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onBackedUp={markBackedUp}
      />
    </TrackShell>
  );
}
