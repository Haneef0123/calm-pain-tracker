'use client';

import { cn, getPainColor } from '@/lib/utils';

interface StatsCardProps {
    label: string;
    value: number;
    showPainColor?: boolean;
    className?: string;
}

export function StatsCard({
    label,
    value,
    showPainColor = true,
    className
}: StatsCardProps) {
    const valueColor = showPainColor ? getPainColor(value) : 'hsl(var(--foreground))';

    return (
        <div className={cn('bg-white rounded-2xl py-[14px] px-2 shadow-[0_1px_2px_rgba(12,12,12,0.05)] flex flex-col items-center gap-1', className)}>
            <p className="text-[11px] font-semibold tracking-[0.08em] text-[#919191]">{label}</p>
            <p
                className="font-mono text-[30px] font-semibold leading-none"
                style={{ color: valueColor }}
            >
                {value}
            </p>
        </div>
    );
}
