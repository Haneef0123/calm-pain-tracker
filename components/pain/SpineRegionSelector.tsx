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
    label: 'Cervical',
    description: 'Neck (C2-C7)',
  },
  lumbar: {
    label: 'Lumbar',
    description: 'Lower back (L1-S1)',
  },
} as const;

export function SpineRegionSelector({
  value,
  onChange,
  required = false,
}: SpineRegionSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-label">
          Spine Region
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
      </div>
      <div className="flex rounded-sm border border-border overflow-hidden">
        {(['cervical', 'lumbar'] as const).map((region) => {
          const isSelected = value === region;
          const content = SPINE_REGION_CONTENT[region];

          return (
            <button
              key={region}
              type="button"
              onClick={() => onChange(region)}
              className={cn(
                'flex-1 py-3 px-4 text-center transition-all duration-100',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset',
                isSelected
                  ? 'bg-foreground text-background'
                  : 'bg-transparent text-foreground hover:bg-muted'
              )}
            >
              <span className="block text-sm font-medium">{content.label}</span>
              <span
                className={cn(
                  'block text-xs mt-0.5',
                  isSelected ? 'text-background/70' : 'text-muted-foreground'
                )}
              >
                {content.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
