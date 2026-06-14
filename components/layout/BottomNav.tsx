'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Clock3, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Calendar, label: 'Today' },
  { path: '/history', icon: Clock3, label: 'Past days' },
  { path: '/patterns', icon: TrendingUp, label: 'Patterns' },
  { path: '/settings', icon: SlidersHorizontal, label: 'Settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-white">
      <div className="mx-auto max-w-[430px] border-t border-[#e7ebe7] bg-white px-2 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-[10px]">
        <div className="flex items-start">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  'flex flex-1 flex-col items-center gap-[3px] bg-transparent py-0.5 transition-colors duration-150',
                  isActive ? 'text-[#008391]' : 'text-[#919191] hover:text-[#747a75]'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
                <span
                  className="text-[11px]"
                  style={{ fontWeight: isActive ? 600 : 500 }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
