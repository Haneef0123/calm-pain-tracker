'use client';

import { useState, useMemo } from 'react';
import { format, subDays, isAfter, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { StatsCard } from '@/components/pain/StatsCard';
import { TimeRangeSelector, type TimeRange } from '@/components/pain/TimeRangeSelector';
import type { PainEntry } from '@/types/pain-entry';
import {
  isDiscEntry,
  getPrimaryDisc,
  getSecondaryDiscs,
  getSensationLabel,
  getRadiationLabel,
} from '@/types/pain-entry';
import { Star } from 'lucide-react';

// Content separated from JSX
const PAGE_CONTENT = {
  title: 'Patterns',
  emptyState: 'Once you log a few days, patterns will start to appear here.',
  chartEmptyState: 'Patterns need time. A few more days will make this clearer.',
  chartTitle: 'Pain Level',
  chartHint: 'Lines connect recorded entries • Tap points for details',
  stats: {
    average: 'Average',
    worst: 'Worst',
    best: 'Best',
  },
  ranges: {
    '7d': 'last 7 days',
    '30d': 'last 30 days',
    'all': 'all time',
  },
} as const;

interface TrendsProps {
  initialEntries: PainEntry[];
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  pain: number;
  timestamp: string;
  // Legacy format
  locations: string[];
  types: string[];
  // New disc-focused format
  spineRegion?: string | null;
  primaryDisc?: string;
  secondaryDiscs?: string[];
  sensations?: string[];
  radiation?: string[];
  notes: string;
}

export default function Trends({ initialEntries }: TrendsProps) {
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

      // Extract disc-focused data if available
      const isDisc = isDiscEntry(entry);
      const primaryDisc = isDisc ? getPrimaryDisc(entry) : null;
      const secondaryDiscs = isDisc ? getSecondaryDiscs(entry) : [];

      return {
        date: dateLabel,
        fullDate: format(date, 'MMM d, yyyy h:mm a'),
        pain: entry.painLevel,
        timestamp: entry.timestamp,
        // Legacy data
        locations: entry.locations,
        types: entry.types,
        // Disc-focused data
        spineRegion: isDisc ? entry.spineRegion : null,
        primaryDisc: primaryDisc?.level,
        secondaryDiscs: secondaryDiscs.map(d => d.level),
        sensations: isDisc ? entry.sensations : undefined,
        radiation: isDisc ? entry.radiation : undefined,
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

  const rangeLabel = PAGE_CONTENT.ranges[range];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ChartDataPoint }[] }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const painLevel = data.pain;
    const painColorClass = painLevel <= 6 ? 'text-foreground' : 'text-destructive';
    const hasDiscData = data.spineRegion !== null && data.spineRegion !== undefined;

    return (
      <div className="bg-card border border-border rounded-sm p-3 shadow-lg max-w-[280px]">
        <p className="text-xs text-muted-foreground mb-2">{data.fullDate}</p>
        <p className={`text-2xl font-semibold tabular-nums mb-2 ${painColorClass}`}>
          {painLevel}
        </p>

        {hasDiscData ? (
          // Disc-focused tooltip
          <>
            {/* Spine region */}
            <p className="text-xs text-muted-foreground mb-1 capitalize">
              <span className="font-medium">{data.spineRegion}</span> spine
            </p>

            {/* Primary disc */}
            {data.primaryDisc && (
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                <span className="font-medium">Primary:</span> {data.primaryDisc}
              </p>
            )}

            {/* Secondary discs */}
            {data.secondaryDiscs && data.secondaryDiscs.length > 0 && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">Secondary:</span> {data.secondaryDiscs.join(', ')}
              </p>
            )}

            {/* Sensations */}
            {data.sensations && data.sensations.length > 0 && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">Sensations:</span>{' '}
                {data.sensations.map(getSensationLabel).join(', ')}
              </p>
            )}

            {/* Radiation */}
            {data.radiation && data.radiation.length > 0 && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">Radiation:</span>{' '}
                {data.radiation.map(getRadiationLabel).join(' → ')}
              </p>
            )}
          </>
        ) : (
          // Legacy tooltip
          <>
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
          </>
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
  const CustomDot = (props: { cx?: number; cy?: number; payload?: { pain: number } }) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;

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
            <h1 className="text-heading">{PAGE_CONTENT.title}</h1>
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
          <h1 className="text-heading">{PAGE_CONTENT.title}</h1>
        </header>

        {/* Time range selector */}
        <div className="mb-8">
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{PAGE_CONTENT.emptyState}</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <StatsCard label={PAGE_CONTENT.stats.average} value={stats.avg} />
              <StatsCard label={PAGE_CONTENT.stats.worst} value={stats.worst} />
              <StatsCard label={PAGE_CONTENT.stats.best} value={stats.best} />
            </div>

            <p className="text-xs text-muted-foreground text-center mb-6">
              Showing {rangeLabel}
            </p>

            {/* Chart */}
            {chartData.length > 1 ? (
              <div className="bg-card border border-border rounded-sm p-4 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {PAGE_CONTENT.chartTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {chartData.length} {chartData.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <div className="h-64 md:h-80" role="img" aria-label={`Pain level chart showing ${chartData.length} entries over ${rangeLabel}`}>
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
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
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
                  {PAGE_CONTENT.chartHint}
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-sm p-8 text-center">
                <p className="text-muted-foreground">{PAGE_CONTENT.chartEmptyState}</p>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
