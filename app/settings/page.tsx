import { getSession } from '@/lib/supabase/auth';
import Settings from '@/components/pages/Settings';
import { getPainEntries } from '@/lib/data/pain-entries';

export default async function SettingsPage() {
    const { data: { session } } = await getSession();

    if (!session?.user) {
        return <Settings initialEntries={[]} userEmail={null} />;
    }

    const entries = await getPainEntries(session.user.id, session.access_token);

    return (
        <Settings
            initialEntries={entries}
            userEmail={session.user.email ?? null}
        />
    );
}
