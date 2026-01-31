'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    CartesianGrid,
} from 'recharts';

interface ChartDataPoint {
    date: string;
    fullDate: string;
    pain: number;
    timestamp: string;
    locations: string[];
    types: string[];
    notes: string;
}

export function TrendsChart({
    chartData,
    rangeLabel,
    CustomTooltip,
    CustomDot,
}: {
    chartData: ChartDataPoint[];
    rangeLabel: string;
    CustomTooltip: any;
    CustomDot: any;
}) {
    return (
        <div className="bg-card border border-border rounded-sm p-4 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground">Pain Level</h2>
                <p className="text-xs text-muted-foreground">
                    {chartData.length} {chartData.length === 1 ? 'entry' : 'entries'}
                </p>
            </div>
            <div
                className="h-64 md:h-80"
                role="img"
                aria-label={`Pain level chart showing ${chartData.length} entries over ${rangeLabel}`}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            vertical={false}
                            opacity={0.3}
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            interval="preserveStartEnd"
                            height={40}
                        />
                        <YAxis
                            domain={[0, 10]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            ticks={[0, 2, 4, 6, 8, 10]}
                            width={30}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="pain"
                            stroke="hsl(var(--foreground))"
                            strokeWidth={2}
                            dot={<CustomDot />}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                            animationDuration={300}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
                Lines connect recorded entries &bull; Tap points for details
            </p>
        </div>
    );
}
