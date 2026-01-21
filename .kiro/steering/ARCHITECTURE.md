<!---
inclusion: manual
--->

# PainMap Architecture Overview

## System Architecture

### Hybrid SSR + React Query Pattern

PainMap uses a **two-tier data architecture** that combines the best of server-side rendering and client-side caching:

```
┌─────────────────────────────────────────────────────────────┐
│                     First Page Load (SSR)                    │
├─────────────────────────────────────────────────────────────┤
│  1. User visits /patterns                                    │
│  2. Server Component fetches from Supabase (~300ms)         │
│  3. Server renders HTML with data                            │
│  4. Browser receives fully rendered page                     │
│  5. React hydrates                                           │
│  6. React Query caches SSR data                              │
│                                                              │
│  Result: Fast initial load, SEO-friendly, cached for future │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Client-Side Navigation (Cached)                 │
├─────────────────────────────────────────────────────────────┤
│  1. User clicks /history                                     │
│  2. React Query checks cache                                 │
│  3. Cache hit (data < 30s old)                              │
│  4. Returns cached data instantly                            │
│                                                              │
│  Result: <16ms navigation (94% faster than before)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         Client-Side Navigation (Stale Data)                  │
├─────────────────────────────────────────────────────────────┤
│  1. User clicks /settings (data > 30s old)                  │
│  2. React Query returns cached data (instant UI)            │
│  3. Background fetch starts                                  │
│  4. Fresh data arrives                                       │
│  5. UI updates silently                                      │
│                                                              │
│  Result: Instant UI + fresh data in background              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Mutation (Optimistic Update)                │
├─────────────────────────────────────────────────────────────┤
│  1. User adds pain entry                                     │
│  2. Optimistic update (instant UI)                           │
│  3. Request sent to Supabase                                 │
│  4. Success: Replace temp entry with real one                │
│  5. Error: Rollback + show toast                             │
│                                                              │
│  Result: 0ms perceived latency                               │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 15.x** - App Router with Server Components
- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component primitives
- **Recharts** - Data visualization

### State Management
- **React Query** - Server state caching and synchronization
- **React Hooks** - Local UI state (useState, useReducer)
- **No global state library** - Not needed with React Query

### Backend
- **Supabase** - PostgreSQL database + Auth
- **Supabase Auth** - Google OAuth authentication
- **Row Level Security** - Database-level authorization

### Caching Strategy
- **React Query Cache** - 30s staleTime, 5min gcTime
- **Next.js Cache** - Automatic for static assets
- **No localStorage** - Replaced with Supabase for cross-device sync

## Data Flow

### Server Components (SSR)
```typescript
// app/patterns/page.tsx
export default async function PatternsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('pain_entries').select('*');
  const entries = data?.map(dbToClient) ?? [];
  
  return <Trends initialEntries={entries} />;
}
```

### Client Components (React Query)
```typescript
// components/pages/Trends.tsx
'use client';

export default function Trends({ initialEntries }: TrendsProps) {
  const { entries, addEntry, deleteEntry } = usePainEntries(initialEntries);
  // entries from React Query cache, instant on navigation
}
```

### Custom Hook (Data Layer)
```typescript
// hooks/use-pain-entries.ts
export function usePainEntries(initialEntries: PainEntry[] = []) {
  const { data: entries } = useQuery({
    queryKey: ['pain-entries'],
    queryFn: fetchPainEntries,
    initialData: initialEntries,
    staleTime: 30000,
  });
  
  const addMutation = useMutation({
    mutationFn: addEntry,
    onMutate: optimisticUpdate,
    onError: rollback,
  });
  
  return { entries, addEntry: addMutation.mutateAsync };
}
```

## Performance Characteristics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First page load | 300ms | 300ms | Same (SSR preserved) |
| Client navigation | 300ms | <16ms | **94% faster** |
| After mutation | 300ms | 0ms | **Instant (optimistic)** |
| Cross-route cache | None | Shared | **New capability** |
| Stale data handling | Manual | Automatic | **New capability** |

## Directory Structure

```
app/                          # Next.js App Router (Server Components)
├── layout.tsx                # Root layout with providers
├── page.tsx                  # Home (/) - DailyEntry form
├── history/page.tsx          # /history - Past entries
├── patterns/page.tsx         # /patterns - Charts & stats
├── settings/page.tsx         # /settings - User settings
└── auth/callback/page.tsx   # OAuth callback

