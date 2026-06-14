'use client';

import { cn } from '@/lib/utils';
import type { DiscEntry, SpineRegion } from '@/types/pain-entry';
import { getDiscLevelsForRegion } from '@/types/pain-entry';

interface DiscLevelSelectorProps {
  spineRegion: SpineRegion;
  value: DiscEntry[];
  onChange: (value: DiscEntry[]) => void;
  maxDiscs?: number;
  required?: boolean;
}

const DISC_LEVEL_CONTENT = {
  // Cervical
  'C2-C3': 'Between 2nd and 3rd cervical vertebrae',
  'C3-C4': 'Between 3rd and 4th cervical vertebrae',
  'C4-C5': 'Between 4th and 5th (common site)',
  'C5-C6': 'Between 5th and 6th (most common)',
  'C6-C7': 'Between 6th and 7th (common site)',
  'C7-T1': 'Cervical-thoracic junction',
  // Lumbar
  'L1-L2': 'Between 1st and 2nd lumbar vertebrae',
  'L2-L3': 'Between 2nd and 3rd lumbar vertebrae',
  'L3-L4': 'Between 3rd and 4th lumbar vertebrae',
  'L4-L5': 'Between 4th and 5th (most common)',
  'L5-S1': 'Lumbar-sacral junction (most common)',
} as const;

function PrimaryStar({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-[11px] w-[11px]', className)}
    >
      <path d="M10 1.8l2.5 5.1 5.6 0.8-4 4 0.9 5.6L10 14.6l-5 2.7 0.9-5.6-4-4 5.6-0.8z" />
    </svg>
  );
}

export function DiscLevelSelector({
  spineRegion,
  value,
  onChange,
  maxDiscs = 3,
}: DiscLevelSelectorProps) {
  const discLevels = getDiscLevelsForRegion(spineRegion);
  const selectedLevels = value.map((d) => d.level);
  const isMaxReached = value.length >= maxDiscs;

  const normalizeRoles = (levels: string[]): DiscEntry[] =>
    levels.map((level, index) => ({
      level,
      role: index === 0 ? 'primary' : 'secondary',
    }));

  const toggleDisc = (level: string) => {
    if (selectedLevels.includes(level)) {
      onChange(normalizeRoles(selectedLevels.filter((selectedLevel) => selectedLevel !== level)));
      return;
    }

    if (!isMaxReached) {
      onChange(normalizeRoles([...selectedLevels, level]));
    }
  };

  const primaryDisc = value[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-label text-[#1c211d]">Disc level</span>
        <span className="text-xs text-[#ababab]">First pick is primary · up to {maxDiscs}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {discLevels.map((level) => {
          const isSelected = selectedLevels.includes(level);
          const discEntry = value.find((d) => d.level === level);
          const isPrimary = discEntry?.role === 'primary';
          const isDisabled = !isSelected && isMaxReached;

          return (
            <button
              key={level}
              type="button"
              onClick={() => toggleDisc(level)}
              disabled={isDisabled}
              className={cn(
                'inline-flex items-center gap-[5px] rounded-full border px-[14px] py-2 text-[13px] font-semibold transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
                isSelected
                  ? 'border-[#181b19] bg-[#181b19] text-white'
                  : isDisabled
                    ? 'cursor-not-allowed border-[#e1e4e1] bg-[#f4f5f4] text-[#b2b6b2] opacity-60'
                    : 'border-[#e1e4e1] bg-white text-[#3b3b3b] hover:border-[#181b19]'
              )}
            >
              {isSelected && isPrimary ? <PrimaryStar className="text-[#ffd20a]" /> : null}
              <span>{level}</span>
            </button>
          );
        })}
      </div>

      {primaryDisc ? (
        <div className="text-xs text-[#6b716c]">
          <span className="inline-flex items-center gap-1">
            <PrimaryStar className="text-[#dfb437]" />
            Primary: {primaryDisc.level}
          </span>
        </div>
      ) : null}

      {value.length > 0 ? (
        <p className="sr-only">
          {value.map((disc) => `${disc.level} ${disc.role}`).join(', ')}
        </p>
      ) : null}

      {value.length > 0 && (
        <div className="sr-only">
          {value.map((disc) => DISC_LEVEL_CONTENT[disc.level as keyof typeof DISC_LEVEL_CONTENT]).join(', ')}
        </div>
      )}
    </div>
  );
}
