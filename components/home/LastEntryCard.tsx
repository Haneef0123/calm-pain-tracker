'use client';

import { formatDistanceToNow } from 'date-fns';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { cn, getPainLevelClass } from '@/lib/utils';
import { Star } from 'lucide-react';

export function LastEntryCard() {
  const { entries, isLoaded, isFetching } = usePainEntries();

  // Get the most recent entry
  const lastEntry = entries?.[0];

  if (!isLoaded || isFetching) {
    return (
      <div className="bg-card/30 border border-border/30 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-3" />
        <div className="h-8 bg-muted rounded w-16 mb-2" />
        <div className="h-3 bg-muted rounded w-32" />
      </div>
    );
  }

  if (!lastEntry) {
    return (
      <div className="bg-card/30 border border-border/30 rounded-lg p-5 text-center">
        <p className="text-sm text-muted-foreground">
          No entries yet. Start tracking today!
        </p>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(lastEntry.timestamp), {
    addSuffix: true,
  });

  // Get primary disc
  const primaryDisc = lastEntry.discs?.find((d) => d.role === 'primary');
  const secondaryDiscs = lastEntry.discs?.filter((d) => d.role === 'secondary') || [];

  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Entry Info */}
        <div className="space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Last Entry
          </p>
          
          {/* Pain Level */}
          <p className={cn('text-3xl font-bold', getPainLevelClass(lastEntry.painLevel))}>
            {lastEntry.painLevel}
          </p>

          {/* Disc Info */}
          {primaryDisc && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-foreground text-background rounded-sm text-sm">
                <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                {primaryDisc.level}
              </span>
              {secondaryDiscs.map((disc) => (
                <span
                  key={disc.level}
                  className="px-2 py-0.5 bg-muted text-foreground rounded-sm text-sm"
                >
                  {disc.level}
                </span>
              ))}
            </div>
          )}

          {/* Spine Region */}
          {lastEntry.spineRegion && (
            <p className="text-xs text-muted-foreground capitalize">
              {lastEntry.spineRegion} region
            </p>
          )}
        </div>

        {/* Right: Time */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* Sensations preview */}
      {lastEntry.sensations && lastEntry.sensations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            {lastEntry.sensations.slice(0, 3).join(', ')}
            {lastEntry.sensations.length > 3 && ` +${lastEntry.sensations.length - 3} more`}
          </p>
        </div>
      )}
    </div>
  );
}
