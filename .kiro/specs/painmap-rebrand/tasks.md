# Implementation Plan: PainMap Rebrand

## Overview

This plan outlines the step-by-step implementation of the PainMap rebrand. All changes are content-only (no logic changes), making this a low-risk, straightforward implementation. The tasks are organized to build incrementally, with checkpoints to ensure quality.

## Tasks

- [x] 1. Update application metadata and branding
  - Update `app/layout.tsx` metadata: title to "PainMap", description to "See your pain more clearly."
  - Update `app/sign-in/page.tsx` to display "PainMap" instead of "Pain Diary"
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Update bottom navigation labels
  - Update `components/layout/BottomNav.tsx` navigation labels
  - Change "History" to "Past days"
  - Change "Trends" to "Patterns"
  - Update route path: `/trends` → `/patterns` (keep `/history` and `/settings` unchanged)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2_

- [x] 3. Create new route pages and redirects
  - [x] 3.1 Create `app/patterns/page.tsx` (copy from `app/trends/page.tsx`)
    - Import and render `Trends` component
    - _Requirements: 9.2_
  
  - [x] 3.2 Convert `app/trends/page.tsx` to redirect to `/patterns`
    - Use Next.js `redirect()` function
    - _Requirements: 9.4_

- [x] 4. Update Past Days page (History)
  - [x] 4.1 Update page header in `components/pages/History.tsx`
    - Change "History" to "Past days"
    - _Requirements: 3.1_
  
  - [x] 4.2 Update empty state message
    - Replace two-line message with single line: "Once you log a few days, patterns will start to appear here."
    - _Requirements: 5.1, 5.2_

- [x] 5. Update Patterns page (Trends)
  - [x] 5.1 Update page header in `components/pages/Trends.tsx`
    - Change "Trends" to "Patterns"
    - _Requirements: 3.2_
  
  - [x] 5.2 Update empty state message (no entries)
    - Replace with: "Once you log a few days, patterns will start to appear here."
    - _Requirements: 6.1, 6.3_
  
  - [x] 5.3 Update insufficient data message (< 2 entries)
    - Replace with: "Patterns need time. A few more days will make this clearer."
    - _Requirements: 6.2, 6.3_
  
  - [x] 5.4 Remove unused import
    - Remove `isSameDay` from date-fns imports (currently unused)
    - _Requirements: N/A (code cleanup)_

- [x] 6. Checkpoint - Test navigation and page headers
  - Verify all navigation labels are updated
  - Verify all page headers match navigation labels
  - Test old route redirects properly (`/trends` → `/patterns`)
  - Verify `/history` and `/settings` still work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update Daily Entry form labels
  - [x] 7.1 Update notes label and placeholder
    - Change label from "Notes (optional)" to "Anything worth noting?"
    - Change placeholder from "How are you feeling today?" to "Sleep, posture, stress, travel, food — whatever stands out."
    - _Requirements: 4.3, 4.4_
  
  - [x] 7.2 Update save button text
    - Change "Save Entry" to "Log today"
    - _Requirements: 4.5_
  
  - [x] 7.3 Update success toast message
    - Change toast title to "Noted."
    - Remove toast description entirely
    - _Requirements: 4.6_

- [x] 8. Settings page - No changes needed
  - Settings page maintains current implementation
  - Header shows "Settings"
  - All functionality preserved (export, clear, sign out, delete account)

- [x] 9. Final checkpoint - Comprehensive testing
  - Run `npm run build` and verify no errors
  - Test all empty states with cleared data
  - Test form with new labels
  - Test toast message after saving entry
  - Test CSV export (verify format unchanged)
  - Test on mobile (verify nav labels fit)
  - Test dark mode (verify no visual regressions)
  - Test old bookmarks/links redirect properly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update documentation (if applicable)
  - Update README.md if it references old terminology
  - Update any developer documentation
  - _Requirements: N/A (optional)_

## Notes

- All tasks involve content changes only (no logic modifications)
- No data migration required (all data structures unchanged)
- Component file names remain unchanged (only route folders change)
- Old routes redirect for backward compatibility
- Build must pass before considering tasks complete
- Each checkpoint ensures incremental validation

## Deployment Checklist

Before deploying:
- [ ] All tasks marked complete
- [ ] `npm run build` passes with no errors
- [ ] Manual testing checklist completed
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Dark mode tested
- [ ] Mobile responsive tested

After deploying:
- [ ] Submit updated sitemap to Google Search Console
- [ ] Monitor for any 404 errors
- [ ] Verify PWA updates correctly
- [ ] Test on production with real user data
