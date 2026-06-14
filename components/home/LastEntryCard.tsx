'use client';

import { Star } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { getPainLevelVisuals } from '@/lib/utils';
import { getPrimaryDisc, getSensationLabel } from '@/types/pain-entry';

export function LastEntryCard() {
  const { entries, isLoaded, isFetching } = usePainEntries();

  const lastEntry = entries?.[0];

  if (!isLoaded || isFetching) {
    return (
      <div className="animate-pulse rounded-[18px] border border-black/5 bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-[10px] w-20 rounded-full bg-[#edf0ed]" />
          <div className="h-3 w-14 rounded-full bg-[#edf0ed]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-[#edf0ed]" />
          <div className="h-7 w-16 rounded-full bg-[#edf0ed]" />
          <div className="h-4 w-28 rounded-full bg-[#edf0ed]" />
        </div>
      </div>
    );
  }

  if (!lastEntry) {
    return (
      <div className="rounded-[18px] border border-black/5 bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
        <p className="text-[13px] text-[#777777]">
          No entries yet. Start tracking today.
        </p>
      </div>
    );
  }

  const timeAgo = formatDistanceToNowStrict(new Date(lastEntry.timestamp), {
    addSuffix: true,
  });
  const primaryDisc = getPrimaryDisc(lastEntry);
  const painVisuals = getPainLevelVisuals(lastEntry.painLevel);
  const regionLabel =
    lastEntry.spineRegion === 'cervical'
      ? 'Cervical'
      : lastEntry.spineRegion === 'lumbar'
        ? 'Lumbar'
        : 'General';
  const firstSensation = lastEntry.sensations?.[0]
    ? getSensationLabel(lastEntry.sensations[0]).toLowerCase()
    : null;
  const metaLabel = firstSensation
    ? `${regionLabel} · ${firstSensation}`
    : regionLabel;

  return (
    <div className="rounded-[18px] border border-black/5 bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
      <div className="mb-[10px] flex items-baseline justify-between gap-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#919191]">
          Last entry
        </span>
        <span className="text-[12px] text-[#ababab]">{timeAgo}</span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="text-[28px] font-semibold leading-none"
          style={{
            color: painVisuals.accent,
            fontFamily: '"Roboto Mono", ui-monospace, monospace',
          }}
        >
          {lastEntry.painLevel}
        </span>

        {primaryDisc && (
          <span className="inline-flex items-center gap-[5px] rounded-full bg-[#262626] px-[11px] py-1 text-[12px] font-semibold text-white">
            <Star className="h-[11px] w-[11px] text-[#ffd20a]" fill="currentColor" />
            {primaryDisc.level}
          </span>
        )}

        <span className="min-w-0 truncate text-[13px] text-[#777777]">
          {metaLabel}
        </span>
      </div>
    </div>
  );
}
