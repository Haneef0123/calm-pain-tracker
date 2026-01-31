# Design Document: PainMap Rebrand

## Overview

This design outlines the implementation approach for transforming "Pain Diary" into "PainMap" with a complete language and content overhaul. The rebrand is a **content-only change** with no architectural modifications, making it low-risk and straightforward to implement.

The transformation shifts the app's voice from clinical/instructional to observational/calm, aligning with the brand principle: "PainMap should feel like a quiet notebook that never judges."

## Architecture

### No Structural Changes

This rebrand is purely a **content transformation**:
- No new components needed
- No state management changes
- No data model changes
- No routing changes
- No styling changes (colors, layout, spacing remain identical)

### Affected Layers

1. **Metadata Layer** (`app/layout.tsx`)
   - Application title and description

2. **Navigation Layer** (`components/layout/BottomNav.tsx`)
   - Bottom navigation labels

3. **Page Layer** (`components/pages/*.tsx`)
   - Page headers
   - Empty state messages
   - Form labels and placeholders
   - Button text
   - Toast messages

4. **Sign-in Layer** (`app/sign-in/page.tsx`)
   - Brand name display

## Components and Interfaces

### 1. Application Metadata

**File:** `app/layout.tsx`

**Current State:**
```typescript
export const metadata: Metadata = {
    title: 'Pain Diary',
    description: 'Privacy-first pain tracking',
    // ...
};
```

**New State:**
```typescript
export const metadata: Metadata = {
    title: 'PainMap',
    description: 'See your pain more clearly.',
    // ...
};
```

**Impact:** Browser tab title, PWA name, search engine results

---

### 2. Route Structure Changes

**New Routes Required:**

1. **Past Days Page**
   - Keep: `app/history/page.tsx` (no changes to route)
   - Update: Component content only (labels, empty states)

2. **Patterns Page**
   - Exists: `app/patterns/page.tsx`
   - Component: Reuses `Trends.tsx` component

3. **Settings Page**
   - Keep: `app/settings/page.tsx` (no changes to route)
   - Component: Uses `Settings.tsx` component

**Redirect Implementation:**
```typescript
// app/trends/page.tsx
import { redirect } from 'next/navigation';

export default function TrendsRedirect() {
    redirect('/patterns');
}
```

**Design Rationale:**
- Keep `/history` unchanged (most commonly bookmarked, best SEO)
- Keep `/settings` unchanged
- Update `/trends` to redirect to `/patterns` to match new terminology
- Old `/trends` route redirects for backward compatibility (bookmarks, external links)

**Design Rationale:**
- Keep `/history` unchanged (most commonly bookmarked, best SEO)
- Update `/trends` and `/settings` to match new terminology
- Old routes redirect for backward compatibility (bookmarks, external links)
- Component files can be reused (no need to rename)

---

### 3. Bottom Navigation

**File:** `components/layout/BottomNav.tsx`

**Current State:**
```typescript
const navItems = [
  { path: '/', icon: Calendar, label: 'Today' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/trends', icon: TrendingUp, label: 'Trends' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];
```

**New State:**
```typescript
const navItems = [
  { path: '/', icon: Calendar, label: 'Today' },
  { path: '/history', icon: History, label: 'Past days' },
  { path: '/patterns', icon: TrendingUp, label: 'Patterns' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];
```

**Design Decision:** Keep `/history` and `/settings` routes unchanged for SEO and simplicity. Use `/patterns` as the new route (no redirect needed). The Settings page displays "Settings" as both the label and page header.

---

### 4. Sign-in Page

**File:** `app/sign-in/page.tsx`

**Current State:**
```typescript
<h1 className="text-display text-3xl font-semibold tracking-tight">
    Pain Diary
</h1>
```

**New State:**
```typescript
<h1 className="text-display text-3xl font-semibold tracking-tight">
    PainMap
</h1>
```

---

### 5. Past Days Page (formerly History)

**File:** `app/history/page.tsx` and `components/pages/History.tsx`

**Changes:**

1. **Page Header:**
   ```typescript
   // Before:
   <h1 className="text-heading">History</h1>
   
   // After:
   <h1 className="text-heading">Past days</h1>
   ```

2. **Empty State:**
   ```typescript
   // Before:
   <p className="text-muted-foreground">No entries yet.</p>
   <p className="text-label mt-2">Start tracking your pain on the Today tab.</p>
   
   // After:
   <p className="text-muted-foreground">
       Once you log a few days, patterns will start to appear here.
   </p>
   ```

**Design Rationale:**
- Single-line message is cleaner, less overwhelming
- "Patterns will appear" sets expectation without pressure
- Removes instructional "Start tracking" directive

---

### 6. Patterns Page (formerly Trends)

**File:** `components/pages/Trends.tsx` (component reused, route changes)

**Changes:**

1. **Page Header:**
   ```typescript
   // Before:
   <h1 className="text-heading">Trends</h1>
   
   // After:
   <h1 className="text-heading">Patterns</h1>
   ```

