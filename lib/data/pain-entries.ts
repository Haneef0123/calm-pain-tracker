import { createClient } from '@supabase/supabase-js';
import { DbPainEntry, dbToClient, PainEntry } from '@/types/pain-entry';
import { unstable_cache } from 'next/cache';

export async function getPainEntries(userId: string, accessToken: string): Promise<PainEntry[]> {
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
        .order('timestamp', { ascending: false });

      return (data as DbPainEntry[] | null)?.map(dbToClient) ?? [];
    },
    ['pain-entries', userId], // Key doesn't technically need token if userId is unique, but unstable_cache forces args. 
    // Actually, we should probably INCLUDE the token in the key explicitly to avoid using a stale token? 
    // No, the key is used to lookup the result. If we use the same key for different tokens, we might serve cached data. 
    // Since the data is owned by userId, serving cached data for the same userId is CORRECT, regardless of which valid token requested it.
    // However, unstable_cache variadic args are automatically part of the key.
    {
      tags: [`pain-entries-${userId}`],
      revalidate: 60 // Cache for 60 seconds
    }
  )(); // Call with 0 arguments, since callback captures variables from closure
}
