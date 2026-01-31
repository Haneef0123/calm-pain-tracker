import Settings from '@/components/pages/Settings';

// Static page - no server-side auth checks needed
// Middleware handles auth redirects
// React Query handles data fetching client-side
export default function SettingsPage() {
    return <Settings />;
}
