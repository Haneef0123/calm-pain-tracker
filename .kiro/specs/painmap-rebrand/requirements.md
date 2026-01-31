# Requirements Document: PainMap Rebrand

## Introduction

This specification defines the complete content and language transformation from "Pain Diary" to "PainMap". The rebrand shifts the app's tone from clinical/instructional to observational/calm, positioning PainMap as a quiet, non-judgmental companion for people living with chronic pain.

## Glossary

- **PainMap**: The new brand name for the application (formerly "Pain Diary")
- **Observational Language**: Neutral, pattern-focused language that describes what is happening without judgment or instruction
- **Empty State**: UI state shown when no data exists or insufficient data is available
- **Navigation Label**: Text labels in the bottom navigation bar
- **Form Label**: Text labels for input fields in the pain entry form
- **Toast Message**: Brief notification shown after user actions
- **Page Header**: The main heading (h1) displayed at the top of each page

## Requirements

### Requirement 1: Brand Identity Update

**User Story:** As a user, I want to see consistent PainMap branding throughout the app, so that I understand what application I'm using.

#### Acceptance Criteria

1. THE App SHALL display "PainMap" as the application title in metadata
2. THE App SHALL display "PainMap" on the sign-in page
3. THE App SHALL use the tagline "See your pain more clearly." in metadata description
4. THE App SHALL maintain "PainMap" branding consistently across all pages

### Requirement 2: Navigation Language Update

**User Story:** As a user, I want navigation labels that reflect the observational nature of the app, so that I understand the purpose of each section.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL display "Today" for the home/daily entry page
2. THE Bottom_Navigation SHALL display "Past days" instead of "History"
3. THE Bottom_Navigation SHALL display "Patterns" instead of "Trends"
4. THE Bottom_Navigation SHALL display "Settings" (keeping current label)

### Requirement 3: Page Header Updates

**User Story:** As a user, I want page headers that match the navigation labels, so that I know where I am in the app.

#### Acceptance Criteria

1. THE Past_Days_Page SHALL display "Past days" as the page header
2. THE Patterns_Page SHALL display "Patterns" as the page header
3. THE Settings_Page SHALL display "Settings" as the page header
4. THE Today_Page SHALL maintain its current date-based header format

### Requirement 4: Pain Entry Form Language

**User Story:** As a user, I want form labels that feel human and non-judgmental, so that I feel comfortable recording my pain.

#### Acceptance Criteria

1. WHEN displaying the pain level input, THE Form SHALL use the label "Pain Level *" (current implementation)
2. WHEN displaying the location input, THE Form SHALL use the label "Location *" (current implementation)
3. WHEN displaying the notes input, THE Form SHALL use the label "Anything worth noting?"
4. WHEN displaying the notes placeholder, THE Form SHALL suggest "Sleep, posture, stress, travel, food — whatever stands out."
5. WHEN displaying the save button, THE Form SHALL use the text "Log today"
6. WHEN a user saves an entry, THE System SHALL display the toast message "Noted."

### Requirement 5: Empty State Language - Past Days

**User Story:** As a new user viewing the Past days page, I want to understand that patterns will emerge over time, so that I'm patient with the tracking process.

#### Acceptance Criteria

1. WHEN no entries exist, THE Past_Days_Page SHALL display "Once you log a few days, patterns will start to appear here."
2. THE Past_Days_Page SHALL NOT use instructional language like "Start tracking"

### Requirement 6: Empty State Language - Patterns

**User Story:** As a user viewing the Patterns page with insufficient data, I want to understand that patterns need time to develop, so that I continue tracking.

#### Acceptance Criteria

1. WHEN no entries exist, THE Patterns_Page SHALL display "Once you log a few days, patterns will start to appear here."
2. WHEN fewer than 2 entries exist, THE Patterns_Page SHALL display "Patterns need time. A few more days will make this clearer."
3. THE Patterns_Page SHALL NOT use instructional language or specific entry count requirements

### Requirement 7: Settings Page Content

**User Story:** As a user, I want to understand what PainMap is and what it doesn't do, so that I have appropriate expectations.

#### Acceptance Criteria

1. THE Settings_Page SHALL maintain existing functionality (export, clear data, sign out, delete account)

### Requirement 8: Observational Language Principle

**User Story:** As a user, I want all app language to be observational and neutral, so that I never feel judged or pressured.

#### Acceptance Criteria

1. THE System SHALL use observational language throughout the app
2. THE System SHALL NOT use motivational language (e.g., "Great job!", "Keep it up!")
3. THE System SHALL NOT use medical/diagnostic language (e.g., "diagnosis", "treatment")
4. THE System SHALL NOT use gamified language (e.g., "streak", "goal", "achievement")
5. THE System SHALL NOT use productivity language (e.g., "optimize", "maximize", "efficiency")

### Requirement 9: Route Naming

**User Story:** As a user, I want route URLs to reflect the new terminology where appropriate, so that the app is consistent.

#### Acceptance Criteria

1. THE System SHALL maintain the route `/history` and display "Past days" in the UI
2. THE System SHALL use the route `/patterns` for the Patterns page
3. THE System SHALL maintain the route `/settings` for the Settings page
4. THE System SHALL maintain existing component file names (no file renames required)

### Requirement 10: Backward Compatibility

**User Story:** As an existing user, I want my data to remain intact after the rebrand, so that I don't lose my pain tracking history.

#### Acceptance Criteria

1. WHEN the rebrand is deployed, THE System SHALL preserve all existing user data
2. WHEN the rebrand is deployed, THE System SHALL maintain all existing functionality
3. THE System SHALL NOT require data migration or user action
4. THE System SHALL maintain existing localStorage keys and data structures
