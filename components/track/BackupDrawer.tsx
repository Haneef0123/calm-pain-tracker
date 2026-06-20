'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { RecoveryCodeCard } from './RecoveryCodeCard';

type Step = 'intro' | 'reveal' | 'confirm';

interface BackupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackedUp: () => void;
}

export function BackupDrawer({ open, onOpenChange, onBackedUp }: BackupDrawerProps) {
  const [step, setStep] = useState<Step>('intro');
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const reset = () => {
    setStep('intro');
    setCode(null);
    setError(null);
    setConfirmed(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && step === 'reveal') return; // prevent accidental close while code is shown
    onOpenChange(next);
    if (!next) setTimeout(reset, 300);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recovery/create', { method: 'POST' });
      if (!res.ok) throw new Error('server error');
      const data = await res.json();
      setCode(data.code);
      setStep('reveal');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onBackedUp();
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-white shadow-[0_-8px_40px_rgba(12,12,12,0.18)]">
        {step === 'intro' && (
          <div className="space-y-5 px-6 pb-8 pt-6">
            <DrawerHeader className="p-0 text-left">
              <DrawerTitle className="text-[17px] font-semibold leading-none text-[#1c211d]">
                Save a recovery code
              </DrawerTitle>
            </DrawerHeader>

            <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[13px] leading-relaxed text-amber-900">
                This recovery code is the only way to get your data back — there&apos;s no email or
                password reset. Write it down or save it somewhere safe.
              </p>
            </div>

            <p className="text-[13.5px] leading-relaxed text-[#4a4f4c]">
              Your code lets you restore your data on any device. You can regenerate it later if needed.
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="h-[52px] w-full rounded-full bg-[#181b19] text-[15px] font-semibold text-white hover:bg-[#2c302d] disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
              ) : (
                'Generate my code'
              )}
            </Button>
          </div>
        )}

        {step === 'reveal' && code && (
          <div className="space-y-5 px-6 pb-8 pt-6">
            <DrawerHeader className="p-0 text-left">
              <DrawerTitle className="text-[17px] font-semibold leading-none text-[#1c211d]">
                Your recovery code
              </DrawerTitle>
              <DrawerDescription className="text-[12.5px] text-[#919191]">
                Copy or save it before continuing — it won&apos;t be shown again.
              </DrawerDescription>
            </DrawerHeader>

            <RecoveryCodeCard code={code} />

            <Button
              onClick={() => setStep('confirm')}
              className="h-[52px] w-full rounded-full bg-[#181b19] text-[15px] font-semibold text-white hover:bg-[#2c302d]"
            >
              I&apos;ve saved it →
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-5 px-6 pb-8 pt-6">
            <DrawerHeader className="p-0 text-left">
              <DrawerTitle className="text-[17px] font-semibold leading-none text-[#1c211d]">
                Confirm
              </DrawerTitle>
            </DrawerHeader>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded accent-[#181b19]"
              />
              <span className="text-[14px] leading-relaxed text-[#1c211d]">
                I&apos;ve saved my recovery code somewhere safe.
              </span>
            </label>

            <Button
              onClick={handleDone}
              disabled={!confirmed}
              className="h-[52px] w-full rounded-full bg-[#181b19] text-[15px] font-semibold text-white hover:bg-[#2c302d] disabled:opacity-50"
            >
              Done
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
