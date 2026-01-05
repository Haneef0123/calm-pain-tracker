import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PainTypeInfoButton, PainTypeInfoSheet, PAIN_TYPE_INFO } from './PainTypeInfo';

interface ChipSelectProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  showInfoIcons?: boolean;
}

export function ChipSelect({ options, selected, onChange, label, showInfoIcons = false }: ChipSelectProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [activePainType, setActivePainType] = useState<string | null>(null);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleInfoOpen = (option: string) => {
    setActivePainType(option);
    setInfoOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        <span className="text-label">{label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            const hasInfo = showInfoIcons && PAIN_TYPE_INFO[option];
            return (
              <div key={option} className="inline-flex items-center">
                <button
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
                {hasInfo && (
                  <PainTypeInfoButton 
                    painType={option} 
                    onOpen={() => handleInfoOpen(option)} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <PainTypeInfoSheet 
        painType={activePainType}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </>
  );
}
