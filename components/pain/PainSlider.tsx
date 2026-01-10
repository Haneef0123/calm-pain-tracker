'use client';

import { cn } from '@/lib/utils';

interface PainSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function PainSlider({ value, onChange }: PainSliderProps) {
  const ticks = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Ruler ticks */}
      <div className="relative h-8 flex items-end justify-between px-1">
        {ticks.map((tick) => (
          <div key={tick} className="flex flex-col items-center">
            <div
              className={cn(
                'w-px bg-foreground transition-all duration-100',
                tick % 5 === 0 ? 'h-4' : 'h-2',
                tick === value && 'bg-foreground h-6 w-0.5'
              )}
            />
          </div>
        ))}
      </div>

      {/* Slider track */}
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-border rounded-none appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-foreground
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:duration-100
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-foreground
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
      />

      {/* Number labels */}
      <div className="flex justify-between px-0.5">
        {ticks.map((tick) => (
          <span
            key={tick}
            className={cn(
              'text-xs tabular-nums transition-all duration-100',
              tick === value
                ? 'font-semibold text-foreground'
                : 'font-light text-muted-foreground'
            )}
          >
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}
