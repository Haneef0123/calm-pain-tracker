'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TrackShell } from '@/components/track/TrackShell';
import { Button } from '@/components/ui/button';
import { SwitchAccountDialog } from '@/components/track/SwitchAccountDialog';
import { BackupDrawer } from '@/components/track/BackupDrawer';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { useBackupStatus } from '@/hooks/use-backup-status';
import { toast } from '@/hooks/use-toast';
import { applyCodeInput, RECOVERY_CODE_LENGTH } from '@/lib/recovery/code';

type FormState = 'idle' | 'verifying' | 'invalid' | 'rate-limited' | 'network-error';

export default function TrackRestorePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { entries } = usePainEntries();
  const { isBackedUp, markBackedUp } = useBackupStatus();

  const [code, setCode] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [retryMinutes, setRetryMinutes] = useState(15);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [backupDrawerOpen, setBackupDrawerOpen] = useState(false);

  // Number of local entries that would be orphaned on switch
  const unsavedCount = !isBackedUp ? entries.length : 0;

  const doRedeem = async () => {
    setFormState('verifying');
    try {
      const res = await fetch('/api/recovery/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        toast({ title: 'Welcome back — your data is restored.' });
        queryClient.clear();
        router.push('/track');
        return;
      }

      const data = (await res.json()) as { error?: string; retryAfterMinutes?: number };

      if (res.status === 429) {
        setRetryMinutes(data.retryAfterMinutes ?? 15);
        setFormState('rate-limited');
        return;
      }

      if (res.status === 401) {
        setFormState('invalid');
        return;
      }

      setFormState('network-error');
    } catch {
      setFormState('network-error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < RECOVERY_CODE_LENGTH || formState === 'verifying') return;

    if (unsavedCount > 0) {
      setSwitchDialogOpen(true);
      return;
    }

    void doRedeem();
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
          <h1 className="page-title">Restore your data</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-[14px] text-[#6b716c]">Enter the recovery code you saved.</p>

          <input
            type="text"
            id="recovery-code-input"
            aria-label="Recovery code"
            aria-invalid={formState === 'invalid'}
            aria-describedby={
              formState !== 'idle' && formState !== 'verifying'
                ? 'restore-error'
                : undefined
            }
            value={code}
            onChange={(e) => {
              setCode(applyCodeInput(e.target.value, code));
              if (formState !== 'idle') setFormState('idle');
            }}
            placeholder="XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            disabled={formState === 'verifying'}
            className="w-full rounded-[14px] border border-black/10 bg-white px-4 py-3 font-mono text-[16px] tracking-[0.15em] text-[#1c211d] placeholder:tracking-normal placeholder:text-[#c0c4c1] focus:border-[#1c211d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1c211d] focus-visible:ring-offset-1 disabled:opacity-50"
          />

          {formState === 'invalid' && (
            <p id="restore-error" role="alert" className="text-[13px] text-[#d53627]">
              That code didn&apos;t match. Check the characters and try again.
            </p>
          )}
          {formState === 'rate-limited' && (
            <p id="restore-error" role="alert" className="text-[13px] text-[#d53627]">
              Too many attempts. Please try again in ~{retryMinutes} minutes.
            </p>
          )}
          {formState === 'network-error' && (
            <p id="restore-error" role="alert" className="text-[13px] text-[#d53627]">
              Couldn&apos;t reach the server. Check your connection.
            </p>
          )}

          <Button
            type="submit"
            disabled={code.length < RECOVERY_CODE_LENGTH || formState === 'verifying'}
            className="h-[52px] w-full rounded-full bg-[#181b19] text-[14px] font-semibold text-white hover:bg-[#2c302d] disabled:opacity-50"
          >
            {formState === 'verifying' ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </span>
            ) : (
              'Restore my data'
            )}
          </Button>
        </form>
      </div>

      <SwitchAccountDialog
        open={switchDialogOpen}
        entryCount={unsavedCount}
        onOpenChange={setSwitchDialogOpen}
        onBackUpFirst={() => setBackupDrawerOpen(true)}
        onSwitchAnyway={() => { void doRedeem(); }}
      />

      <BackupDrawer
        open={backupDrawerOpen}
        onOpenChange={setBackupDrawerOpen}
        onBackedUp={markBackedUp}
      />
    </TrackShell>
  );
}
