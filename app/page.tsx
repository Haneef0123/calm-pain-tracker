import { getSession } from '@/lib/supabase/auth';
import DailyEntry from '@/components/pages/DailyEntry';

export default async function HomePage() {
    const { data: { session } } = await getSession();

    if (!session?.user) {
        return null;
    }

    return <DailyEntry />;
}
