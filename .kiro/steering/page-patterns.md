<!---
inclusion: fileMatch
fileMatchPattern: "app/**/page.tsx"
--->

# Page Development Patterns (Next.js App Router)

## App Router Page Structure

Pages in Next.js App Router are Server Components by default. Our pages use a **hybrid SSR + React Query architecture**:

```typescript
// app/patterns/page.tsx (Server Component - SSR data fetching)
import { createClient } from '@/lib/supabase/server';
import Trends from '@/components/pages/Trends';
import { DbPainEntry, dbToClient } from '@/types/pain-entry';

export default async function PatternsPage() {
  const supabase = await createClient();
  
  // Fetch data on server for SSR
  const { data } = await supabase
    .from('pain_entries')
    .select('*')
    .order('timestamp', { ascending: false });
  
  const entries = (data as DbPainEntry[] | null)?.map(dbToClient) ?? [];
  
  // Pass to client component for hydration
  return <Trends initialEntries={entries} />;
}
```

```typescript
// components/pages/Trends.tsx (Client Component - React Query caching)
'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import type { PainEntry } from '@/types/pain-entry';

interface TrendsProps {
  initialEntries: PainEntry[];
}

export default function Trends({ initialEntries }: TrendsProps) {
  // React Query hydrates with SSR data, enables instant navigation
  const { entries, isLoaded } = usePainEntries(initialEntries);
  
  return (
    <PageLayout>
      <div className="pt-8 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-heading">Patterns</h1>
        </header>
        
        {/* Page content using entries from React Query cache */}
      </div>
    </PageLayout>
  );
}
```

## Key Patterns

### Hybrid SSR + React Query Architecture
- `app/**/page.tsx` - Server Component that fetches data via Supabase
- `components/pages/*.tsx` - Client Component that receives `initialEntries` prop
- React Query hydrates cache with SSR data for instant subsequent navigation

### Two-Layer Page Architecture
1. **Server Layer** (`app/**/page.tsx`): Fetches data, renders initial HTML
2. **Client Layer** (`components/pages/*.tsx`): Receives data, manages interactions

### 'use client' Directive
All page content components in `components/pages/` must have `'use client'` at the top because they:
- Use React hooks (useState, useEffect, useQuery, etc.)
- Use React Query for caching
- Handle user interactions
- Access browser APIs

### SSR Data Fetching Pattern
Always fetch data in Server Components and pass to Client Components:

```typescript
// ✅ CORRECT: Fetch in Server Component
export default async function MyPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('pain_entries').select('*');
  const entries = data?.map(dbToClient) ?? [];
  
  return <MyPageContent initialEntries={entries} />;
}

// ❌ WRONG: Don't fetch in Client Component on first load
'use client';
export default function MyPage() {
  const { entries } = usePainEntries(); // No SSR, slower first load
  // ...
}
```

### React Query Hydration Pattern
Client components receive SSR data and pass to `usePainEntries`:

```typescript
interface MyPageProps {
  initialEntries: PainEntry[];
}

export default function MyPage({ initialEntries }: MyPageProps) {
  // React Query hydrates cache with SSR data
  const { entries, addEntry, deleteEntry } = usePainEntries(initialEntries);
  
  // First render: entries = initialEntries (instant)
  // Navigation: entries from React Query cache (instant)
  // Stale data: Background refetch (silent update)
}
```

### PageLayout Wrapper
Always wrap page content in `PageLayout` - it provides:
- Consistent max-width container
- Bottom padding for nav
- Background color
- Bottom navigation

### Header Pattern
- Use `<header>` semantic element
- `text-heading` class for title
- Optional subtitle with `text-label mt-1`

### Empty States
When no data exists, show helpful guidance:

```typescript
'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { usePainEntries } from '@/hooks/use-pain-entries';
import type { PainEntry } from '@/types/pain-entry';

interface HistoryProps {
  initialEntries: PainEntry[];
}

export default function History({ initialEntries }: HistoryProps) {
  const { entries, isLoaded } = usePainEntries(initialEntries);

  // No loading state needed - SSR provides initial data
  // isLoaded is true immediately on first render

  if (entries.length === 0) {
    return (
      <PageLayout>
        <div className="pt-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-heading">History</h1>
          </header>
          <div className="text-center py-16">
            <p className="text-muted-foreground">No entries yet.</p>
            <p className="text-label mt-2">Start tracking your pain on the Today tab.</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  // ...
}
```

