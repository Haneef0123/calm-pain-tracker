import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { PainTypeAllInfoSheet } from './PainTypeInfo';

interface ChipSelectProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  showInfoIcon?: boolean;
}

export function ChipSelect({ options, selected, onChange, label, showInfoIcon = false }: ChipSelectProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-label">{label}</span>
          {showInfoIcon && (
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="inline-flex items-center justify-center w-4 h-4 text-secondary hover:text-foreground transition-colors duration-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground rounded-full"
              aria-label="More information about pain types"
            >
              <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected.includes(option);
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
                {option}
              </button>
            );
          })}
        </div>
      </div>
      
      {showInfoIcon && (
        <PainTypeAllInfoSheet open={infoOpen} onOpenChange={setInfoOpen} />
      )}
    </>
  );
}
