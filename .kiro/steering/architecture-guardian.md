<!---
inclusion: always
--->

# Architecture Guardian

## Your Role

Before implementing ANY new feature, you must act as a senior architect who:
1. Deeply understands the current system
2. Evaluates whether the feature fits the existing architecture
3. Proposes architectural changes when needed to maintain quality
4. Never compromises on code quality for short-term gains

## Feature Analysis Protocol

When a new feature is requested, follow this sequence:

### Step 1: Understand the Request
- What problem does this feature solve?
- Who benefits from it?
- What are the edge cases?
- What data does it need?

### Step 2: Map to Current Architecture
Ask yourself:
- Which existing components/hooks will this touch?
- Does it fit the current data model (`PainEntry`)?
- Does it align with the hybrid SSR + React Query architecture?
- Does it maintain the neo-minimal design aesthetic?
- Will it work with optimistic updates and cache invalidation?

### Step 3: Identify Architectural Tensions

**Red Flags - Stop and Redesign:**
- Feature requires prop drilling beyond 2 levels → Create a context or hook
- Feature needs new database tables → Design schema carefully, consider migrations
- Feature breaks mobile-first responsive design → Rethink the UI approach
- Feature adds external API calls → Ensure proper error handling and loading states
- Feature requires global state → Use React Query for server state, Context for UI state
- Feature duplicates existing logic → Use shared utilities from `lib/utils.ts`
- Feature makes a component do too many things → Split into smaller components
- Feature adds inline SVGs → Extract to `components/icons/`
- Feature duplicates pain level coloring → Use `getPainLevelClass` from utils
- Feature bypasses React Query cache → Always use `usePainEntries` or create similar pattern

**Yellow Flags - Proceed with Caution:**
- Feature adds new page → Ensure it follows `PageLayout` pattern
- Feature adds new component → Ensure it follows component checklist
- Feature modifies data model → Consider migration strategy for existing data
- Feature adds new dependency → Evaluate bundle size impact

### Step 4: Propose Architecture Evolution

If the current architecture cannot cleanly support the feature, propose changes:

```
## Architectural Change Proposal

### Current State
[Describe what exists]

### Problem
[Why current architecture doesn't support the feature cleanly]

### Proposed Change
[Specific changes to make]

### Migration Path
[How to get from current to proposed without breaking existing functionality]

### Risk Assessment
[What could go wrong, how to mitigate]
```

## Architecture Principles (Non-Negotiable)

1. **Single Responsibility**: Each component/hook does ONE thing well
2. **Data Flows Down**: Props flow down, events flow up
3. **Colocation**: Keep related code together (component + its types + its styles)
4. **Explicit over Implicit**: No magic, clear data flow
5. **Server State via React Query**: All Supabase data goes through React Query cache
6. **SSR for First Load**: Always fetch data on server for initial page render
7. **Optimistic Updates**: Mutations update UI instantly, rollback on error
8. **Accessibility First**: Not an afterthought, built into every component
9. **Mobile First**: Design for mobile, enhance for desktop

## When to Refactor vs. Extend

**Extend** when:
- New feature is a natural addition to existing patterns
- No existing code needs to change behavior
- Bundle size impact is minimal

**Refactor** when:
- Adding the feature would create code duplication
- Existing abstraction is too narrow
- Current approach won't scale to future needs
- Technical debt is accumulating

## Common Evolution Patterns

### Adding a New Icon
1. Create icon component in `components/icons/MyIcon.tsx`
2. Accept `className` and optional `size` props
3. Export from `components/icons/index.ts` barrel file
4. Import via `@/components/icons`

### Adding a New Utility Function
1. Add function to `lib/utils.ts`
2. Export with explicit return type
3. Document usage in this file if it's a common pattern
4. Update components to use the shared utility

### Adding a New Domain Component
1. Create in `components/pain/` directory
2. Follow the component checklist in `component-patterns.md`
3. Use existing utilities (`cn`, `getPainLevelClass`)
4. Accept typed props, emit changes via callbacks

