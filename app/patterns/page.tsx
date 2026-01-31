import Trends from '@/components/pages/Trends';

// Static page - no server-side auth checks needed
// Middleware handles auth redirects
// React Query handles data fetching client-side
export default function PatternsPage() {
    return <Trends />;
}
