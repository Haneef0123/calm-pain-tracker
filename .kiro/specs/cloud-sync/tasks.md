# Implementation Plan: Cloud Sync

## Overview

Transform the Pain Diary from localStorage-only to Supabase-backed cloud storage. The implementation follows a bottom-up approach: database schema first, then auth, then data layer, then UI updates, and finally E2E tests.

## Tasks

- [x] 1. Set up Supabase project and database schema
  - [x] 1.1 Create Supabase project and configure environment variables
    - Create new Supabase project
    - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
    - Add environment variables to Vercel project settings
    - _Requirements: 2.1, 2.4_

  - [x] 1.2 Create pain_entries table with RLS policies
    - Run SQL to create `pain_entries` table with all columns
    - Create indexes for user_id and timestamp
    - Enable Row Level Security
    - Create SELECT, INSERT, UPDATE, DELETE policies
    - _Requirements: 2.4, 3.5_

  - [x] 1.3 Configure Google OAuth in Supabase
    - Enable Google provider in Supabase Auth settings
    - Configure OAuth credentials from Google Cloud Console
    - Set redirect URLs for localhost and production
    - _Requirements: 1.2_

- [x] 2. Implement Supabase client and auth infrastructure
  - [x] 2.1 Install Supabase packages and create client utilities
    - Install `@supabase/supabase-js` and `@supabase/ssr`
    - Create `lib/supabase/client.ts` for browser client
    - Create `lib/supabase/server.ts` for server components
    - _Requirements: 2.1_

  - [x] 2.2 Create AuthProvider context and useAuth hook
    - Create `components/providers/auth-provider.tsx` with session state
    - Implement `signInWithGoogle` and `signOut` methods
    - Create `hooks/use-auth.ts` hook that consumes context
    - _Requirements: 1.1, 1.2, 1.3, 5.2, 5.3_

  - [x] 2.3 Create auth middleware for route protection
    - Create `middleware.ts` at project root
    - Redirect unauthenticated users to `/sign-in`
    - Allow `/sign-in` route without auth
    - _Requirements: 1.1, 2.5_

  - [x] 2.4 Update root layout with AuthProvider
    - Wrap app in AuthProvider in `app/layout.tsx`
    - Ensure proper client/server component boundaries
    - _Requirements: 1.1_

- [x] 3. Create sign-in page
  - [x] 3.1 Create sign-in page UI
    - Create `app/sign-in/page.tsx`
    - Minimal design: logo, tagline, single "Sign in with Google" button
    - Handle loading state during OAuth flow
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Implement OAuth callback handling
    - Handle successful auth redirect to home page
    - Handle auth errors/cancellation gracefully
    - _Requirements: 1.3, 1.5_

- [x] 4. Update data layer to use Supabase
  - [x] 4.1 Update PainEntry types for database schema
    - Update `types/pain-entry.ts` with snake_case fields
    - Add `user_id`, `created_at`, `updated_at` fields
    - Create type helpers for camelCase ↔ snake_case conversion
    - _Requirements: 2.4_

  - [x] 4.2 Rewrite usePainEntries hook for Supabase
    - Replace localStorage with Supabase queries
    - Implement optimistic updates with rollback
    - Maintain same public interface for backward compatibility
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.3 Add error handling and toast notifications
    - Show toast on server errors
    - Implement retry mechanism for failed operations
    - Handle network connectivity issues
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [-] 5. Update Settings page with account management
  - [x] 5.1 Add user info and sign-out to Settings
    - Display signed-in user's email
    - Add "Sign Out" button with confirmation
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.2 Implement account deletion
    - Add "Delete Account" button with confirmation dialog
    - Call Supabase to delete user and cascade entries
    - Redirect to sign-in after deletion
    - _Requirements: 5.4, 5.5_

- [x] 6. Checkpoint - Manual verification
  - Verify sign-in flow works end-to-end
  - Verify CRUD operations persist to database
  - Verify sign-out clears session
  - Ask user if any issues arise

- [x] 7. Set up E2E test infrastructure
  - [x] 7.1 Create Supabase test project and configure test environment
    - Create separate Supabase project for testing
    - Add test environment variables
    - Create test user accounts via Admin API
    - _Requirements: All_

  - [x] 7.2 Install and configure Playwright
    - Install Playwright and dependencies
    - Configure for Next.js app
    - Set up test fixtures for auth state
    - _Requirements: All_

  - [x] 7.3 Install fast-check for property-based testing
    - Install `fast-check` package
    - Create pain entry generators
    - _Requirements: All_

- [x] 8. Implement E2E tests for core flows
  - [x] 8.1 Write auth flow E2E tests
    - Test: unauthenticated user redirected to sign-in
    - Test: successful sign-in redirects to home
    - Test: sign-out clears session and redirects
    - _Requirements: 1.1, 1.3, 5.3_

  - [x] 8.2 Write property test for CRUD round-trip (Property 1)
    - **Property 1: CRUD Round-Trip Consistency**
    - Generate random entries, create via API, fetch, verify match
    - Test update persistence
    - Test delete removes entry
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 8.3 Write property test for timestamp ordering (Property 2)
    - **Property 2: Timestamp Ordering**
    - Generate entries with random timestamps
    - Fetch all, verify descending order
    - **Validates: Requirements 3.2**

  - [x] 8.4 Write property test for user isolation (Property 3)
    - **Property 3: User Data Isolation**
    - Create entries as User A
    - Query as User B, verify empty result
    - **Validates: Requirements 2.4, 3.5**

  - [x] 8.5 Write test for auth enforcement (Property 4)
    - **Property 4: Authentication Enforcement**
    - Make API calls without auth token
    - Verify 401/403 responses
    - **Validates: Requirements 2.5**

  - [x] 8.6 Write test for account deletion (Property 5)
    - **Property 5: Account Deletion Completeness**
    - Create entries, delete account
    - Query database directly, verify no entries
    - **Validates: Requirements 5.5**

- [x] 9. Final checkpoint - All tests pass
  - Run `npm run build` to verify no build errors
  - Run E2E test suite
  - Ensure all tests pass
  - Ask user if questions arise

## Notes

- All tasks are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties against real backend
- No mocking - all tests hit actual Supabase instance
