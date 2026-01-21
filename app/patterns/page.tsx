import { getSession } from '@/lib/supabase/auth';
import Trends from '@/components/pages/Trends';
import { getPainEntries } from '@/lib/data/pain-entries';

export default async function PatternsPage() {
    const { data: { session } } = await getSession();

    if (!session?.user) {
        return <Trends initialEntries={[]} />;
    }

    const entries = await getPainEntries(session.user.id, session.access_token);

    return <Trends initialEntries={entries} />;
}
