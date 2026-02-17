import { createAdminClient } from '@/lib/supabase/admin';

interface AuthUserEvent {
  id: string;
  created_at: string | null;
  last_sign_in_at: string | null;
}

interface EntryEvent {
  created_at: string;
}

export interface AnalyticsSnapshot {
  timeZone: string;
  generatedAt: string;
  totals: {
    users: number;
  };
  signups: {
    d1: number;
    d7: number;
    d30: number;
    trend30d: Array<{ date: string; count: number }>;
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
    trend30d: Array<{ date: string; count: number }>;
  };
  derived: {
    entriesPerActiveUser30d: number;
  };
}

function createAdminSupabaseClient() {
  return createAdminClient();
}

function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function createLocalDateKeyFormatter(timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (date: Date): string => {
    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      throw new Error('Failed to format local date key');
    }

    return `${year}-${month}-${day}`;
  };
}

function shiftDateKey(dateKey: string, dayDelta: number): string {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + dayDelta);
  return base.toISOString().slice(0, 10);
}

function isWithinLastNDays(eventDateKey: string, todayKey: string, days: number): boolean {
  const cutoffKey = shiftDateKey(todayKey, -(days - 1));
  return eventDateKey >= cutoffKey && eventDateKey <= todayKey;
}

function buildLastNDaysKeys(todayKey: string, days: number): string[] {
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(shiftDateKey(todayKey, -offset));
  }
  return keys;
}

async function listAllUsers() {
  const supabase = createAdminSupabaseClient();
  const users: AuthUserEvent[] = [];
  const perPage = 1000;
  const maxPages = 100;

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = data?.users ?? [];
    for (const user of batch) {
      users.push({
        id: user.id,
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
      });
    }

    if (batch.length < perPage) break;
  }

  return users;
}

async function listRecentEntryEvents(cutoffIso: string) {
  const supabase = createAdminSupabaseClient();
  const events: EntryEvent[] = [];
  const pageSize = 1000;
  const maxPages = 200;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('pain_entries')
      .select('created_at')
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const batch = (data ?? []) as EntryEvent[];
    events.push(...batch);

    if (batch.length < pageSize) break;
  }

  return events;
}

function countEventsByWindows(dateKeys: string[], todayKey: string) {
  let d1 = 0;
  let d7 = 0;
  let d30 = 0;

  for (const key of dateKeys) {
    if (isWithinLastNDays(key, todayKey, 1)) d1 += 1;
    if (isWithinLastNDays(key, todayKey, 7)) d7 += 1;
    if (isWithinLastNDays(key, todayKey, 30)) d30 += 1;
  }

  return { d1, d7, d30 };
}

function buildTrend(dateKeys: string[], todayKey: string) {
  const dayKeys = buildLastNDaysKeys(todayKey, 30);
  const counts = new Map<string, number>();

  for (const key of dayKeys) {
    counts.set(key, 0);
  }

  for (const key of dateKeys) {
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return dayKeys.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

export async function getAnalyticsSnapshot(timeZone: string): Promise<AnalyticsSnapshot> {
  const safeTimeZone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const toLocalDateKey = createLocalDateKeyFormatter(safeTimeZone);

  const now = new Date();
  const todayKey = toLocalDateKey(now);
  const entriesFetchCutoff = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

  const [users, entryEvents] = await Promise.all([
    listAllUsers(),
    listRecentEntryEvents(entriesFetchCutoff),
  ]);

  const signupDateKeys = users
    .map((user) => user.created_at)
    .filter((value): value is string => Boolean(value))
    .map((value) => toLocalDateKey(new Date(value)));

  const activeDateKeys = users
    .map((user) => user.last_sign_in_at)
    .filter((value): value is string => Boolean(value))
    .map((value) => toLocalDateKey(new Date(value)));

  const entryDateKeys = entryEvents.map((entry) => toLocalDateKey(new Date(entry.created_at)));

  const signups = countEventsByWindows(signupDateKeys, todayKey);
  const activeUsers = countEventsByWindows(activeDateKeys, todayKey);
  const painEntries = countEventsByWindows(entryDateKeys, todayKey);

  const entriesPerActiveUser30d =
    activeUsers.d30 > 0 ? Math.round((painEntries.d30 / activeUsers.d30) * 100) / 100 : 0;

  return {
    timeZone: safeTimeZone,
    generatedAt: now.toISOString(),
    totals: {
      users: users.length,
    },
    signups: {
      ...signups,
      trend30d: buildTrend(signupDateKeys, todayKey),
    },
    activeUsers,
    painEntries: {
      ...painEntries,
      trend30d: buildTrend(entryDateKeys, todayKey),
    },
    derived: {
      entriesPerActiveUser30d,
    },
  };
}
