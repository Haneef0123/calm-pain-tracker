<!---
inclusion: fileMatch
fileMatchPattern: "hooks/**/*.ts"
--->

# Data Layer Guidelines

## The `usePainEntries` Hook

This is the single source of truth for all pain data. It uses **React Query** for caching and state management, with **Supabase** as the backend.

### Architecture: Hybrid SSR + React Query

The hook implements a two-tier data strategy:

1. **Server-Side Rendering (SSR)**: First page load passes `initialEntries` from server
2. **React Query Cache**: Client-side cache enables instant navigation and optimistic updates

### Usage Pattern

```typescript
const { 
  entries,           // PainEntry[] - sorted newest first (from React Query cache)
  isLoaded,          // boolean - true after initial load
  addEntry,          // (entry: NewPainEntry) => Promise<PainEntry>
  updateEntry,       // (id: string, updates: Partial<NewPainEntry>) => Promise<void>
  deleteEntry,       // (id: string) => Promise<void>
  clearAllEntries,   // () => Promise<void>
  exportToCsv,       // () => void - triggers download
} = usePainEntries(initialEntries);
```

### How It Works

**First Page Load (SSR):**
```typescript
// app/patterns/page.tsx (Server Component)
export default async function PatternsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('pain_entries').select('*');
  const entries = data?.map(dbToClient) ?? [];
  
  // Pass SSR data to client component
  return <Trends initialEntries={entries} />;
}

// components/pages/Trends.tsx (Client Component)
export default function Trends({ initialEntries }: TrendsProps) {
  // React Query hydrates with SSR data
  const { entries } = usePainEntries(initialEntries);
  // entries available immediately, no loading state
}
```

**Client-Side Navigation:**
```typescript
// User clicks from /patterns to /history
// React Query returns cached data instantly (<16ms)
// Background refetch runs if data is stale (>30s)
// UI updates silently when fresh data arrives
```

**Mutations (Add/Update/Delete):**
```typescript
// User adds entry
await addEntry({ painLevel: 7, locations: ['L4'], ... });

// Flow:
// 1. Optimistic update (instant UI)
// 2. Request sent to Supabase
// 3. Success: Replace temp entry with real one
// 4. Error: Rollback + show toast
```

### React Query Configuration

```typescript
useQuery({
  queryKey: ['pain-entries'],           // Single cache key for all routes
  queryFn: fetchPainEntries,            // Fetch from Supabase
  initialData: initialEntries,          // Hydrate with SSR data
  staleTime: 30000,                     // Fresh for 30 seconds
  refetchOnWindowFocus: true,           // Refetch when tab regains focus
  refetchOnMount: true,                 // Refetch on mount if stale
})
```

### Rules

1. **Never access Supabase directly** - Always go through `usePainEntries`
2. **Don't store derived data** - Compute stats/filters in components via `useMemo`
3. **Entries are immutable** - Use `updateEntry` to modify, never mutate directly
4. **IDs are UUIDs** - Generated via `crypto.randomUUID()` for optimistic updates
5. **Timestamps are ISO 8601** - Always use `new Date().toISOString()`
6. **Always pass initialEntries** - From SSR for hydration (except DailyEntry page)
7. **Mutations are async** - All CRUD operations return Promises
8. **Optimistic updates automatic** - UI updates instantly, rollback on error

### Performance Characteristics

| Scenario | Behavior | Time |
|----------|----------|------|
| First page load | SSR fetch + hydrate cache | ~300ms |
| Client navigation (fresh) | Return from cache | <16ms |
| Client navigation (stale) | Return cache + background refetch | <16ms + silent update |
| Add entry | Optimistic update + server sync | 0ms perceived |
| Update entry | Optimistic update + server sync | 0ms perceived |
| Delete entry | Optimistic update + server sync | 0ms perceived |

### Cache Invalidation

**Automatic:**
- Data becomes stale after 30 seconds
- Refetch on window focus (user returns to tab)
- Refetch on mount if data is stale

**Manual (via mutations):**
- All mutations update cache optimistically
- No manual invalidation needed

### Error Handling

All mutations include automatic rollback:

```typescript
try {
  await addEntry(newEntry);
  // Success: UI already updated optimistically
} catch (error) {
  // Error: UI automatically rolled back
  // Toast notification shown
}
```

## Creating New Hooks

When adding a new hook:

```typescript
// hooks/use-something.ts
import { useState, useCallback } from 'react';

export function useSomething(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  
  // Wrap handlers in useCallback for stable references
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);
  
  // Return object, not array
  return { value, handleChange };
}
```

### Using React Query for New Data

If you need to fetch additional data from Supabase:

```typescript
// hooks/use-user-settings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const SETTINGS_KEY = ['user-settings'] as const;

export function useUserSettings() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('user_settings').select('*').single();
      return data;
    },
    staleTime: 60000, // Fresh for 1 minute
  });
  
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const supabase = createClient();
      const { error } = await supabase.from('user_settings').update(updates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
  
  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutateAsync,
  };
}
```

## Storage Strategy

### Supabase (Primary Storage)
- All pain entries stored in `pain_entries` table
- User authentication via Supabase Auth
- Real-time capabilities available (not currently used)

### React Query Cache (Client-Side)
- 30-second staleTime for pain entries
- 5-minute garbage collection time
- Shared across all routes
- Automatic background revalidation

### No localStorage
- Previous localStorage implementation replaced with Supabase
- Better data persistence across devices
- Enables future features (sync, backup, sharing)
