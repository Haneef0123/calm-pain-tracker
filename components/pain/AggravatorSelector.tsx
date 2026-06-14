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
      <span className="text-label text-[#1c211d]">What makes it worse?</span>
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
                'rounded-full border px-[14px] py-2 text-[13px] font-medium transition-all duration-150',
                isSelected
                  ? 'border-[#181b19] bg-[#181b19] text-white'
                  : 'border-[#e1e4e1] bg-white text-[#3b3b3b] hover:border-[#181b19]'
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
