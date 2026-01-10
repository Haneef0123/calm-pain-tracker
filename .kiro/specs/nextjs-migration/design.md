# Design Document: Next.js Migration

## Overview

This document outlines the migration strategy from Vite + React to Next.js 15.x with App Router. The migration preserves all existing functionality while leveraging Next.js's optimized build system and native Vercel integration.

### Key Decisions

- **Next.js 15.x**: Stable release with proven Vercel compatibility
- **App Router**: Modern routing with layouts and server/client component model
- **Client Components**: All interactive components use 'use client' directive
- **No Server Features**: Maintains privacy-first architecture (no API routes, no server actions with external calls)
- **Static Export Option**: Can deploy as static site or with Edge Runtime

## Architecture

### Current Structure (Vite)

```
src/
├── App.tsx              # Router setup
├── main.tsx             # Entry point
├── index.css            # Global styles
├── components/
│   ├── layout/          # PageLayout, BottomNav
│   ├── pain/            # Domain components
│   └── ui/              # shadcn/ui
├── hooks/               # usePainEntries, etc.
├── pages/               # Route components
├── types/               # TypeScript interfaces
└── lib/                 # Utilities
```

### Target Structure (Next.js)

```
app/
├── layout.tsx           # Root layout (providers, global styles)
├── page.tsx             # Home route (/)
├── history/
│   └── page.tsx         # /history
├── trends/
│   └── page.tsx         # /trends
├── settings/
│   └── page.tsx         # /settings
├── not-found.tsx        # 404 page
└── globals.css          # Global styles (moved from src/index.css)

components/
├── layout/              # PageLayout, BottomNav (unchanged)
├── pain/                # Domain components (unchanged)
├── ui/                  # shadcn/ui (unchanged)
└── providers.tsx        # Client-side providers wrapper

hooks/                   # Custom hooks (unchanged)
types/                   # TypeScript interfaces (unchanged)
lib/                     # Utilities (unchanged)
```

## Components and Interfaces

### Root Layout (`app/layout.tsx`)

```typescript
// Server Component - no 'use client'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pain Diary',
  description: 'Privacy-first pain tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Providers Component (`components/providers.tsx`)

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

### Page Components

Each page becomes a simple wrapper that imports the existing page component:

```typescript
// app/page.tsx
import DailyEntry from '@/components/pages/DailyEntry';

export default function HomePage() {
  return <DailyEntry />;
}
```

### Navigation Changes

Replace react-router-dom with Next.js navigation:

```typescript
// Before (react-router-dom)
import { NavLink, useLocation } from 'react-router-dom';

// After (Next.js)
import Link from 'next/link';
import { usePathname } from 'next/navigation';
```

### BottomNav Migration

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, History, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Calendar, label: 'Today' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/trends', icon: TrendingUp, label: 'Trends' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
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
```

## Data Models

No changes to data models. The `PainEntry` interface and constants remain identical:

```typescript
// types/pain-entry.ts - unchanged
export interface PainEntry {
  id: string;
  timestamp: string;
  painLevel: number;
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Structure Preservation

*For any* route in the original application (/, /history, /trends, /settings), the migrated Next.js application SHALL have a corresponding page component that renders the same content.

**Validates: Requirements 1.2, 6.5**

### Property 2: Client Component Boundary Correctness

*For any* component that uses React hooks (useState, useEffect, useCallback, useMemo) or browser APIs (localStorage, window), that component SHALL be marked with 'use client' directive at the top of the file.

**Validates: Requirements 2.1, 4.3**

### Property 3: CSS Design Token Preservation

*For any* CSS custom property defined in the original src/index.css, the migrated app/globals.css SHALL contain the same property with the same value.

**Validates: Requirements 3.2**

### Property 4: Data Backward Compatibility

*For any* valid PainEntry array stored in localStorage under 'painDiary.entries' by the Vite version, the Next.js version SHALL correctly parse and display that data without errors.

**Validates: Requirements 4.2**

## Error Handling

### Hydration Errors

Client components that access browser APIs must handle SSR:

```typescript
'use client';

import { useState, useEffect } from 'react';

export function usePainEntries() {
  const [entries, setEntries] = useState<PainEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only access localStorage after mount (client-side)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load entries:', e);
    }
    setIsLoaded(true);
  }, []);

  // ... rest unchanged
}
```

### 404 Handling

```typescript
// app/not-found.tsx
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';

export default function NotFound() {
  return (
    <PageLayout>
      <div className="pt-8 animate-fade-in text-center">
        <h1 className="text-heading mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link 
          href="/"
          className="text-foreground underline hover:no-underline"
        >
          Go back home
        </Link>
      </div>
    </PageLayout>
  );
}
```

## Testing Strategy

### Unit Tests

- Verify CSS custom properties match between old and new
- Verify route structure matches expected paths
- Verify 'use client' directive presence in interactive components

### Property-Based Tests

- **Property 1**: Generate route paths, verify corresponding page.tsx exists
- **Property 2**: Parse component files, verify hooks usage implies 'use client'
- **Property 3**: Parse CSS files, compare custom property definitions
- **Property 4**: Generate valid PainEntry arrays, verify parsing succeeds

### Integration Tests

- Build succeeds: `npm run build` exits with code 0
- Lint passes: `npm run lint` exits with code 0
- All routes render without hydration errors

### Manual Verification

- Visual comparison between Vite and Next.js versions
- Navigation works without full page reloads
- localStorage data persists across sessions
- CSV export/import functions correctly

## Migration Steps

### Phase 1: Project Setup
1. Create new Next.js project structure alongside existing
2. Configure TypeScript, Tailwind, path aliases
3. Copy shadcn/ui components and configuration

### Phase 2: Core Migration
1. Move global styles to app/globals.css
2. Create root layout with providers
3. Create page components for each route
4. Migrate BottomNav to use Next.js navigation

### Phase 3: Component Migration
1. Add 'use client' to all interactive components
2. Move page components to components/pages/
3. Update imports from react-router-dom to next/navigation
4. Verify hooks work correctly (especially usePainEntries)

### Phase 4: Cleanup
1. Remove Vite configuration files
2. Remove react-router-dom dependency
3. Update package.json scripts
4. Update next.config.js for Vercel

### Phase 5: Verification
1. Run build and lint
2. Test all routes locally
3. Verify localStorage persistence
4. Deploy to Vercel preview
5. Compare with production Vite version

## Configuration Files

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for pure client-side app
  // Remove this if you want to use Edge Runtime instead
  // output: 'export',
  
  // Disable image optimization for static export
  // images: { unoptimized: true },
};

module.exports = nextConfig;
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### tailwind.config.ts

Minimal changes - update content paths:

```typescript
content: [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./lib/**/*.{ts,tsx}",
],
```
