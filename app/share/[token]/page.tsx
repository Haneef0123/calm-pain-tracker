'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface SharedReportResponse {
  title: string;
  dateStart: string;
  dateEnd: string;
  summary: {
    avgPain: number;
    worst: number;
    best: number;
    entryCount: number;
  };
  entries: {
    id: string;
    timestamp: string;
    painLevel: number;
    locations: string[];
    types: string[];
    notes: string;
  }[];
}

export default function SharedReportPage() {
  const params = useParams<{ token: string }>();
  const [report, setReport] = useState<SharedReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);

  const fetchReport = useCallback(async (passwordValue?: string) => {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/reports/share/${params.token}`, {
      cache: 'no-store',
      headers: passwordValue
        ? {
            'x-report-password': passwordValue,
          }
        : undefined,
    });
    const payload = await response.json();

    if (!response.ok) {
      const code = payload?.error?.code;
      const message = payload?.error?.message || 'Unable to load report.';

      if (code === 'PASSWORD_REQUIRED') {
        setRequiresPassword(true);
      }

      setError(message);
      setReport(null);
      setIsLoading(false);
      return;
    }

    setRequiresPassword(false);
    setReport(payload as SharedReportResponse);
    setIsLoading(false);
  }, [params.token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchReport(password);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading report...</div>
        ) : null}

        {!isLoading && requiresPassword ? (
          <form onSubmit={handleSubmit} className="max-w-sm mx-auto rounded-sm border border-border bg-card p-5 space-y-4">
            <h1 className="text-lg font-semibold">Password required</h1>
            <p className="text-sm text-muted-foreground">This report is protected. Enter the password to continue.</p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
              placeholder="Password"
              required
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full">
              View report
            </Button>
          </form>
        ) : null}

        {!isLoading && error && !requiresPassword ? (
          <div className="max-w-xl mx-auto rounded-sm border border-border bg-card p-6 text-center">
            <h1 className="text-lg font-semibold mb-2">Report unavailable</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : null}

        {!isLoading && report ? (
          <div className="space-y-4">
            <header className="rounded-sm border border-border bg-card p-5">
              <h1 className="text-xl font-semibold">{report.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {report.dateStart} to {report.dateEnd}
              </p>
            </header>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-sm border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className="text-2xl font-semibold">{report.summary.avgPain}</p>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Worst</p>
                <p className="text-2xl font-semibold">{report.summary.worst}</p>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Best</p>
                <p className="text-2xl font-semibold">{report.summary.best}</p>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Entries</p>
                <p className="text-2xl font-semibold">{report.summary.entryCount}</p>
              </div>
            </section>

            <section className="rounded-sm border border-border bg-card p-5">
              <h2 className="text-sm font-medium mb-4">Timeline</h2>
              <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                {report.entries.map((entry) => (
                  <article key={entry.id} className="rounded-sm border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className="text-lg font-semibold">{entry.painLevel}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Locations: {entry.locations.join(', ') || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Types: {entry.types.join(', ') || 'N/A'}
                    </p>
                    {entry.notes ? <p className="text-sm mt-2">{entry.notes}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
