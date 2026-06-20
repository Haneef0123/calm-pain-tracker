import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PainMap — Track',
  description: 'Log your pain without signing in.',
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
