'use client';

import { useState, useMemo } from 'react';
import { format, subDays, isAfter, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import dynamic from 'next/dynamic';

const TrendsChart = dynamic(
    () => import('./TrendsChart').then((m) => m.TrendsChart),
    {
        ssr: false,
        loading: () => (
            <div className="bg-card border border-border rounded-sm p-4 mb-8 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded" />
                </div>
                <div className="h-64 md:h-80 bg-muted rounded-sm" />
            </div>
        ),
    }
);
import { StatsCard } from '@/components/pain/StatsCard';
import { TimeRangeSelector, type TimeRange } from '@/components/pain/TimeRangeSelector';
import type { PainEntry } from '@/types/pain-entry';

interface TrendsProps {
    initialEntries?: PainEntry[];
}

interface ChartDataPoint {
    date: string;
    fullDate: string;
    pain: number;
    timestamp: string;
    locations: string[];
    types: string[];
    notes: string;
}

export default function Trends({ initialEntries = [] }: TrendsProps) {
    const { entries, isLoaded } = usePainEntries(initialEntries);
    const [range, setRange] = useState<TimeRange>('7d');

    const filteredEntries = useMemo(() => {
        if (range === 'all') return entries;

        const days = range === '7d' ? 7 : 30;
        const cutoff = subDays(new Date(), days);

        return entries.filter(entry =>
            isAfter(parseISO(entry.timestamp), cutoff)
        );
    }, [entries, range]);

    const chartData = useMemo(() => {
        const reversed = [...filteredEntries].reverse();

        // Check if we have multiple entries on the same day
        const dateMap = new Map<string, number>();
        reversed.forEach(entry => {
            const dateKey = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        });
        const hasMultipleEntriesPerDay = Array.from(dateMap.values()).some(count => count > 1);

        return reversed.map((entry): ChartDataPoint => {
            const date = parseISO(entry.timestamp);
            let dateLabel: string;

            if (hasMultipleEntriesPerDay) {
                // Show time when multiple entries per day
                if (isToday(date)) {
                    dateLabel = format(date, 'h:mm a');
                } else if (isYesterday(date)) {
                    dateLabel = `Yesterday ${format(date, 'h:mm a')}`;
                } else {
                    dateLabel = format(date, 'MMM d, h:mm a');
                }
            } else {
                // Show relative dates when one entry per day
                if (isToday(date)) {
                    dateLabel = 'Today';
                } else if (isYesterday(date)) {
                    dateLabel = 'Yesterday';
                } else {
                    const daysAgo = differenceInDays(new Date(), date);
                    if (daysAgo <= 7) {
                        dateLabel = `${daysAgo}d ago`;
                    } else {
                        dateLabel = format(date, 'MMM d');
                    }
                }
            }

            return {
                date: dateLabel,
                fullDate: format(date, 'MMM d, yyyy h:mm a'),
                pain: entry.painLevel,
                timestamp: entry.timestamp,
                locations: entry.locations,
                types: entry.types,
                notes: entry.notes,
            };
        });
    }, [filteredEntries]);

    const stats = useMemo(() => {
        if (filteredEntries.length === 0) {
            return { avg: 0, worst: 0, best: 0 };
        }

        const levels = filteredEntries.map(e => e.painLevel);
        return {
            avg: Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10,
            worst: Math.max(...levels),
            best: Math.min(...levels),
        };
    }, [filteredEntries]);

    const rangeLabel = useMemo(() => {
        if (range === '7d') return 'last 7 days';
        if (range === '30d') return 'last 30 days';
        return 'all time';
    }, [range]);

    // Custom tooltip component
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload as ChartDataPoint;
        const painLevel = data.pain;
        const painColorClass = painLevel <= 6 ? 'text-foreground' : 'text-destructive';

        return (
            <div className="bg-card border border-border rounded-sm p-3 shadow-lg max-w-[240px]">
                <p className="text-xs text-muted-foreground mb-2">{data.fullDate}</p>
                <p className={`text-2xl font-semibold tabular-nums mb-2 ${painColorClass}`}>
                    {painLevel}
                </p>
                {data.locations.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium">Locations:</span> {data.locations.join(', ')}
                    </p>
                )}
                {data.types.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium">Types:</span> {data.types.join(', ')}
                    </p>
                )}
                {data.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                        &ldquo;{data.notes.slice(0, 60)}{data.notes.length > 60 ? '...' : ''}&rdquo;
                    </p>
                )}
            </div>
        );
    };

    // Custom dot component with color coding
    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        const painLevel = payload.pain;
        const color = painLevel <= 6 ? 'hsl(var(--foreground))' : 'hsl(var(--destructive))';

        return (
            <>
                {/* Larger invisible hit area for mobile */}
                <circle cx={cx} cy={cy} r={12} fill="transparent" style={{ cursor: 'pointer' }} />
                {/* Visible dot */}
                <circle cx={cx} cy={cy} r={4} fill={color} stroke="hsl(var(--background))" strokeWidth={1.5} />
            </>
        );
    };

    // Loading skeleton
    if (!isLoaded) {
        return (
            <PageLayout>
                <div className="pt-8 animate-fade-in">
                    <header className="mb-8">
                        <h1 className="text-heading">Patterns</h1>
                    </header>
                    <div className="animate-pulse">
                        <div className="h-10 bg-muted rounded-sm mb-8 w-80" />
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            <div className="h-20 bg-muted rounded-sm" />
                            <div className="h-20 bg-muted rounded-sm" />
                            <div className="h-20 bg-muted rounded-sm" />
                        </div>
                        <div className="h-64 bg-muted rounded-sm" />
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="pt-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-heading">Patterns</h1>
                </header>

                {/* Time range selector */}
                <div className="mb-8">
                    <TimeRangeSelector value={range} onChange={setRange} />
                </div>

                {entries.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">Once you log a few days, patterns will start to appear here.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            <StatsCard label="Average" value={stats.avg} />
                            <StatsCard label="Worst" value={stats.worst} />
                            <StatsCard label="Best" value={stats.best} />
                        </div>

                        <p className="text-xs text-muted-foreground text-center mb-6">
                            Showing {rangeLabel}
                        </p>

                        {/* Chart */}
                        {chartData.length > 1 ? (
                            <TrendsChart
                                chartData={chartData}
                                rangeLabel={rangeLabel}
                                CustomTooltip={CustomTooltip}
                                CustomDot={CustomDot}
                            />
                        ) : (
                            <div className="bg-card border border-border rounded-sm p-8 text-center">
                                <p className="text-muted-foreground">Patterns need time. A few more days will make this clearer.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageLayout>
    );
}
