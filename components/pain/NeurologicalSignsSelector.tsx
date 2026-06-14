'use client';

import { cn } from '@/lib/utils';
import {
  type SpineRegion,
  getNeuroSignsForRegion,
  NEUROLOGICAL_SIGN_LABELS,
  type NeurologicalSign,
} from '@/types/pain-entry';

interface NeurologicalSignsSelectorProps {
  spineRegion: SpineRegion;
  value: string[];
  onChange: (value: string[]) => void;
}

export function NeurologicalSignsSelector({
  spineRegion,
  value,
  onChange,
}: NeurologicalSignsSelectorProps) {
  const neuroSignOptions = getNeuroSignsForRegion(spineRegion);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="space-y-3">
      <span className="text-label text-[#1c211d]">Any of these signs?</span>
      <div className="flex flex-wrap gap-2">
        {neuroSignOptions.map((option) => {
          const isSelected = value.includes(option);
          const label = NEUROLOGICAL_SIGN_LABELS[option as NeurologicalSign];

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
