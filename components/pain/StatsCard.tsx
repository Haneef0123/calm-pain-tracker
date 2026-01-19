'use client';

import { cn, getPainLevelClass } from '@/lib/utils';

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
    const valueColorClass = showPainColor ? getPainLevelClass(value) : 'text-foreground';

    return (
        <div className={cn('text-center flex flex-col', className)}>
            <p className="text-label mb-2 min-h-[2.5rem] flex items-center justify-center">{label}</p>
            <p className={cn('text-4xl font-semibold tabular-nums', valueColorClass)}>
                {value}
            </p>
        </div>
    );
}
