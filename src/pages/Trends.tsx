import { useState, useMemo } from 'react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

type TimeRange = '7d' | '30d' | 'all';

export default function Trends() {
  const { entries } = usePainEntries();
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

  const getPainClass = (level: number) => {
    if (level <= 3) return 'text-foreground';
    if (level <= 6) return 'text-foreground';
    return 'text-destructive';
  };

  return (
    <PageLayout>
      <div className="pt-8 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-heading">Trends</h1>
        </header>

        {/* Time range selector */}
        <div className="flex gap-2 mb-8">
          {(['7d', '30d', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-4 py-2 text-sm rounded-sm border transition-all duration-100',
                range === r
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-foreground border-border hover:border-foreground'
              )}
            >
              {r === '7d' ? '7 days' : r === '30d' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No data yet.</p>
            <p className="text-label mt-2">Start tracking to see trends.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="text-center">
                <p className="text-label mb-1">Average</p>
                <p className={cn('text-4xl font-semibold tabular-nums', getPainClass(stats.avg))}>
                  {stats.avg}
                </p>
              </div>
              <div className="text-center">
                <p className="text-label mb-1">Worst</p>
                <p className={cn('text-4xl font-semibold tabular-nums', getPainClass(stats.worst))}>
                  {stats.worst}
                </p>
              </div>
              <div className="text-center">
                <p className="text-label mb-1">Best</p>
                <p className={cn('text-4xl font-semibold tabular-nums', getPainClass(stats.best))}>
                  {stats.best}
                </p>
              </div>
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
              <p className="text-center text-muted-foreground py-8">
                Need at least 2 entries to show a chart.
              </p>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
