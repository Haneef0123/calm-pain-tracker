import { createClient } from '@/lib/supabase/server';
import Trends from '@/components/pages/Trends';
import { DbPainEntry, dbToClient } from '@/types/pain-entry';

export default async function TrendsPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('pain_entries')
        .select('*')
        .order('timestamp', { ascending: false });

    const entries = (data as DbPainEntry[] | null)?.map(dbToClient) ?? [];

    return <Trends initialEntries={entries} />;
}
