import History from '@/components/pages/History';

// Static page - no server-side auth checks needed
// Middleware handles auth redirects
// React Query handles data fetching client-side
export default function HistoryPage() {
    return <History />;
}
