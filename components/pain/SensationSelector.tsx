'use client';

import { cn } from '@/lib/utils';
import { SENSATIONS, SENSATION_LABELS } from '@/types/pain-entry';

interface SensationSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function SensationSelector({ value, onChange }: SensationSelectorProps) {
  const toggleSensation = (sensation: string) => {
    if (value.includes(sensation)) {
      onChange(value.filter((s) => s !== sensation));
    } else {
      onChange([...value, sensation]);
    }
  };

  return (
    <div className="space-y-3">
      <span className="text-label text-[#1c211d]">What does it feel like?</span>
      <div className="flex flex-wrap gap-2">
        {SENSATIONS.map((sensation) => {
          const isSelected = value.includes(sensation);
          return (
            <button
              key={sensation}
              type="button"
              onClick={() => toggleSensation(sensation)}
              className={cn(
                'rounded-full border px-[14px] py-2 text-[13px] font-medium transition-all duration-150',
                isSelected
                  ? 'border-[#181b19] bg-[#181b19] text-white'
                  : 'border-[#e1e4e1] bg-white text-[#3b3b3b] hover:border-[#181b19]'
              )}
            >
              {SENSATION_LABELS[sensation]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
