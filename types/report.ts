import type { PainEntry } from '@/types/pain-entry';

export interface ReportSummary {
  avgPain: number;
  worst: number;
  best: number;
  entryCount: number;
}

export interface ReportPayload {
  title: string;
  dateStart: string;
  dateEnd: string;
  generatedAt: string;
  summary: ReportSummary;
  entries: PainEntry[];
}

export interface CreateReportRequest {
  dateStart: string;
  dateEnd: string;
  title?: string;
  expiresInDays?: number;
  password?: string;
}

export interface CreateReportResponse {
  reportId: string;
  shareToken: string;
  shareUrl: string;
}
