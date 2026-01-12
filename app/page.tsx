import { createClient } from '@/lib/supabase/server';
import DailyEntry from '@/components/pages/DailyEntry';

export default async function HomePage() {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    // User is guaranteed by middleware, but TypeScript needs the check
    if (!user.user) {
        return null;
    }

    return <DailyEntry />;
}
