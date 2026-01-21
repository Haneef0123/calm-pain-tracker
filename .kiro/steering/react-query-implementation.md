<!---
inclusion: manual
--->

# React Query Implementation Guide

## Overview

This app uses a **hybrid SSR + React Query architecture** to achieve instant client-side navigation while preserving all server-side rendering benefits.

## Architecture

### First Page Load (Direct URL or Refresh)
```
1. Server fetches data from Supabase (SSR)
2. Server renders HTML with data
3. Browser receives fully rendered HTML
4. React hydrates with SSR data
5. React Query caches the SSR data
Result: Instant content, SEO-friendly, cached for future use
```

### Client-Side Navigation (Clicking nav links)
```
1. User clicks navigation link
2. React Query checks cache
3. If fresh (< 30s): Return cached data instantly (<16ms)
4. If stale (> 30s): Return cached data + refetch in background
5. UI updates silently when fresh data arrives
Result: Instant navigation, always fresh data
```

## Configuration

### Query Client Settings (`components/providers.tsx`)

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,              // Data fresh for 30 seconds
      gcTime: 5 * 60 * 1000,         // Keep unused data for 5 minutes
      retry: 1,                       // Retry failed requests once
      refetchOnWindowFocus: true,     // Refetch when tab regains focus
      refetchOnMount: true,           // Refetch on mount if stale
    },
  },
})
```

### Why 30 Seconds?

- Pain entries don't change frequently (not a chat app)
- User is typically the only one modifying their data
- 30s is imperceptible to users
- Mutations invalidate cache immediately (user's changes are instant)
- Background refetch ensures data stays fresh

## Data Flow

### Query Key
```typescript
const PAIN_ENTRIES_KEY = ['pain-entries'] as const;
```

All pain entry data is cached under this single key, shared across all routes.

### Fetching Data
```typescript
useQuery({
  queryKey: PAIN_ENTRIES_KEY,
  queryFn: fetchPainEntries,
  initialData: initialEntries.length > 0 ? initialEntries : undefined,
  staleTime: 30000,
})
```

- `initialData`: Hydrates cache with SSR data on first load
- `staleTime`: Determines when data is considered stale
- `queryFn`: Fetches fresh data from Supabase when needed

### Mutations with Optimistic Updates

All mutations (add, update, delete) follow this pattern:

1. **onMutate**: Update cache optimistically (instant UI)
2. **mutationFn**: Send request to Supabase
3. **onSuccess**: Replace optimistic data with real data
4. **onError**: Rollback to previous state + show error toast

Example:
```typescript
const addMutation = useMutation({
  mutationFn: async (entry) => {
    // Save to Supabase
  },
  onMutate: async (newEntry) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: PAIN_ENTRIES_KEY });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(PAIN_ENTRIES_KEY);
    
    // Optimistically update cache
    const tempEntry = { ...newEntry, id: crypto.randomUUID() };
    queryClient.setQueryData(PAIN_ENTRIES_KEY, old => [tempEntry, ...old]);
    
    return { previous, tempId: tempEntry.id };
  },
  onError: (err, newEntry, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(PAIN_ENTRIES_KEY, context.previous);
    }
    toast({ title: 'Failed to save entry', variant: 'destructive' });
  },
  onSuccess: (newEntry, variables, context) => {
    // Replace temp entry with real one
    queryClient.setQueryData(PAIN_ENTRIES_KEY, old =>
      old.map(e => e.id === context?.tempId ? newEntry : e)
    );
  },
});
```

## Performance Characteristics

| Scenario | Before (SSR only) | After (Hybrid) |
|----------|------------------|----------------|
| First page load | 300ms | 300ms (same) |
| Client navigation | 300ms | <16ms (instant) |
| After user mutation | 300ms | 0ms (optimistic) |
| Stale data refetch | Manual refresh | Automatic background |
| Cross-route cache | None | Shared |

## Cache Invalidation

### Automatic Invalidation
- Window regains focus → Refetch if stale
- Component mounts → Refetch if stale
- 30 seconds pass → Mark as stale, refetch on next interaction

### Manual Invalidation
Mutations automatically update the cache optimistically. No manual invalidation needed.

## Debugging

### React Query DevTools (Optional)

To add DevTools for development:

```typescript
// components/providers.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Cache Inspection

```typescript
// In any component
const queryClient = useQueryClient();
const cachedData = queryClient.getQueryData(['pain-entries']);
console.log('Cached entries:', cachedData);
```

## Troubleshooting

### Issue: Data not updating after mutation
**Cause**: Mutation not updating cache correctly
**Fix**: Check `onSuccess` handler replaces optimistic data

### Issue: Stale data showing
**Cause**: `staleTime` too high or refetch disabled
**Fix**: Reduce `staleTime` or enable `refetchOnMount`

### Issue: Too many network requests
**Cause**: `staleTime` too low
**Fix**: Increase `staleTime` to reduce refetch frequency

### Issue: Optimistic update not rolling back on error
**Cause**: Missing `onError` handler or incorrect context
**Fix**: Ensure `onMutate` returns previous state, `onError` restores it

## Best Practices

1. **Always use optimistic updates** for better UX
2. **Always handle errors** with rollback + toast
3. **Keep staleTime reasonable** (30s for this app)
4. **Use single query key** for related data
5. **Leverage SSR data** via `initialData`
6. **Test error scenarios** to ensure rollback works

## Migration Notes

### What Changed
- `hooks/use-pain-entries.ts`: Rewritten to use React Query
- `components/providers.tsx`: Added QueryClient configuration
- All page components: No changes needed (API remains the same)

### What Stayed the Same
- SSR data fetching in `app/**/page.tsx`
- Component props (`initialEntries`)
- Hook API (`usePainEntries` signature)
- Optimistic updates (now more robust)

### Breaking Changes
None. The hook API is identical, so all existing components work without modification.

## Future Enhancements

### Pagination (if needed)
```typescript
useInfiniteQuery({
  queryKey: ['pain-entries'],
  queryFn: ({ pageParam = 0 }) => fetchPainEntries(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```

### Real-time Updates (if needed)
```typescript
useEffect(() => {
  const supabase = createClient();
  const channel = supabase
    .channel('pain_entries')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pain_entries' }, () => {
      queryClient.invalidateQueries({ queryKey: PAIN_ENTRIES_KEY });
    })
    .subscribe();
  
  return () => { supabase.removeChannel(channel); };
}, []);
```

### Prefetching (if needed)
```typescript
// Prefetch on hover
<Link
  href="/patterns"
  onMouseEnter={() => queryClient.prefetchQuery({
    queryKey: PAIN_ENTRIES_KEY,
    queryFn: fetchPainEntries,
  })}
>
  Patterns
</Link>
```
