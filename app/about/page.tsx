import { createClient } from '@/lib/supabase/server';
import Settings from '@/components/pages/Settings';
import { DbPainEntry, dbToClient } from '@/types/pain-entry';

export default async function AboutPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    const { data } = await supabase
        .from('pain_entries')
        .select('*')
        .order('timestamp', { ascending: false });

    const entries = (data as DbPainEntry[] | null)?.map(dbToClient) ?? [];

    return (
        <Settings
            initialEntries={entries}
            userEmail={userData.user?.email ?? null}
        />
    );
}
