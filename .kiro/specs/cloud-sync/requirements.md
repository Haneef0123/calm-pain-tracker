# Requirements Document

## Introduction

This feature adds cloud storage to the Pain Diary app, replacing localStorage as the primary data store. Users authenticate once and their pain entries are automatically saved to the cloud, accessible from any device or browser. No more data loss from browser storage clearing.

## Glossary

- **API_Server**: The backend service (Next.js API routes) that handles CRUD operations for pain entries
- **Database**: PostgreSQL database storing user accounts and pain entries
- **Auth_Service**: Authentication provider handling user sign-in (Supabase Auth or similar)
- **Sync_Hook**: Client-side hook that replaces `usePainEntries` with server-backed operations

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to sign in with one click so that I can access my pain diary from any device.

#### Acceptance Criteria

1. WHEN the app loads without an authenticated session, THE App SHALL display a minimal sign-in screen with a single "Sign in with Google" button
2. WHEN the user clicks sign-in, THE Auth_Service SHALL open a Google OAuth popup
3. WHEN Google authentication succeeds, THE App SHALL automatically redirect to the main diary view
4. THE App SHALL persist the session across browser restarts (no repeated sign-ins)
5. IF authentication fails or is cancelled, THEN THE App SHALL remain on the sign-in screen with an optional retry

### Requirement 2: Server-Side Data Storage

**User Story:** As a user, I want my pain entries stored on a server so that they persist indefinitely and are accessible from any device.

#### Acceptance Criteria

1. WHEN a user adds a pain entry, THE API_Server SHALL save it to the Database
2. WHEN a user updates a pain entry, THE API_Server SHALL update it in the Database
3. WHEN a user deletes a pain entry, THE API_Server SHALL remove it from the Database
4. THE Database SHALL associate all entries with the authenticated user's ID
5. THE API_Server SHALL reject requests from unauthenticated users

### Requirement 3: Data Retrieval

**User Story:** As a user, I want to see all my pain entries when I open the app so that I can review my history.

#### Acceptance Criteria

1. WHEN the app loads with an authenticated session, THE App SHALL fetch all entries from the API_Server
2. THE API_Server SHALL return entries sorted by timestamp (newest first)
3. WHEN fetching entries, THE App SHALL display a loading state
4. IF the fetch fails, THEN THE App SHALL display an error with a retry option
5. THE App SHALL only fetch entries belonging to the authenticated user

### Requirement 4: Real-Time UI Updates

**User Story:** As a user, I want the UI to update immediately when I add or modify entries so that the app feels responsive.

#### Acceptance Criteria

1. WHEN a user adds an entry, THE App SHALL optimistically update the UI before server confirmation
2. WHEN a user updates an entry, THE App SHALL optimistically update the UI before server confirmation
3. WHEN a user deletes an entry, THE App SHALL optimistically remove it from the UI
4. IF a server operation fails, THEN THE App SHALL revert the optimistic update and show an error
5. THE App SHALL NOT block user interactions while waiting for server responses

### Requirement 5: Sign Out and Account Management

**User Story:** As a user, I want to sign out and manage my account so that I can control access to my data.

#### Acceptance Criteria

1. THE Settings_Page SHALL display the signed-in user's email
2. THE Settings_Page SHALL provide a "Sign Out" button
3. WHEN a user signs out, THE App SHALL clear the session and redirect to sign-in
4. THE Settings_Page SHALL provide a "Delete Account" option
5. WHEN a user deletes their account, THE API_Server SHALL remove all their data permanently

### Requirement 6: Error Feedback

**User Story:** As a user, I want clear feedback when something goes wrong so that I know what happened and can retry.

#### Acceptance Criteria

1. WHEN a server operation fails, THE App SHALL display a toast notification with the error
2. WHEN the network is unavailable, THE App SHALL indicate connection issues
3. WHEN an error occurs, THE App SHALL provide a way to retry the failed operation
4. THE App SHALL NOT lose user input when errors occur
