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
- Does it align with the privacy-first philosophy (no servers)?
- Does it maintain the neo-minimal design aesthetic?

### Step 3: Identify Architectural Tensions

**Red Flags - Stop and Redesign:**
- Feature requires prop drilling beyond 2 levels → Create a context or hook
- Feature needs new localStorage keys → Extend `usePainEntries` or create dedicated hook
- Feature breaks mobile-first responsive design → Rethink the UI approach
- Feature adds external API calls → Violates privacy-first principle, discuss alternatives
- Feature requires global state → Consider if React Query or context is needed
- Feature duplicates existing logic → Use shared utilities from `lib/utils.ts`
- Feature makes a component do too many things → Split into smaller components
- Feature adds inline SVGs → Extract to `components/icons/`
- Feature duplicates pain level coloring → Use `getPainLevelClass` from utils

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
5. **Privacy by Default**: All data stays on device unless user explicitly exports
6. **Accessibility First**: Not an afterthought, built into every component
7. **Mobile First**: Design for mobile, enhance for desktop

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
2. Update `usePainEntries` if new field needs special handling
3. Update CSV export/import to include new field
4. Consider backward compatibility with existing stored data

### Adding a New Page
1. Create route in `app/newpage/page.tsx`
2. Create page component in `components/pages/NewPage.tsx`
3. Add to `BottomNav` if it's a primary navigation item
4. Follow `PageLayout` wrapper pattern

### Adding Complex State
If state needs to be shared across multiple components:
1. First try lifting state to common parent
2. If that causes prop drilling, create a custom hook
3. If hook isn't enough, consider React Context
4. Document the decision in this file

### Adding External Integration
This app is privacy-first. If a feature requires external services:
1. Make it opt-in, not default
2. Clearly communicate what data leaves the device
3. Provide offline fallback
4. Consider if the feature truly belongs in this app

## Architecture Decision Log

Document significant decisions here:

| Date | Decision | Rationale |
|------|----------|-----------|
| Initial | localStorage for persistence | Privacy-first, no server needed |
| Initial | Single `usePainEntries` hook | Centralized data management |
| Initial | shadcn/ui for primitives | Accessible, customizable, no lock-in |
| Initial | CSS variables for theming | Easy dark mode, consistent design tokens |
| 2026-01 | Extract SVGs to `components/icons/` | Reusable icons, cleaner JSX |
| 2026-01 | Centralize `getPainLevelClass` in utils | Single source of truth for pain coloring |
| 2026-01 | Extract sub-components (StatsCard, etc.) | Focused components, better readability |

## Quality Gates

Before approving any architectural change:
- [ ] Does it maintain or improve type safety?
- [ ] Does it maintain or improve accessibility?
- [ ] Does it maintain or improve performance?
- [ ] Does it maintain or improve testability?
- [ ] Is the migration path clear and safe?
- [ ] Is it documented?
- [ ] Does `npm run build` pass?
