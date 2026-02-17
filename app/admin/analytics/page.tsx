import { notFound } from 'next/navigation';
import { getSession } from '@/lib/supabase/auth';
import { isAnalyticsAdmin } from '@/lib/admin/access';
import AdminAnalytics from '@/components/pages/AdminAnalytics';

export default async function AdminAnalyticsPage() {
  const {
    data: { session },
  } = await getSession();

  if (!session?.user || !isAnalyticsAdmin(session.user.email)) {
    notFound();
  }

  return <AdminAnalytics />;
}
