'use client';

import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Content separated from JSX
const REWARD_CONTENT = {
  title: 'Logged!',
  messageFirst: 'Your first trend appears after 3 check-ins.',
  messageProgress: (count: number) =>
    count >= 3
      ? 'Check your Patterns tab for insights.'
      : `${3 - count} more check-in${3 - count === 1 ? '' : 's'} until your first trend.`,
  addDetails: 'Add specific symptoms',
  done: 'Done for today',
} as const;

interface QuickCheckInRewardCardProps {
  entryCount: number;
  onAddDetails: () => void;
  onDismiss: () => void;
}

export function QuickCheckInRewardCard({
  entryCount,
  onAddDetails,
  onDismiss,
}: QuickCheckInRewardCardProps) {
  const message =
    entryCount <= 1
      ? REWARD_CONTENT.messageFirst
      : REWARD_CONTENT.messageProgress(entryCount);

  return (
    <div className="bg-card border border-border rounded-sm p-5 space-y-4 animate-fade-in">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{REWARD_CONTENT.title}</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddDetails}
          className="flex-1 text-xs"
        >
          {REWARD_CONTENT.addDetails}
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="flex-1 text-xs text-muted-foreground"
        >
          {REWARD_CONTENT.done}
        </Button>
      </div>
    </div>
  );
}