2. **Empty State (no entries):**
   ```typescript
   // Before:
   <p className="text-muted-foreground">No data yet.</p>
   <p className="text-label mt-2">Start tracking to see trends.</p>
   
   // After:
   <p className="text-muted-foreground">
       Once you log a few days, patterns will start to appear here.
   </p>
   ```

3. **Insufficient Data State (< 2 entries):**
   ```typescript
   // Before:
   <p className="text-muted-foreground">Need at least 2 entries to show a chart.</p>
   <p className="text-label mt-2">Keep tracking to see your pain trends.</p>
   
   // After:
   <p className="text-muted-foreground">
       Patterns need time. A few more days will make this clearer.
   </p>
   ```

4. **Remove unused import:**
   ```typescript
   // Remove: isSameDay (currently imported but unused)
   ```

**Design Rationale:**
- "Patterns" is more observational than "Trends" (which implies analysis/prediction)
- "Patterns need time" acknowledges the reality without being prescriptive
- Avoids technical language like "at least 2 entries"

---

### 7. Daily Entry Form

**File:** `components/pages/DailyEntry.tsx`

**Changes:**

1. **Pain Level Label:**
   ```typescript
   // Current implementation (not changed):
   <p className="text-label">
       Pain Level <span className="text-destructive">*</span>
   </p>
   ```

2. **Location Label:**
   ```typescript
   // Current implementation (not changed):
   <ChipSelect
       label="Location *"
       // ...
   />
   ```

3. **Notes Label and Placeholder:**
   ```typescript
   // Before:
   <Label htmlFor="notes" className="text-label">
       Notes (optional)
   </Label>
   <Textarea
       placeholder="How are you feeling today?"
       // ...
   />
   
   // After:
   <Label htmlFor="notes" className="text-label">
       Anything worth noting?
   </Label>
   <Textarea
       placeholder="Sleep, posture, stress, travel, food — whatever stands out."
       // ...
   />
   ```

4. **Save Button:**
   ```typescript
   // Before:
   <Button>Save Entry</Button>
   
   // After:
   <Button>Log today</Button>
   ```

5. **Success Toast:**
   ```typescript
   // Before:
   toast({
       title: 'Entry saved',
       description: 'Your pain entry has been recorded.',
   });
   
   // After:
   toast({
       title: 'Noted.',
   });
   // Remove description entirely
   ```

**Design Rationale:**
- "Anything worth noting?" is more conversational than "Notes (optional)"
- Notes placeholder gives concrete examples without being prescriptive
- "Log today" is simpler than "Save Entry"
- "Noted." is minimal, calm acknowledgment (no unnecessary description)

---

### 8. Settings Page (formerly Settings)

**File:** `components/pages/Settings.tsx` (component reused, route changes)

**Changes:**

