import { getSession } from '@/lib/supabase/auth';
import DailyEntry from '@/components/pages/DailyEntry';
import { isE2ETestMode } from '@/lib/e2e/mock-data';

export default async function HomePage() {
    if (isE2ETestMode()) {
        return <DailyEntry />;
    }

    const { data: { session } } = await getSession();

    if (!session?.user) {
        return null;
    }

    return <DailyEntry />;
}
