'use client';

import { cn } from '@/lib/utils';
import {
  type SpineRegion,
  getAggravatorsForRegion,
  AGGRAVATOR_LABELS,
  type CommonAggravator,
  type CervicalAggravator,
  type LumbarAggravator,
} from '@/types/pain-entry';

interface AggravatorSelectorProps {
  spineRegion: SpineRegion;
  value: string[];
  onChange: (value: string[]) => void;
}

export function AggravatorSelector({
  spineRegion,
  value,
  onChange,
}: AggravatorSelectorProps) {
  const aggravatorOptions = getAggravatorsForRegion(spineRegion);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="space-y-3">
      <span className="text-label">Aggravating Positions</span>
      <div className="flex flex-wrap gap-2">
        {aggravatorOptions.map((option) => {
          const isSelected = value.includes(option);
          const label =
            AGGRAVATOR_LABELS[
              option as CommonAggravator | CervicalAggravator | LumbarAggravator
            ];

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-sm border transition-all duration-100',
                isSelected
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-foreground border-border hover:border-foreground'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