components/
├── pages/                    # Page content (Client Components)
│   ├── DailyEntry.tsx        # Form for adding entries
│   ├── History.tsx           # List of past entries
│   ├── Trends.tsx            # Charts and patterns
│   └── Settings.tsx          # User settings & export
├── pain/                     # Domain-specific components
│   ├── PainSlider.tsx        # Pain level input
│   ├── ChipSelect.tsx        # Multi-select chips
│   ├── HistoryEntryCard.tsx  # Entry display card
│   └── StatsCard.tsx         # Statistics display
├── layout/                   # Layout components
│   ├── PageLayout.tsx        # Page wrapper
│   └── BottomNav.tsx         # Bottom navigation
├── ui/                       # shadcn/ui primitives
└── providers.tsx             # React Query + Auth providers

hooks/
└── use-pain-entries.ts       # React Query data layer

lib/
├── supabase/
│   ├── client.ts             # Client-side Supabase
│   ├── server.ts             # Server-side Supabase
│   └── middleware.ts         # Auth middleware
└── utils.ts                  # Shared utilities

types/
└── pain-entry.ts             # TypeScript types & converters
```

## Key Design Decisions

### 1. Hybrid SSR + React Query
**Why:** Combines fast initial load (SSR) with instant navigation (cache)
**Trade-off:** Slightly more complex than pure SSR or pure client-side
**Result:** 94% faster navigation while preserving SEO

### 2. Optimistic Updates
**Why:** Instant UI feedback improves perceived performance
**Trade-off:** Must handle rollback on errors
**Result:** 0ms perceived latency for mutations

### 3. 30-Second Stale Time
**Why:** Pain entries don't change frequently
**Trade-off:** Data can be up to 30s old
**Result:** Minimal server load, always feels instant

### 4. Single Query Key
**Why:** All routes share the same cache
**Trade-off:** Can't have different stale times per route
**Result:** Instant cross-route navigation

### 5. Supabase Over localStorage
**Why:** Cross-device sync, better data persistence
**Trade-off:** Requires authentication, network dependency
**Result:** More robust, enables future features

## Security Model

### Authentication
- Google OAuth via Supabase Auth
- Session stored in httpOnly cookies
- Middleware validates on every request

### Authorization
- Row Level Security (RLS) in Supabase
- Users can only access their own data
- Enforced at database level

### Data Protection
- All requests over HTTPS
- No sensitive data in localStorage
- CSRF protection via SameSite cookies

## Scalability Considerations

### Current Limits
- Single user per account (no sharing)
- All entries loaded at once (no pagination)
- No real-time sync (manual refresh needed)

### Future Enhancements
- Pagination for large datasets (useInfiniteQuery)
- Real-time updates (Supabase subscriptions)
- Offline support (Service Worker + IndexedDB)
- Data export/import (CSV already implemented)

## Development Workflow

### Adding a New Feature
1. Check architecture-guardian.md for patterns
2. Design data model (if needed)
3. Create Server Component for SSR
4. Create Client Component with React Query
5. Add mutations with optimistic updates
6. Test error scenarios (rollback)
7. Update documentation

### Testing Strategy
- Build verification: `npm run build`
- Type checking: `npm run type-check`
- Linting: `npm run lint`
- Manual testing: All CRUD operations + error cases

### Deployment
- Vercel for hosting (automatic from git)
- Supabase for database (managed service)
- Environment variables in Vercel dashboard

## Monitoring & Debugging

### React Query DevTools (Optional)
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Cache Inspection
```typescript
const queryClient = useQueryClient();
const cachedData = queryClient.getQueryData(['pain-entries']);
console.log('Cache:', cachedData);
```

### Performance Monitoring
- Next.js built-in analytics
- Vercel Analytics (optional)
- Browser DevTools Performance tab

## References

- [React Query Documentation](https://tanstack.com/query/latest)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Steering Files](.kiro/steering/)