### Adding a New Data Field
1. Update `PainEntry` interface in `types/pain-entry.ts`
2. Update `DbPainEntry` interface for database schema
3. Update `dbToClient` and `clientToDb` conversion functions
4. Update database migration (Supabase)
5. Update `usePainEntries` mutations if field needs special handling
6. Update CSV export to include new field
7. Consider backward compatibility with existing data

### Adding a New Page with Data
1. Create Server Component route in `app/newpage/page.tsx`
2. Fetch data from Supabase using `createClient()` from `@/lib/supabase/server`
3. Convert database format to client format using `dbToClient`
4. Pass `initialEntries` to Client Component
5. Create Client Component in `components/pages/NewPage.tsx`
6. Use `usePainEntries(initialEntries)` for React Query hydration
7. Add to `BottomNav` if it's a primary navigation item
8. Follow `PageLayout` wrapper pattern

### Adding a New Page without Data
1. Create Server Component route in `app/newpage/page.tsx` (no data fetching)
2. Create Client Component in `components/pages/NewPage.tsx`
3. Use `usePainEntries()` without args to access React Query cache
4. Follow `PageLayout` wrapper pattern

### Adding Complex State
If state needs to be shared across multiple components:
1. **Server state** (from Supabase): Use React Query with dedicated query key
2. **UI state** (local): First try lifting state to common parent
3. If that causes prop drilling, create a custom hook
4. If hook isn't enough, consider React Context
5. Document the decision in this file

Example for new server state:
```typescript
// hooks/use-user-preferences.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PREFERENCES_KEY = ['user-preferences'] as const;

export function useUserPreferences() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: fetchPreferences,
    staleTime: 60000,
  });
  
  const updateMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
    },
  });
  
  return { preferences: data, isLoading, updatePreferences: updateMutation.mutateAsync };
}
```

### Adding External Integration
If a feature requires external services:
1. Use Supabase for data storage (already integrated)
2. For third-party APIs: Ensure proper error handling and loading states
3. Always use React Query for caching external data
4. Make it opt-in when possible, not default
5. Clearly communicate what data leaves the device
6. Provide offline fallback or graceful degradation
7. Consider if the feature truly belongs in this app

## Architecture Decision Log

Document significant decisions here:

| Date | Decision | Rationale |
|------|----------|-----------|
| Initial | Supabase for data persistence | Authenticated storage, cross-device sync capability |
| Initial | Single `usePainEntries` hook | Centralized data management |
| Initial | shadcn/ui for primitives | Accessible, customizable, no lock-in |
| Initial | CSS variables for theming | Easy dark mode, consistent design tokens |
| 2026-01 | Extract SVGs to `components/icons/` | Reusable icons, cleaner JSX |
| 2026-01 | Centralize `getPainLevelClass` in utils | Single source of truth for pain coloring |
| 2026-01 | Extract sub-components (StatsCard, etc.) | Focused components, better readability |
| 2026-01-20 | Hybrid SSR + React Query caching | Eliminate 300ms navigation delay while preserving SSR benefits. 30s staleTime with automatic background revalidation. Optimistic updates with rollback on error. Achieved 94% faster navigation (<16ms vs 300ms). |
| 2026-01-21 | Cookie-based auth with redundancy elimination | Changed middleware from `auth.getUser()` (50-150ms network request) to `auth.getSession()` (<1ms cookie read). Removed redundant auth checks in Server Components and mutations. Achieved 99% faster auth checks, 94% faster overall navigation (<17ms total). Trade-off: Session could be stale (max 1 hour), but acceptable for single-user app with auto-refresh. |

## Quality Gates

Before approving any architectural change:
- [ ] Does it maintain or improve type safety?
- [ ] Does it maintain or improve accessibility?
- [ ] Does it maintain or improve performance?
- [ ] Does it maintain or improve testability?
- [ ] Is the migration path clear and safe?
- [ ] Is it documented?
- [ ] Does `npm run build` pass?
