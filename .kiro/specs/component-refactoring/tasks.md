# Implementation Plan: Component Refactoring

## Overview

This plan implements the component refactoring to extract inline SVGs, consolidate utility functions, and create focused sub-components. Tasks are ordered to build incrementally, with utility functions first, then icons, then sub-components, and finally integration.

## Tasks

- [x] 1. Add getPainLevelClass utility function
  - Add `getPainLevelClass(level: number): string` to `lib/utils.ts`
  - Return `'text-foreground'` for levels 0-6, `'text-destructive'` for 7-10
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Create icon components directory and icons
  - [x] 2.1 Create GoogleIcon component
    - Create `components/icons/GoogleIcon.tsx`
    - Extract Google logo SVG from `app/sign-in/page.tsx`
    - Accept `className` and `size` props
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 2.2 Create SpinnerIcon component
    - Create `components/icons/SpinnerIcon.tsx`
    - Extract spinner SVG from `app/sign-in/page.tsx`
    - Include `animate-spin` class, accept `className` and `size` props
    - _Requirements: 1.2, 1.3, 1.4_

- [x] 3. Update sign-in page to use icon components
  - Import `GoogleIcon` and `SpinnerIcon` from `@/components/icons`
  - Replace inline SVGs with icon components
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 4. Create HistoryEntryCard sub-component
  - Create `components/pain/HistoryEntryCard.tsx`
  - Accept `entry`, `isExpanded`, `onToggle`, `onDelete` props
  - Render collapsed view with pain level, date, locations preview
  - Render expanded view with full details and delete dialog
  - Use `getPainLevelClass` for pain level coloring
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Update History page to use HistoryEntryCard
  - Import `HistoryEntryCard` from `@/components/pain`
  - Replace inline entry rendering with `HistoryEntryCard` component
  - Import `getPainLevelClass` from `@/lib/utils`
  - _Requirements: 3.1, 7.2_

- [x] 6. Create StatsCard sub-component
  - Create `components/pain/StatsCard.tsx`
  - Accept `label`, `value`, `showPainColor`, `className` props
  - Use `getPainLevelClass` when `showPainColor` is true
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Create TimeRangeSelector sub-component
  - Create `components/pain/TimeRangeSelector.tsx`
  - Accept `value` and `onChange` props
  - Render buttons for '7d', '30d', 'all' options
  - Apply selected styling to current value
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Update Trends page to use new sub-components
  - Import `StatsCard` and `TimeRangeSelector` from `@/components/pain`
  - Replace inline stats rendering with `StatsCard` components
  - Replace inline time range buttons with `TimeRangeSelector`
  - Import `getPainLevelClass` from `@/lib/utils`
  - _Requirements: 4.1, 5.1, 7.3_

- [x] 9. Create AccountInfo sub-component
  - Create `components/pain/AccountInfo.tsx`
  - Accept `email` and `entryCount` props
  - Render user icon, email (or "Not signed in"), and entry count
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 10. Update Settings page to use AccountInfo
  - Import `AccountInfo` from `@/components/pain`
  - Replace inline account section with `AccountInfo` component
  - _Requirements: 6.1, 7.1_

- [x] 11. Update DailyEntry to use centralized utility
  - Import `getPainLevelClass` from `@/lib/utils`
  - Remove local `getPainClass` function
  - _Requirements: 2.5, 7.1_

- [x] 12. Final verification
  - Run `npm run build` to verify no TypeScript errors
  - Verify all pages render correctly
  - _Requirements: 7.5, 8.4, 8.5_

## Notes

- Each task builds on previous tasks
- Icon components are created before being used in sign-in page
- Sub-components are created before being integrated into parent pages
- Utility function is created first as it's used by multiple components
