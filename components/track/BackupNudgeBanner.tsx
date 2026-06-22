"use client";

import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackupNudgeBannerProps {
  onSave: () => void;
  onDismiss: () => void;
}

export function BackupNudgeBanner({
  onSave,
  onDismiss,
}: BackupNudgeBannerProps) {
  return (
    <div className="animate-fade-in relative overflow-hidden rounded-[18px] border border-amber-200/70 bg-amber-50/60 p-4 shadow-[0_1px_2px_rgba(12,12,12,0.04)]">
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-amber-700/70 transition-colors hover:bg-amber-100 hover:text-amber-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldAlert className="h-[18px] w-[18px]" />
        </span>
        <div className="flex-1 space-y-0.5">
          <p className="text-[14px] font-semibold text-amber-900">
            Save your data
          </p>
          <p className="text-[12.5px] leading-relaxed text-amber-800/80">
            Make a recovery code so your entries are safe on any device.
          </p>
        </div>
      </div>

      <Button
        size="sm"
        onClick={onSave}
        className="mt-3 h-[42px] w-full rounded-full bg-amber-900 text-[13px] font-semibold text-white hover:bg-amber-800"
      >
        Save a recovery code
      </Button>
    </div>
  );
}
