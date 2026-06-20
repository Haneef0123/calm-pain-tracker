'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackupNudgeBannerProps {
  onSave: () => void;
  onDismiss: () => void;
}

export function BackupNudgeBanner({ onSave, onDismiss }: BackupNudgeBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex-1 text-[13px] font-medium text-amber-900">
        Save your data so you don&apos;t lose it.
      </p>
      <Button
        size="sm"
        onClick={onSave}
        className="h-8 shrink-0 rounded-full bg-amber-900 px-3 text-[12px] font-semibold text-white hover:bg-amber-800"
      >
        Save
      </Button>
      <button
        onClick={onDismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-700 hover:bg-amber-100"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
