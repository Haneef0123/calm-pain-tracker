'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
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
      <div className="flex items-center gap-2">
        <span className="text-label text-muted-foreground">Neurological Signs</span>
        <span className="text-xs text-muted-foreground">(optional)</span>
      </div>
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
                'px-3 py-1.5 text-sm rounded-sm border transition-all duration-100',
                isSelected
                  ? 'bg-destructive/20 text-destructive border-destructive'
                  : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-sm">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">
            Neurological symptoms may indicate nerve compression. Consider medical evaluation
            if symptoms persist or worsen.
          </p>
        </div>
      )}
    </div>
  );
}
