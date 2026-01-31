'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Calendar, History, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Calendar, label: 'Today' },
  { path: '/history', icon: History, label: 'Past days' },
  { path: '/patterns', icon: TrendingUp, label: 'Patterns' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Prefetch primary routes after idle so tab switching feels instant.
  useEffect(() => {
    const prefetch = () => {
      navItems.forEach(({ path }) => {
        if (path !== pathname) {
          router.prefetch(path);
        }
      });
    };

    // Avoid prefetching immediately on slow networks.
    const conn = (navigator as any).connection;
    const isSaveData = !!conn?.saveData;
    const is2g = typeof conn?.effectiveType === 'string' && conn.effectiveType.includes('2g');

    if (isSaveData || is2g) return;

    const id = (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(prefetch, { timeout: 1500 })
      : window.setTimeout(prefetch, 800);

    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [router, pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              prefetch
              onMouseEnter={() => router.prefetch(path)}
              onTouchStart={() => router.prefetch(path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-opacity duration-100',
                isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 mb-1',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className={cn(
                'text-xs',
                isActive ? 'font-medium text-foreground' : 'font-light text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