### Destructive Actions
Always confirm with AlertDialog:

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" className="text-destructive">
      Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="bg-card">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete entry?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Toast Notifications
Use for success/error feedback:

```typescript
import { toast } from '@/hooks/use-toast';

toast({
  title: 'Entry saved',
  description: 'Your pain entry has been recorded.',
});

// For errors
toast({
  title: 'Import failed',
  description: 'Could not read the CSV file.',
  variant: 'destructive',
});
```

## Navigation

### Using Next.js Link
```typescript
import Link from 'next/link';

<Link href="/history">View History</Link>
```

### Getting Current Route
```typescript
'use client';

import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const isActive = pathname === '/history';
  // ...
}
```

## Adding a New Page

1. Create route file with SSR data fetching: `app/newpage/page.tsx`
   ```typescript
   import { createClient } from '@/lib/supabase/server';
   import NewPage from '@/components/pages/NewPage';
   import { DbPainEntry, dbToClient } from '@/types/pain-entry';
   
   export default async function NewPageRoute() {
     const supabase = await createClient();
     
     // Fetch data on server for SSR
     const { data } = await supabase
       .from('pain_entries')
       .select('*')
       .order('timestamp', { ascending: false });
     
     const entries = (data as DbPainEntry[] | null)?.map(dbToClient) ?? [];
     
     return <NewPage initialEntries={entries} />;
   }
   ```

2. Create page component with React Query: `components/pages/NewPage.tsx`
   ```typescript
   'use client';
   
   import { PageLayout } from '@/components/layout/PageLayout';
   import { usePainEntries } from '@/hooks/use-pain-entries';
   import type { PainEntry } from '@/types/pain-entry';
   
   interface NewPageProps {
     initialEntries: PainEntry[];
   }
   
   export default function NewPage({ initialEntries }: NewPageProps) {
     // React Query hydrates with SSR data
     const { entries, isLoaded } = usePainEntries(initialEntries);
     
     return (
       <PageLayout>
         {/* Page content */}
       </PageLayout>
     );
   }
   ```

3. Add nav item in `components/layout/BottomNav.tsx` (if needed)

### Exception: Pages Without Data

If a page doesn't need pain entries (like DailyEntry form):

```typescript
// app/page.tsx - No data fetching needed
import DailyEntry from '@/components/pages/DailyEntry';

export default function HomePage() {
  return <DailyEntry />;
}

// components/pages/DailyEntry.tsx - No initialEntries prop
'use client';

export default function DailyEntry() {
  // usePainEntries() with no args - will use React Query cache
  const { addEntry } = usePainEntries();
  // ...
}
```

## Hydration Safety

### SSR Hydration (Current Implementation)

With the hybrid SSR + React Query architecture, hydration is handled automatically:

```typescript
// Server Component fetches data
export default async function MyPage() {
  const entries = await fetchFromSupabase();
  return <MyPageContent initialEntries={entries} />;
}

// Client Component receives SSR data
'use client';
export default function MyPageContent({ initialEntries }: Props) {
  // React Query hydrates with SSR data - no hydration mismatch
  const { entries } = usePainEntries(initialEntries);
  
  // entries available immediately on first render
  // No need for isLoaded check or loading skeleton
}
```

### When You Still Need Hydration Safety

For browser-only APIs (not data fetching):

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function MyComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Or a loading skeleton

  // Safe to access window, localStorage, etc.
  const theme = window.localStorage.getItem('theme');
}
```

### React Query Handles Hydration

The `usePainEntries` hook automatically handles hydration via `initialData`:

```typescript
useQuery({
  queryKey: ['pain-entries'],
  queryFn: fetchPainEntries,
  initialData: initialEntries.length > 0 ? initialEntries : undefined,
  // ↑ This prevents hydration mismatches
})
```

**Result:** No loading states, no hydration errors, instant content on first render.
