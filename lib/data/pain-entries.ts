import { createClient } from '@supabase/supabase-js';
import { DbPainEntry, dbToClient, PainEntry } from '@/types/pain-entry';
import { unstable_cache } from 'next/cache';

interface GetPainEntriesOptions {
  limit?: number;
}

export async function getPainEntries(
  userId: string,
  accessToken: string,
  options: GetPainEntriesOptions = {}
): Promise<PainEntry[]> {
  const { limit = 100 } = options;

  return await unstable_cache(
    async () => {
      // Use direct Supabase client to avoid accessing cookies() inside cache
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );

      const { data } = await supabase
        .from('pain_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      return (data as DbPainEntry[] | null)?.map(dbToClient) ?? [];
    },
    ['pain-entries', userId, String(limit)],
    {
      tags: [`pain-entries-${userId}`],
      revalidate: 60, // Cache for 60 seconds
    }
  )();
}

export async function getPainEntriesCount(
  userId: string,
  accessToken: string
): Promise<number> {
  return await unstable_cache(
    async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );

      const { count } = await supabase
        .from('pain_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return count ?? 0;
    },
    ['pain-entries-count', userId],
    {
      tags: [`pain-entries-${userId}`],
      revalidate: 60,
    }
  )();
}
