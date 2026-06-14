'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, subDays, isAfter, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import { ComposedChart, Area, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatsCard } from '@/components/pain/StatsCard';
import { TimeRangeSelector, type TimeRange } from '@/components/pain/TimeRangeSelector';
import type { PainEntry } from '@/types/pain-entry';
import {
  isDiscEntry,
  getPrimaryDisc,
  getSecondaryDiscs,
  getSensationLabel,
} from '@/types/pain-entry';
import { getPainColor, getPainLevelVisuals } from '@/lib/utils';

const PAGE_CONTENT = {
  title: 'Patterns',
  emptyState: 'Your first trend appears after 3 check-ins.',
  chartEmptyState: 'Patterns need time. A few more days will make this clearer.',
  ranges: {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    'all': 'All time',
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
  locations: string[];
  types: string[];
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
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange);
  };

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
        if (isToday(date)) {
          dateLabel = format(date, 'h:mm a');
        } else if (isYesterday(date)) {
          dateLabel = `Yesterday ${format(date, 'h:mm a')}`;
        } else {
          dateLabel = format(date, 'MMM d, h:mm a');
        }
      } else {
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

      const isDisc = isDiscEntry(entry);
      const primaryDisc = isDisc ? getPrimaryDisc(entry) : null;
      const secondaryDiscs = isDisc ? getSecondaryDiscs(entry) : [];

      return {
        date: dateLabel,
        fullDate: format(date, 'MMM d, yyyy · h:mm a'),
        pain: entry.painLevel,
        timestamp: entry.timestamp,
        locations: entry.locations,
        types: entry.types,
        spineRegion: isDisc ? entry.spineRegion : null,
        primaryDisc: primaryDisc?.level,
        secondaryDiscs: secondaryDiscs.map(d => d.level),
        sensations: isDisc ? entry.sensations : undefined,
        radiation: isDisc ? entry.radiation : undefined,
        notes: entry.notes,
      };
    });
  }, [filteredEntries]);

  useEffect(() => {
    if (chartData.length === 0) {
      setSelectedPoint(null);
      return;
    }

    setSelectedPoint((current) => {
      if (current && chartData.some((point) => point.timestamp === current.timestamp)) {
        return current;
      }

      return chartData[chartData.length - 1];
    });
  }, [chartData]);

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

  if (!isLoaded) {
    return (
      <PageLayout>
        <div className="pt-7 pb-6 flex flex-col gap-[14px]">
          <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-[#1c211d]">
            {PAGE_CONTENT.title}
          </h1>
          <div className="animate-pulse flex flex-col gap-[14px]">
            <div className="h-10 rounded-[18px] bg-muted" />
            <div className="grid grid-cols-3 gap-[10px]">
              <div className="h-20 bg-muted rounded-[18px]" />
              <div className="h-20 bg-muted rounded-[18px]" />
              <div className="h-20 bg-muted rounded-[18px]" />
            </div>
            <div className="h-64 bg-muted rounded-[18px]" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pt-7 pb-6 flex flex-col gap-[14px]">
        <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-[#1c211d]">
          {PAGE_CONTENT.title}
        </h1>

        <TimeRangeSelector value={range} onChange={handleRangeChange} />

        {entries.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-[#8a908b]">{PAGE_CONTENT.emptyState}</p>
            <Link
              href="/"
              className="inline-block text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
            >
              Log now (10s) →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-[10px]">
              <StatsCard label="AVERAGE" value={stats.avg} />
              <StatsCard label="WORST" value={stats.worst} />
              <StatsCard label="BEST" value={stats.best} />
            </div>

            {chartData.length > 1 ? (
              <div className="bg-white rounded-[18px] pt-[18px] px-[14px] pb-[14px] shadow-[0_1px_2px_rgba(12,12,12,0.05)] flex flex-col gap-2">
                <div className="flex items-center justify-between px-[6px]">
                  <h2 className="text-[14px] font-semibold text-[#1c211d]">Pain level</h2>
                  <p className="text-[12px] text-[#ababab]">{rangeLabel}</p>
                </div>
                <div className="h-64 md:h-80" role="img" aria-label={`Pain level chart showing ${chartData.length} entries`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#008391" stopOpacity={0.16} />
                          <stop offset="100%" stopColor="#008391" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray=""
                        stroke="#eef1ee"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10.5, fill: '#919191' }}
                        interval="preserveStartEnd"
                        height={40}
                      />
                      <YAxis
                        domain={[0, 10]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#ababab' }}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        width={30}
                      />
                      <Area
                        type="monotone"
                        dataKey="pain"
                        fill="url(#areaGradient)"
                        stroke="none"
                        dot={false}
                        activeDot={false}
                        animationDuration={300}
                      />
                      <Line
                        type="monotone"
                        dataKey="pain"
                        stroke="#008391"
                        strokeWidth={2.5}
                        dot={(props: { cx?: number; cy?: number; payload?: ChartDataPoint }) => {
                          const { cx, cy, payload } = props;
                          if (cx === undefined || cy === undefined || !payload) return <g key="empty" />;
                          const color = getPainColor(payload.pain);
                          const isSelected = payload.timestamp === selectedPoint?.timestamp;
                          return (
                            <g key={payload.timestamp}>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={13}
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedPoint(payload)}
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isSelected ? 6 : 4}
                                fill={color}
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            </g>
                          );
                        }}
                        activeDot={false}
                        animationDuration={300}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {selectedPoint ? (
                  <SelectedPointDetail point={selectedPoint} />
                ) : null}

                <p className="text-[11.5px] text-[#ababab] text-center">
                  Tap points for details
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-[18px] shadow-[0_1px_2px_rgba(12,12,12,0.05)] p-8 text-center">
                <p className="text-[#8a908b]">{PAGE_CONTENT.chartEmptyState}</p>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}

function SelectedPointDetail({ point }: { point: ChartDataPoint }) {
  const color = getPainColor(point.pain);
  const visuals = getPainLevelVisuals(point.pain);
  const dateStr = format(parseISO(point.timestamp), 'MMM d, yyyy · h:mm a');

  const metaParts: string[] = [];
  if (point.primaryDisc) metaParts.push(point.primaryDisc);
  if (point.spineRegion) {
    metaParts.push(point.spineRegion.charAt(0).toUpperCase() + point.spineRegion.slice(1));
  }
  const metaStr = metaParts.length > 0
    ? metaParts.join(' · ')
    : (point.sensations?.map(getSensationLabel).join(', ') || '—');

  return (
    <div className="bg-[#f7f9f7] rounded-[14px] px-[14px] py-[12px] flex items-center gap-3 mt-0.5">
      <span
        className="font-mono text-[26px] font-semibold leading-none"
        style={{ color }}
      >
        {point.pain}
      </span>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-[#1c211d] truncate">{dateStr}</span>
        <span className="text-[12px] text-[#777777] truncate">{metaStr}</span>
      </div>
      <span
        className="px-[11px] py-1 rounded-full text-[12px] font-semibold shrink-0"
        style={{ background: visuals.surface, color: visuals.accent }}
      >
        {visuals.severity}
      </span>
    </div>
  );
}
