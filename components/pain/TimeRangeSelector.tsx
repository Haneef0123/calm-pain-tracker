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
        <div className="flex bg-[#eaeeea] rounded-full p-1 gap-1">
            {TIME_RANGE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'flex-1 rounded-full py-[9px] px-2 text-[13px] font-semibold transition-all duration-150 border-none',
                        value === option.value
                            ? 'bg-white text-[#1c211d] shadow-[0_1px_2px_rgba(12,12,12,0.08)]'
                            : 'bg-transparent text-[#6b716c]'
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
