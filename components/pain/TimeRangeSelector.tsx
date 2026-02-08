'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimeRange = '7d' | '30d' | 'all';

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (value: TimeRange) => void;
    lockedValues?: TimeRange[];
    onLockedSelect?: (value: TimeRange) => void;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'all', label: 'All time' },
];

export function TimeRangeSelector({
    value,
    onChange,
    lockedValues = [],
    onLockedSelect,
}: TimeRangeSelectorProps) {
    return (
        <div className="flex gap-2">
            {TIME_RANGE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                        if (lockedValues.includes(option.value)) {
                            onLockedSelect?.(option.value);
                            return;
                        }

                        onChange(option.value);
                    }}
                    className={cn(
                        'px-4 py-2 text-sm rounded-sm border transition-all duration-100 inline-flex items-center gap-1.5',
                        value === option.value
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-transparent text-foreground border-border hover:border-foreground'
                    )}
                >
                    {option.label}
                    {lockedValues.includes(option.value) ? <Lock className="w-3.5 h-3.5" /> : null}
                </button>
            ))}
        </div>
    );
}