1. **Page Header:**
   ```typescript
   // Before:
   <h1 className="text-heading">Settings</h1>
   
   // After:
   <h1 className="text-heading">Settings</h1>
   ```
   <div className="mb-8 space-y-4 text-sm text-muted-foreground">
       <p>
           PainMap is a simple way to record pain and notice patterns over time.
       </p>
       <p>
           It doesn't diagnose or treat — it helps you remember what your body 
           is already telling you.
       </p>
       <p>
           Built for people living with pain, not for tracking perfection.
       </p>
   </div>
   
   <div className="h-px bg-border my-6" />
   ```

**Design Rationale:**
- Maintains all existing functionality (export, clear, sign out, delete)

---

## Data Models

**No changes required.** All data structures remain identical:
- `PainEntry` interface unchanged
- localStorage keys unchanged
- Database schema unchanged
- CSV export format unchanged

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Brand Consistency

*For any* page in the application, all references to the application name should be "PainMap" (not "Pain Diary").

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Navigation Label Consistency

*For any* navigation item, the label displayed in the bottom navigation should match the corresponding page header.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3**

### Property 3: Observational Language Compliance

*For any* user-facing text in the application, the text should not contain motivational phrases (e.g., "Great job", "Keep it up"), medical/diagnostic terms (e.g., "diagnosis", "treatment"), gamified language (e.g., "streak", "goal"), or productivity language (e.g., "optimize", "maximize").

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 4: Empty State Message Consistency

*For any* empty state on the Past days or Patterns pages, the message should reference "patterns" and "a few days" without using instructional language like "Start tracking" or technical requirements like "at least 2 entries".

**Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.3**

### Property 5: Form Label Consistency

*For any* form input field, the label should match the current implementation and be clear and accessible.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 6: Toast Message Minimalism

*For any* success toast notification, the message should be brief and observational (e.g., "Noted.") without unnecessary descriptions or motivational language.

**Validates: Requirements 4.7**

### Property 7: Data Preservation

*For any* existing user data, after deploying the rebrand, all pain entries should remain accessible and unchanged in structure.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

## Error Handling

**No new error cases introduced.** This is a content-only change with no new functionality.

Existing error handling remains:
- Form validation (pain level > 0, at least one location)
- CSV import/export errors
- Authentication errors
- Database sync errors

## Testing Strategy

### Unit Tests

Focus on verifying text content changes:

1. **Metadata Test**
   - Verify `metadata.title === 'PainMap'`
   - Verify `metadata.description === 'See your pain more clearly.'`

2. **Navigation Test**
   - Verify nav labels: "Today", "Past days", "Patterns", "Settings"
   - Verify routes: "/", "/history", "/patterns", "/settings"

3. **Page Header Tests**
   - Verify Past days page shows "Past days" at `/history`
   - Verify Patterns page shows "Patterns" at `/patterns`
   - Verify Settings page shows "About" at `/settings`
   - Verify old route redirects properly (`/trends` → `/patterns`)

4. **Empty State Tests**
   - Verify Past days empty state contains "Once you log a few days"
   - Verify Patterns empty state contains "Once you log a few days"
   - Verify Patterns insufficient data state contains "Patterns need time"

5. **Form Label Tests**
   - Verify pain level label is "Pain Level *"
   - Verify location label is "Location *"
   - Verify notes label is "Anything worth noting?"
   - Verify save button is "Log today"

6. **Toast Test**
   - Verify success toast shows "Noted." (no description)

### Property-Based Tests

1. **Property Test: Brand Name Consistency**
   - Generate random page snapshots
   - Verify no occurrence of "Pain Diary" in rendered output
   - Verify "PainMap" appears in expected locations

2. **Property Test: Observational Language**
   - Generate list of all user-facing strings
   - Verify no motivational/medical/gamified/productivity terms
   - Use regex patterns to detect violations

3. **Property Test: Data Preservation**
   - Generate random pain entries
   - Save to localStorage
   - Deploy rebrand (simulate)
   - Verify all entries still accessible and unchanged

### Manual Testing Checklist

- [ ] Clear browser cache and verify PWA name is "PainMap"
- [ ] Navigate to each page and verify headers match nav labels
- [ ] Verify `/history` shows "Past days" header
- [ ] Verify `/patterns` shows "Patterns" header
- [ ] Verify `/settings` shows "Settings" header
- [ ] Clear all data and verify empty states show new messages
- [ ] Add 1 entry and verify Patterns page shows "Patterns need time"
- [ ] Fill out form and verify all labels are updated
- [ ] Save entry and verify toast shows "Noted."
- [ ] Export CSV and verify format unchanged
- [ ] Sign out and verify sign-in page shows "PainMap"
- [ ] Test on mobile to verify nav labels fit properly
- [ ] Test dark mode to ensure no visual regressions
- [ ] Test bookmarks to old routes still work (via redirects)

### Build Verification

```bash
npm run build
```

Must pass with:
- No TypeScript errors
- No unused imports (remove `isSameDay` from Trends.tsx)
- No linting errors
- Successful production build

## Implementation Notes

### Deployment Strategy

**Recommended: Single atomic deployment**

This rebrand should be deployed all at once (not incrementally) because:
- Mixed old/new language would be confusing
- Changes are interdependent (nav labels should match page headers)
- Low risk (content-only, no logic changes)
- Easy to revert if needed

### Rollback Plan

If issues arise:
1. Revert the single commit containing all changes
2. Redeploy previous version
3. No data migration needed (data unchanged)

### Performance Impact

**None.** Text changes have negligible impact on:
- Bundle size (slightly smaller due to shorter strings)
- Runtime performance (identical)
- Load time (identical)

### Accessibility Impact

**Neutral to positive:**
- Shorter, clearer labels improve screen reader experience
- Question-based labels are more intuitive
- No ARIA changes needed
- Color contrast unchanged

### SEO Impact

**Minimal:**
- `/history`, `/patterns`, and `/settings` routes are stable (no SEO impact)
- Search engines will eventually update to new URLs
- Title change from "Pain Diary" to "PainMap" may affect search rankings temporarily

**Mitigation:**
- All routes are stable and direct (no redirects needed)
- Update any external links you control
- Submit updated sitemap to Google Search Console if needed

### Analytics Considerations

If you track user behavior:
- Update event names/labels to reflect new terminology
- Monitor empty state engagement (new messaging may affect behavior)
- Track form completion rates (new labels may improve clarity)

## Future Considerations

### Localization

When adding i18n support:
- Extract all strings to translation files
- Maintain observational tone in all languages
- Consider cultural differences in pain communication

### A/B Testing

Could test:
- Old vs. new empty state messages (engagement metrics)
- Old vs. new form labels (completion rates)
- Old vs. new toast messages (user satisfaction)

### Voice and Tone Guide

Document the PainMap voice for future content:
- Observational, not instructional
- Calm, not motivational
- Human, not clinical
- Patient, not urgent
- Honest, not aspirational
