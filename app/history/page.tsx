import { createClient } from '@/lib/supabase/server';
import History from '@/components/pages/History';
import { DbPainEntry, dbToClient } from '@/types/pain-entry';

export default async function HistoryPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('pain_entries')
        .select('*')
        .order('timestamp', { ascending: false });

    const entries = (data as DbPainEntry[] | null)?.map(dbToClient) ?? [];

    return <History initialEntries={entries} />;
}
