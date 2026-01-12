# Design Document: Cloud Sync

## Overview

This design transforms the Pain Diary from a localStorage-only app to a cloud-backed application using Supabase as the backend. Users authenticate with Google, and all pain entries are stored in a PostgreSQL database. The existing UI remains largely unchanged - we're replacing the data layer, not the presentation layer.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App (Vercel)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Sign-In    │  │   Pages     │  │    Settings         │  │
│  │  Page       │  │  (Today,    │  │    (Account,        │  │
│  │             │  │   History,  │  │     Sign Out)       │  │
│  │             │  │   Trends)   │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │ AuthProvider │ (Supabase session)        │
│                   └──────┬──────┘                            │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │usePainEntries│ (replaces localStorage)   │
│                   └──────┬──────┘                            │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │Supabase     │                            │
│                   │Client       │                            │
│                   └──────┬──────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Hosted)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Auth       │  │  Database   │  │  Row Level          │  │
│  │  (Google    │  │  (Postgres) │  │  Security (RLS)     │  │
│  │   OAuth)    │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Supabase Client Configuration

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 2. Auth Provider

Wraps the app to provide authentication state:

```typescript
// components/providers/auth-provider.tsx
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

### 3. Updated usePainEntries Hook

The hook interface remains identical to preserve backward compatibility with existing components:

```typescript
// hooks/use-pain-entries.ts (updated)
interface UsePainEntriesReturn {
  entries: PainEntry[];
  isLoaded: boolean;
  addEntry: (entry: Omit<PainEntry, 'id' | 'timestamp' | 'user_id'>) => Promise<PainEntry>;
  updateEntry: (id: string, updates: Partial<PainEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearAllEntries: () => Promise<void>;
  exportToCsv: () => void;
  // importFromCsv removed - migration handles this once
}
```

Key changes:
- Operations are now async (return Promises)
- Optimistic updates for instant UI feedback
- Rollback on server errors
- `user_id` added to entries (handled internally)

### 4. Sign-In Page

New page at `/sign-in` that displays when user is not authenticated:

```typescript
// app/sign-in/page.tsx
// Minimal UI: logo, tagline, "Sign in with Google" button
```

### 5. Auth Middleware

Protects routes and redirects unauthenticated users:

```typescript
// middleware.ts
// Checks session, redirects to /sign-in if not authenticated
// Allows /sign-in route without auth
```

### 6. Migration Component

One-time migration of localStorage data:

```typescript
// components/migration-dialog.tsx
// Shows when: user signs in AND localStorage has entries
// Actions: "Import X entries" or "Start fresh"
```

## Data Models

### Database Schema (Supabase)

```sql
-- Users table (managed by Supabase Auth)
-- auth.users contains: id, email, created_at, etc.

-- Pain entries table
CREATE TABLE pain_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pain_level INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
  locations TEXT[] NOT NULL DEFAULT '{}',
  types TEXT[] NOT NULL DEFAULT '{}',
  radiating BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX idx_pain_entries_user_id ON pain_entries(user_id);
CREATE INDEX idx_pain_entries_timestamp ON pain_entries(user_id, timestamp DESC);

-- Row Level Security
ALTER TABLE pain_entries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own entries
CREATE POLICY "Users can view own entries"
  ON pain_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own entries
CREATE POLICY "Users can insert own entries"
  ON pain_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own entries
CREATE POLICY "Users can update own entries"
  ON pain_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own entries
CREATE POLICY "Users can delete own entries"
  ON pain_entries FOR DELETE
  USING (auth.uid() = user_id);
```

### TypeScript Types

```typescript
// types/pain-entry.ts (updated)
export interface PainEntry {
  id: string;
  user_id: string;
  timestamp: string;
  pain_level: number;  // renamed from painLevel for DB consistency
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

// For creating new entries (user_id, id, timestamps handled by DB)
export type NewPainEntry = Omit<PainEntry, 'id' | 'user_id' | 'timestamp' | 'created_at' | 'updated_at'>;
```

### Field Mapping

Current localStorage format → Database format:
- `id` → `id` (UUID, same)
- `timestamp` → `timestamp` (ISO string → TIMESTAMPTZ)
- `painLevel` → `pain_level` (camelCase → snake_case)
- `locations` → `locations` (string[] → TEXT[])
- `types` → `types` (string[] → TEXT[])
- `radiating` → `radiating` (boolean, same)
- `notes` → `notes` (string, same)
- (new) `user_id` → foreign key to auth.users
- (new) `created_at` → audit timestamp
- (new) `updated_at` → audit timestamp



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CRUD Round-Trip Consistency

*For any* valid pain entry data, adding it to the database and then fetching entries should return an entry with matching data. *For any* existing entry and valid update, updating then fetching should return the updated values. *For any* existing entry, deleting then fetching should not include that entry.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Timestamp Ordering

*For any* set of pain entries belonging to a user, when fetched from the API, the entries SHALL be ordered by timestamp in descending order (newest first).

**Validates: Requirements 3.2**

### Property 3: User Data Isolation

*For any* two distinct users A and B, user A SHALL never be able to read, update, or delete entries belonging to user B. The set of entries visible to user A SHALL contain only entries where `user_id` equals A's ID.

**Validates: Requirements 2.4, 3.5**

### Property 4: Authentication Enforcement

*For any* API request to pain_entries endpoints without a valid authentication token, the server SHALL respond with a 401 or 403 status code and return no entry data.

**Validates: Requirements 2.5**

### Property 5: Account Deletion Completeness

*For any* user who deletes their account, after deletion completes, querying the database for entries with that user's ID SHALL return zero results.

**Validates: Requirements 5.5**

### Property 6: Error State Recovery

*For any* failed server operation, the UI state SHALL remain consistent (no partial updates) and the user SHALL be able to retry the operation.

**Validates: Requirements 6.1, 6.3**

## Error Handling

### Authentication Errors

| Error | Cause | Handling |
|-------|-------|----------|
| OAuth popup blocked | Browser settings | Show message: "Please allow popups for this site" |
| OAuth cancelled | User closed popup | Stay on sign-in page, no error shown |
| OAuth failed | Google error | Show: "Sign-in failed. Please try again." |
| Session expired | Token expired | Redirect to sign-in, preserve URL for return |

### Database Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Network error | No connectivity | Show toast: "Unable to save. Check your connection." + retry button |
| Conflict (409) | Concurrent edit | Refetch and show latest data |
| Not found (404) | Entry deleted elsewhere | Remove from local state, show toast |
| Server error (5xx) | Supabase issue | Show toast: "Server error. Please try again." |

### Optimistic Update Rollback

When a server operation fails after optimistic update:
1. Revert local state to pre-operation value
2. Show error toast with description
3. Log error for debugging
4. Do NOT retry automatically (user must trigger)

### Migration Errors

Migration feature removed - app not yet public, no existing users to migrate.

## Testing Strategy

### End-to-End Integration Tests

The primary testing approach is **E2E integration tests that hit the actual Supabase backend**. This validates the real system behavior, not mocked abstractions.

**Test Environment:**
- Dedicated Supabase test project (separate from production)
- Test user accounts created via Supabase Admin API
- Tests run against real database with real RLS policies
- Cleanup after each test run

**E2E Test Scenarios:**

1. **Authentication Flow**
   - Sign in with test account → verify session created
   - Access protected route without auth → verify redirect to sign-in
   - Sign out → verify session cleared

2. **CRUD Operations (Property 1)**
   - Create entry → fetch → verify data matches
   - Update entry → fetch → verify changes persisted
   - Delete entry → fetch → verify entry gone

3. **Data Ordering (Property 2)**
   - Create multiple entries with different timestamps
   - Fetch all → verify descending timestamp order

4. **User Isolation (Property 3)**
   - Create entries as User A
   - Sign in as User B
   - Fetch entries → verify User A's entries not visible

5. **Auth Enforcement (Property 4)**
   - Make direct API call without auth token
   - Verify 401/403 response

6. **Account Deletion (Property 5)**
   - Create entries as test user
   - Delete account
   - Query database directly → verify no entries remain

**Test Framework:**
- Playwright for browser-based E2E tests
- Direct Supabase client for API-level tests
- Test data generators using `fast-check` for property-based scenarios

**Property-Based E2E Tests:**

Using `fast-check` to generate test data, then executing against real backend:

```typescript
// Example: CRUD round-trip property test
test('Property 1: CRUD operations persist correctly', async () => {
  await fc.assert(
    fc.asyncProperty(painEntryArbitrary, async (entryData) => {
      // Create entry via real API
      const created = await supabase.from('pain_entries').insert(entryData).select().single();
      
      // Fetch and verify
      const fetched = await supabase.from('pain_entries').select().eq('id', created.data.id).single();
      
      expect(fetched.data.pain_level).toBe(entryData.pain_level);
      expect(fetched.data.locations).toEqual(entryData.locations);
      // ... verify all fields
      
      // Cleanup
      await supabase.from('pain_entries').delete().eq('id', created.data.id);
    }),
    { numRuns: 100 }
  );
});
```

### Minimal Unit Tests

Only for pure functions that don't touch the backend:
- Date formatting utilities
- CSV export string generation
- Pain level color classification

### No Mocking Policy

- Do NOT mock Supabase client
- Do NOT mock network requests
- Tests must hit real backend to catch RLS policy issues, schema mismatches, etc.

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For local development, these are safe to commit to .env.example
# Production values should be set in Vercel environment variables
```

## File Structure Changes

```
app/
├── sign-in/
│   └── page.tsx              # New: Sign-in page
├── layout.tsx                # Modified: Add AuthProvider
├── page.tsx                  # Unchanged
└── ...

components/
├── providers/
│   └── auth-provider.tsx     # New: Auth context provider
└── ...

hooks/
├── use-pain-entries.ts       # Modified: Supabase instead of localStorage
└── use-auth.ts               # New: Auth hook (wraps context)

lib/
├── supabase/
│   ├── client.ts             # New: Browser client
│   ├── server.ts             # New: Server client (for middleware)
│   └── middleware.ts         # New: Auth middleware helper
└── utils.ts                  # Unchanged

middleware.ts                 # New: Route protection

types/
└── pain-entry.ts             # Modified: Add user_id, snake_case fields
```
