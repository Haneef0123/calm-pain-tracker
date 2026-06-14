'use client';

import { cn } from '@/lib/utils';
import {
  type SpineRegion,
  getRadiationOptionsForRegion,
  RADIATION_LABELS,
  type CervicalRadiation,
  type LumbarRadiation,
} from '@/types/pain-entry';

interface RadiationSelectorProps {
  spineRegion: SpineRegion;
  value: string[];
  onChange: (value: string[]) => void;
}

export function RadiationSelector({
  spineRegion,
  value,
  onChange,
}: RadiationSelectorProps) {
  const radiationOptions = getRadiationOptionsForRegion(spineRegion);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const regionLabel = spineRegion === 'cervical' ? 'Upper body' : 'Lower body';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-label text-[#1c211d]">Does it travel anywhere?</span>
        <span className="text-xs text-[#ababab]">{regionLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {radiationOptions.map((option) => {
          const isSelected = value.includes(option);
          const label = RADIATION_LABELS[option as CervicalRadiation | LumbarRadiation];

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
