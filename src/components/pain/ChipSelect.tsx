import { cn } from '@/lib/utils';

interface ChipSelectProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
}

export function ChipSelect({ options, selected, onChange, label }: ChipSelectProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      <span className="text-label">{label}</span>
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
  );
}
