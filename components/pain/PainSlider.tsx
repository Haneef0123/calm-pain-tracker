'use client';

import { getPainLevelVisuals } from '@/lib/utils';

interface PainSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function PainSlider({ value, onChange }: PainSliderProps) {
  const clampedValue = Math.min(10, Math.max(0, value));
  const visuals = getPainLevelVisuals(value);
  const progress = `${(clampedValue / 10) * 100}%`;
  const thumbLeft = `calc(12px + (100% - 24px) * ${clampedValue / 10})`;

  return (
    <div className="space-y-[6px]">
      <div className="relative h-[44px]">
        <div className="absolute inset-0 flex items-center">
          <div className="relative mx-3 h-2 w-full rounded-full bg-[var(--pain-track-bg)]">
            <div
              className="absolute left-0 top-0 h-2 rounded-full transition-[width] duration-150"
              style={{
                width: progress,
                backgroundColor: visuals.accent,
              }}
            />
          </div>
        </div>

        <div
          className="pointer-events-none absolute top-1/2 h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] bg-white shadow-[0_2px_6px_rgba(12,12,12,0.18)] transition-[left,border-color] duration-150"
          style={{
            left: thumbLeft,
            borderColor: visuals.accent,
          }}
        />

        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={clampedValue}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          aria-label="Pain level from 0 to 10"
          aria-valuetext={`${clampedValue} out of 10`}
          className="pain-slider-input absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none"
        />
      </div>

      <div className="-mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>0 · No pain</span>
        <span>10 · Worst</span>
      </div>
    </div>
  );
}
