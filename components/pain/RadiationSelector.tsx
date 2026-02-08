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
      <div className="flex items-center justify-between">
        <span className="text-label">Radiation Path</span>
        <span className="text-xs text-muted-foreground">{regionLabel}</span>
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
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {spineRegion === 'cervical'
            ? 'Pain radiating from neck follows C5-C7 nerve roots'
            : 'Pain radiating from lower back follows sciatic nerve (L4-S1)'}
        </p>
      )}
    </div>
  );
}
