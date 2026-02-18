'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
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

export function DiscLevelSelector({
  spineRegion,
  value,
  onChange,
  maxDiscs = 3,
  required = false,
}: DiscLevelSelectorProps) {
  const discLevels = getDiscLevelsForRegion(spineRegion);
  const selectedLevels = value.map((d) => d.level);
  const isMaxReached = value.length >= maxDiscs;

  const toggleDisc = (level: string) => {
    const existing = value.find((d) => d.level === level);

    if (existing) {
      // Remove disc
      const newValue = value.filter((d) => d.level !== level);

      // If we removed the primary, make the first remaining disc primary
      if (existing.role === 'primary' && newValue.length > 0) {
        newValue[0] = { ...newValue[0], role: 'primary' };
      }

      onChange(newValue);
    } else if (!isMaxReached) {
      // Add disc
      const isFirst = value.length === 0;
      const newDisc: DiscEntry = {
        level,
        role: isFirst ? 'primary' : 'secondary',
      };
      onChange([...value, newDisc]);
    }
  };

  const togglePrimary = (level: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Set clicked disc as primary, others as secondary
    const newValue = value.map((d) => ({
      ...d,
      role: d.level === level ? ('primary' as const) : ('secondary' as const),
    }));
    onChange(newValue);
  };

  const primaryDisc = value.find((d) => d.role === 'primary');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-label">
            Which disc?
          </span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            Common disc auto-selected. Change if needed.
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {value.length}/{maxDiscs} selected
        </span>
      </div>

      <div className="space-y-2">
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
                'w-full flex items-center gap-3 py-3 px-4 rounded-sm border transition-all duration-100',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
                isSelected
                  ? 'bg-foreground text-background border-foreground'
                  : isDisabled
                  ? 'bg-muted/50 text-muted-foreground border-border cursor-not-allowed opacity-50'
                  : 'bg-transparent text-foreground border-border hover:border-foreground'
              )}
            >
              {/* Checkbox indicator */}
              <div
                className={cn(
                  'w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0',
                  isSelected
                    ? 'bg-background border-background'
                    : 'border-current'
                )}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Disc label and description */}
              <div className="flex-1 text-left">
                <span className={cn('text-sm font-medium', isPrimary && 'font-bold')}>
                  {level}
                </span>
                <span
                  className={cn(
                    'block text-xs mt-0.5',
                    isSelected ? 'text-background/70' : 'text-muted-foreground'
                  )}
                >
                  {DISC_LEVEL_CONTENT[level as keyof typeof DISC_LEVEL_CONTENT]}
                </span>
              </div>

              {/* Primary star toggle - using span instead of button to avoid nested button HTML error */}
              {isSelected && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => togglePrimary(level, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePrimary(level, e as unknown as React.MouseEvent);
                    }
                  }}
                  className={cn(
                    'p-1 rounded-sm transition-colors duration-100 cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-background',
                    isPrimary
                      ? 'text-yellow-400'
                      : 'text-background/50 hover:text-background/80'
                  )}
                  title={isPrimary ? 'Primary disc' : 'Set as primary'}
                >
                  <Star
                    className="w-4 h-4"
                    fill={isPrimary ? 'currentColor' : 'none'}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Validation hints */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {primaryDisc && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
              Primary: {primaryDisc.level}
            </span>
          )}
          {value.length > 1 && (
            <span className="text-muted-foreground">
              Secondary: {value.filter((d) => d.role === 'secondary').map((d) => d.level).join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
