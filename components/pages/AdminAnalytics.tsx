'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';

interface AnalyticsSnapshot {
  timeZone: string;
  generatedAt: string;
  totals: {
    users: number;
  };
  signups: {
    d1: number;
    d7: number;
    d30: number;
  };
  activeUsers: {
    d1: number;
    d7: number;
    d30: number;
  };
  painEntries: {
    d1: number;
    d7: number;
    d30: number;
  };
  derived: {
    entriesPerActiveUser30d: number;
  };
}

function SmallMetric({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: number | string;
  subtle?: boolean;
}) {
  return (
    <div className="rounded-sm border border-border bg-card px-4 py-3">
      <p className="text-label mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${subtle ? 'text-muted-foreground' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const response = await fetch(`/api/admin/analytics?tz=${encodeURIComponent(localTimeZone)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Not found');
          setData(null);
          return;
        }
        throw new Error(`Request failed (${response.status})`);
      }

      const json = (await response.json()) as AnalyticsSnapshot;
      setData(json);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Failed to load analytics';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageLayout>
      <div className="pt-8 animate-fade-in">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-heading">Admin analytics</h1>
            <p className="text-label mt-1">
              Local timezone: {data?.timeZone ?? '...'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </header>

        {error ? (
          <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">Could not load analytics: {error}</p>
          </div>
        ) : null}

        {loading && !data ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 rounded-sm bg-muted" />
              <div className="h-20 rounded-sm bg-muted" />
              <div className="h-20 rounded-sm bg-muted" />
            </div>
            <div className="h-28 rounded-sm bg-muted" />
            <div className="h-28 rounded-sm bg-muted" />
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <section className="mb-7">
              <p className="text-label mb-3">Signups (local calendar windows)</p>
              <div className="grid grid-cols-3 gap-3">
                <SmallMetric label="1 day" value={data.signups.d1} />
                <SmallMetric label="7 days" value={data.signups.d7} />
                <SmallMetric label="30 days" value={data.signups.d30} />
              </div>
            </section>

            <section className="mb-7">
              <p className="text-label mb-3">Activity and usage</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <SmallMetric label="Active users 1d" value={data.activeUsers.d1} />
                <SmallMetric label="Active users 7d" value={data.activeUsers.d7} />
                <SmallMetric label="Active users 30d" value={data.activeUsers.d30} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <SmallMetric label="Entries 1d" value={data.painEntries.d1} subtle />
                <SmallMetric label="Entries 7d" value={data.painEntries.d7} subtle />
                <SmallMetric label="Entries 30d" value={data.painEntries.d30} subtle />
              </div>
            </section>

            <section className="mb-4 grid grid-cols-2 gap-3">
              <SmallMetric label="Total users" value={data.totals.users} subtle />
              <SmallMetric
                label="Entries / active user (30d)"
                value={data.derived.entriesPerActiveUser30d}
                subtle
              />
            </section>

            <p className="text-label">
              Updated {new Date(data.generatedAt).toLocaleString()}
            </p>
          </>
        ) : null}
      </div>
    </PageLayout>
  );
}
