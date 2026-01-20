'use client';

import { useState, useMemo } from 'react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { StatsCard } from '@/components/pain/StatsCard';
import { TimeRangeSelector, type TimeRange } from '@/components/pain/TimeRangeSelector';
import type { PainEntry } from '@/types/pain-entry';

interface TrendsProps {
    initialEntries: PainEntry[];
}

export default function Trends({ initialEntries }: TrendsProps) {
    const { entries } = usePainEntries(initialEntries);
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
        return [...filteredEntries]
            .reverse()
            .map(entry => ({
                date: format(parseISO(entry.timestamp), 'MMM d'),
                pain: entry.painLevel,
            }));
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

                        <div className="divider mb-8" />

                        {/* Chart */}
                        {chartData.length > 1 ? (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={[0, 10]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            ticks={[0, 5, 10]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                            }}
                                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="pain"
                                            stroke="hsl(var(--foreground))"
                                            strokeWidth={1.5}
                                            dot={{ r: 3, fill: 'hsl(var(--foreground))' }}
                                            activeDot={{ r: 5 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
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
