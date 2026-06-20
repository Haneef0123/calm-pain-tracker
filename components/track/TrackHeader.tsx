'use client';

import { format } from 'date-fns';
import { Settings } from 'lucide-react';
import Link from 'next/link';

interface TrackHeaderProps {
  today: Date;
}

export function TrackHeader({ today }: TrackHeaderProps) {
  return (
    <header className="flex items-start justify-between">
      <div className="page-header">
        <p className="page-kicker">{format(today, 'EEEE')}</p>
        <h1 className="page-title">{format(today, 'MMMM d, yyyy')}</h1>
      </div>
      <Link
        href="/track/settings"
        className="mt-1 flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#919191] hover:bg-[#eef1ee] hover:text-[#1c211d]"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  );
}
