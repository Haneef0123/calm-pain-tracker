'use client';

import { ReactNode } from 'react';

interface TrackShellProps {
  children: ReactNode;
}

export function TrackShell({ children }: TrackShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[430px] px-5 pb-8">
        {children}
      </main>
    </div>
  );
}
