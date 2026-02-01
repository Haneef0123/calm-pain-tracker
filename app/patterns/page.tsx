import { getSession } from '@/lib/supabase/auth';
import Trends from '@/components/pages/Trends';
import { getPainEntries } from '@/lib/data/pain-entries';

export default async function PatternsPage() {
    // Single call to getSession - contains both session and user info
    // This eliminates the waterfall of getUser() + getSession()
    const { data: { session }, error } = await getSession();

    if (!session?.user || error) {
        return <Trends initialEntries={[]} />;
    }

    // Now fetch entries - only ONE Supabase call instead of TWO auth calls + data call
    const entries = await getPainEntries(session.user.id, session.access_token);

    return <Trends initialEntries={entries} />;
}
