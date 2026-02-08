import type { PainEntry } from '@/types/pain-entry';
import type { ReportPayload, ReportSummary } from '@/types/report';

export function buildReportSummary(entries: PainEntry[]): ReportSummary {
  if (entries.length === 0) {
    return {
      avgPain: 0,
      worst: 0,
      best: 0,
      entryCount: 0,
    };
  }

  const levels = entries.map((entry) => entry.painLevel);
  const total = levels.reduce((sum, level) => sum + level, 0);

  return {
    avgPain: Math.round((total / entries.length) * 10) / 10,
    worst: Math.max(...levels),
    best: Math.min(...levels),
    entryCount: entries.length,
  };
}

export function buildReportPayload(params: {
  title: string;
  dateStart: string;
  dateEnd: string;
  entries: PainEntry[];
}): ReportPayload {
  return {
    title: params.title,
    dateStart: params.dateStart,
    dateEnd: params.dateEnd,
    generatedAt: new Date().toISOString(),
    summary: buildReportSummary(params.entries),
    entries: params.entries,
  };
}
