import { getSession } from '@/lib/supabase/auth';
import History from '@/components/pages/History';
import { getPainEntries } from '@/lib/data/pain-entries';

export default async function HistoryPage() {
    const { data: { session } } = await getSession();

    if (!session?.user) {
        return <History initialEntries={[]} />;
    }

    const entries = await getPainEntries(session.user.id, session.access_token);

    return <History initialEntries={entries} />;
}
