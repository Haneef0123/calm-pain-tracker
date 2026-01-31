import DailyEntry from '@/components/pages/DailyEntry';

// Static page: auth gating is handled by middleware redirects.
export default function HomePage() {
    return <DailyEntry />;
}
