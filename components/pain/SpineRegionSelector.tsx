'use client';

import { cn } from '@/lib/utils';
import type { SpineRegion } from '@/types/pain-entry';

interface SpineRegionSelectorProps {
  value: SpineRegion | null;
  onChange: (value: SpineRegion) => void;
  required?: boolean;
}

const SPINE_REGION_CONTENT = {
  cervical: {
    label: 'Neck',
    description: 'Upper spine',
  },
  lumbar: {
    label: 'Lower back',
    description: 'Lower spine',
  },
} as const;

export function SpineRegionSelector({
  value,
  onChange,
  required = false,
}: SpineRegionSelectorProps) {
  return (
    <div className="rounded-[18px] border border-black/5 bg-white px-4 pb-[14px] pt-4 shadow-[0_1px_2px_rgba(12,12,12,0.05)]">
      <div className="space-y-3">
        <span className="block text-[13px] text-muted-foreground">
          Where is your pain?
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
        <div className="flex rounded-full bg-[#eef1ee] p-1">
          {(['cervical', 'lumbar'] as const).map((region) => {
            const isSelected = value === region;
            const content = SPINE_REGION_CONTENT[region];

            return (
              <button
                key={region}
                type="button"
                onClick={() => onChange(region)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-px rounded-full px-2 py-[9px] text-center transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset',
                  isSelected
                    ? 'bg-white text-[#262626] shadow-[0_1px_4px_rgba(12,12,12,0.12)]'
                    : 'bg-transparent text-[#777777] hover:bg-white/50'
                )}
              >
                <span className="block text-[14px] font-semibold">{content.label}</span>
                <span className="block text-[11px] text-[#9aa09a]">
                  {content.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
