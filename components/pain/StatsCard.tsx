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
        <div className={cn('text-center', className)}>
            <p className="text-label mb-1">{label}</p>
            <p className={cn('text-4xl font-semibold tabular-nums', valueColorClass)}>
                {value}
            </p>
        </div>
    );
}
