'use client';

import { FormEvent, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { usePaywall } from '@/hooks/use-paywall';
import { toast } from '@/hooks/use-toast';
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog';
import { ShareReportDialog } from '@/components/reports/ShareReportDialog';
import { trackClientEvent } from '@/lib/analytics/client';

interface CreateReportResponse {
  reportId: string;
  shareToken: string;
  shareUrl: string;
}

function defaultDateRange() {
  const end = new Date();
  const start = subDays(end, 30);

  return {
    dateStart: format(start, 'yyyy-MM-dd'),
    dateEnd: format(end, 'yyyy-MM-dd'),
  };
}

export function ReportGenerator() {
  const paywall = usePaywall('doctor_report');
  const initialRange = useMemo(() => defaultDateRange(), []);
  const [title, setTitle] = useState('Doctor Summary');
  const [dateStart, setDateStart] = useState(initialRange.dateStart);
  const [dateEnd, setDateEnd] = useState(initialRange.dateEnd);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const requestPayload = {
    title,
    dateStart,
    dateEnd,
    expiresInDays,
    password: password.trim() || undefined,
  };

  const handleCreateShare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!paywall.allowed) {
      await trackClientEvent('paywall_viewed', {
        feature: 'doctor_report',
      });
      setIsUpgradeOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Unable to create report.');
      }

      const data = payload as CreateReportResponse;
      setShareUrl(data.shareUrl);
      setIsShareOpen(true);

      toast({
        title: 'Report generated',
        description: 'Your shareable report link is ready.',
      });
    } catch (error) {
      toast({
        title: 'Report generation failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!paywall.allowed) {
      await trackClientEvent('paywall_viewed', {
        feature: 'doctor_report_pdf',
      });
      setIsUpgradeOpen(true);
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateStart,
          dateEnd,
          template: 'summary',
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error?.message || 'Unable to generate PDF.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pain-report-${dateStart}-to-${dateEnd}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF downloaded',
        description: 'Doctor-ready PDF exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'PDF export failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <section className="rounded-sm border border-border bg-card p-4 space-y-4">
        <header>
          <h2 className="text-sm font-medium">Doctor-ready report</h2>
          <p className="text-label">Create a summary your clinician can review in minutes.</p>
        </header>

        <form className="space-y-3" onSubmit={handleCreateShare}>
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              placeholder="January Summary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Date start</label>
              <input
                type="date"
                value={dateStart}
                onChange={(event) => setDateStart(event.target.value)}
                className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Date end</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
                className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Link expiry (days)</label>
              <select
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(Number(event.target.value))}
                className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Optional password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          {!paywall.allowed ? (
            <p className="text-xs text-muted-foreground">{paywall.reason}</p>
          ) : null}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Create share link'}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
            </Button>
          </div>
        </form>
      </section>

      <ShareReportDialog open={isShareOpen} onOpenChange={setIsShareOpen} shareUrl={shareUrl} />
      <UpgradeDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} title="Upgrade to create reports" description={paywall.reason || 'Pro is required to generate reports.'} />
    </>
  );
}
