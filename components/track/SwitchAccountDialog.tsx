'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SwitchAccountDialogProps {
  open: boolean;
  entryCount: number;
  onBackUpFirst: () => void;
  onSwitchAnyway: () => void;
  onOpenChange: (open: boolean) => void;
}

export function SwitchAccountDialog({
  open,
  entryCount,
  onBackUpFirst,
  onSwitchAnyway,
  onOpenChange,
}: SwitchAccountDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Switch to saved data?</AlertDialogTitle>
          <AlertDialogDescription>
            You have {entryCount} {entryCount === 1 ? 'entry' : 'entries'} on this device
            that aren&apos;t backed up. Restoring switches to your saved data and leaves these
            behind.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onBackUpFirst}>Back up these first</AlertDialogCancel>
          <AlertDialogAction
            onClick={onSwitchAnyway}
            className="bg-[#d53627] text-white hover:bg-[#b52c1f]"
          >
            Switch anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
