'use client';

import { cn } from '@/lib/utils';

export type TimeRange = '7d' | '30d' | 'all';

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (value: TimeRange) => void;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'all', label: 'All time' },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
    return (
        <div className="flex gap-2">
            {TIME_RANGE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'px-4 py-2 text-sm rounded-sm border transition-all duration-100',
                        value === option.value
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-transparent text-foreground border-border hover:border-foreground'
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
