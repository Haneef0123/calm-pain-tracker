import { getSession } from '@/lib/supabase/auth';
import Settings from '@/components/pages/Settings';
import { getPainEntriesCount } from '@/lib/data/pain-entries';
import { isAnalyticsAdmin } from '@/lib/admin/access';

export default async function SettingsPage() {
    // Single call to getSession - contains both session and user info
    const { data: { session }, error } = await getSession();

    if (!session?.user || error) {
        return <Settings entryCount={0} userEmail={null} showAdminAnalytics={false} />;
    }

    const entryCount = await getPainEntriesCount(session.user.id, session.access_token);
    const showAdminAnalytics = isAnalyticsAdmin(session.user.email ?? null);

    return (
        <Settings
            entryCount={entryCount}
            userEmail={session.user.email ?? null}
            showAdminAnalytics={showAdminAnalytics}
        />
    );
}
