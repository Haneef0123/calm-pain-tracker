import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 max-w-lg mx-auto px-6 md:px-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
