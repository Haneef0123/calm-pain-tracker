# Requirements Document

## Introduction

This specification covers the refactoring of React components in the Pain Diary application to achieve better separation of concerns. The goal is to extract inline SVGs into reusable icon components, extract reusable JSX sections into sub-components, and consolidate duplicated utility functions. This refactoring will improve maintainability and code reuse across the application.

## Glossary

- **Icon_Component**: A React component that renders an SVG icon with customizable props
- **Sub_Component**: A smaller, focused React component extracted from a larger component
- **Utility_Function**: A pure function that performs a specific computation without side effects

## Requirements

### Requirement 1: Extract Inline SVGs to Icon Components

**User Story:** As a developer, I want inline SVGs extracted into dedicated icon components, so that icons are reusable and the codebase is cleaner.

#### Acceptance Criteria

1. WHEN the application renders a Google sign-in button, THE Icon_Component `GoogleIcon` SHALL render the Google logo SVG
2. WHEN the application shows a loading state, THE Icon_Component `SpinnerIcon` SHALL render a spinner SVG with CSS animation
3. THE Icon_Component SHALL accept `className` prop for styling customization
4. THE Icon_Component SHALL accept optional `size` prop defaulting to appropriate dimensions
5. THE Icon_Component files SHALL be located in a dedicated `components/icons/` directory

### Requirement 2: Extract Pain Level Utility Function

**User Story:** As a developer, I want the pain level color logic centralized, so that styling is consistent and changes only need to be made in one place.

#### Acceptance Criteria

1. THE Utility_Function `getPainLevelClass` SHALL return appropriate CSS class based on pain level (0-10)
2. WHEN pain level is 0-6, THE Utility_Function SHALL return `'text-foreground'`
3. WHEN pain level is 7-10, THE Utility_Function SHALL return `'text-destructive'`
4. THE Utility_Function SHALL be located in `lib/utils.ts` and exported
5. THE components DailyEntry, History, and Trends SHALL use the centralized utility function

### Requirement 3: Extract History Entry Card Sub-Component

**User Story:** As a developer, I want the history entry card JSX extracted into a reusable component, so that the History component is more readable.

#### Acceptance Criteria

1. THE Sub_Component `HistoryEntryCard` SHALL render a single pain entry with expand/collapse functionality
2. THE Sub_Component SHALL accept `entry`, `isExpanded`, `onToggle`, and `onDelete` props
3. THE Sub_Component SHALL render the pain level, date, locations preview, and expand icon
4. WHEN expanded, THE Sub_Component SHALL render full entry details and delete button
5. THE Sub_Component SHALL be located in `components/pain/` directory

### Requirement 4: Extract Stats Display Sub-Component

**User Story:** As a developer, I want the statistics display JSX extracted into a reusable component, so that stats can be displayed consistently.

#### Acceptance Criteria

1. THE Sub_Component `StatsCard` SHALL render a single statistic with label and value
2. THE Sub_Component SHALL accept `label`, `value`, and optional `className` props
3. THE Sub_Component SHALL apply pain level coloring to the value when appropriate
4. THE Sub_Component SHALL be located in `components/pain/` directory

### Requirement 5: Extract Time Range Selector Sub-Component

**User Story:** As a developer, I want the time range selector JSX extracted into a reusable component, so that it can be reused and styled consistently.

#### Acceptance Criteria

1. THE Sub_Component `TimeRangeSelector` SHALL render toggle buttons for time range selection
2. THE Sub_Component SHALL accept `value`, `onChange`, and `options` props
3. THE Sub_Component SHALL visually indicate the currently selected option
4. THE Sub_Component SHALL be located in `components/pain/` directory

### Requirement 6: Extract Account Info Sub-Component

**User Story:** As a developer, I want the account info section JSX extracted into a reusable component, so that the Settings component is more readable.

#### Acceptance Criteria

1. THE Sub_Component `AccountInfo` SHALL render user avatar, email, and entry count
2. THE Sub_Component SHALL accept `email` and `entryCount` props
3. THE Sub_Component SHALL display a placeholder icon when no avatar is available
4. THE Sub_Component SHALL be located in `components/pain/` directory

### Requirement 7: Maintain Existing Functionality

**User Story:** As a user, I want all existing features to work exactly as before, so that the refactoring doesn't break my workflow.

#### Acceptance Criteria

1. WHEN a user saves a pain entry, THE System SHALL persist it and show a success toast
2. WHEN a user views history, THE System SHALL display all entries with expand/collapse functionality
3. WHEN a user views trends, THE System SHALL display statistics and charts for the selected time range
4. WHEN a user signs in with Google, THE System SHALL display the Google icon and handle authentication
5. IF the build command is run, THEN THE System SHALL complete without errors

### Requirement 8: Follow Project Architecture Patterns

**User Story:** As a developer, I want the refactored code to follow established project patterns, so that the codebase remains consistent.

#### Acceptance Criteria

1. THE Icon_Component files SHALL be located in `components/icons/` directory
2. THE Sub_Component files SHALL be located in `components/pain/` directory
3. THE Utility_Function SHALL be added to `lib/utils.ts`
4. THE refactored code SHALL pass `npm run build` without errors
5. THE refactored code SHALL maintain TypeScript strict mode compliance
