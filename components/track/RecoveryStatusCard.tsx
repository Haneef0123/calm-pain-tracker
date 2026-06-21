'use client';

import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecoveryStatusCardProps {
  isBackedUp: boolean;
  isLoading?: boolean;
  onBackup: () => void;
  onRestore: () => void;
}

export function RecoveryStatusCard({
  isBackedUp,
  isLoading,
  onBackup,
  onRestore,
}: RecoveryStatusCardProps) {
  return (
    <div className="rounded-[18px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
      <div className="flex items-start gap-3">
        {isBackedUp ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#008858]" />
        ) : (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        )}
        <div className="flex-1 space-y-1">
          <p className="text-[14px] font-semibold text-[#1c211d]">
            {isBackedUp ? 'Backed up ✓' : 'Not backed up yet'}
          </p>
          <p className="text-[12.5px] leading-relaxed text-[#6b716c]">
            {isBackedUp
              ? 'Use your recovery code to restore on another device.'
              : 'Save a recovery code to sync and restore your data on any device.'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {!isBackedUp && (
          <Button
            onClick={onBackup}
            disabled={isLoading}
            className="h-[48px] w-full rounded-full bg-[#181b19] text-[14px] font-semibold text-white hover:bg-[#2c302d] disabled:opacity-50"
          >
            Save a recovery code
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onRestore}
          className="h-[44px] w-full rounded-full text-[13.5px] text-[#4a4f4c] hover:bg-[#f3f6f3]"
        >
          Use a code from another device
        </Button>
      </div>
    </div>
  );
}
