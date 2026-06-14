'use client';

import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[430px] px-5 pb-[98px]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
