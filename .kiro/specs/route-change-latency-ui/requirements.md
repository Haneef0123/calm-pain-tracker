# Requirements: Route Change Latency UI

## Introduction

Add a visual feedback indicator that appears at the top of the screen during route transitions in the Next.js App Router application. This feature bridges the gap between a user clicking a navigation link and the new page becoming visible, providing perceived-performance feedback consistent with the app's calm, minimal design language.

## Glossary

- **RouteChangeIndicator**: The slim progress bar component fixed at the top of the viewport
- **NavigationProgressProvider**: React context provider that holds navigation state
- **isNavigating**: Boolean flag indicating a route transition is in progress
- **progress**: A 0–100 number representing how far along the simulated progress bar is

## Requirements

### Requirement 1: Progress Bar Visibility

**User Story:** As a user, I want to see a subtle loading indicator when I tap a navigation link, so that I know the app is responding even before the new page appears.

#### Acceptance Criteria

1. WHEN the user taps a bottom navigation link to a different route, a slim progress bar SHALL appear at the top of the viewport within 50ms of the tap.
2. THE progress bar SHALL animate from 0% to approximately 85% while navigation is in progress, using an easing curve that slows as it approaches 85%.
3. WHEN the route change completes (pathname changes), THE progress bar SHALL animate to 100% and then fade out within 400ms.
4. WHEN the user is already on the tapped route, THE progress bar SHALL NOT appear.
5. WHEN navigation completes, THE progress bar SHALL be removed from the visual layout without a flash or jump.

### Requirement 2: Design Consistency

**User Story:** As a user, I want the loading indicator to feel consistent with the app's calm, minimal aesthetic, so that it does not distract from the content.

#### Acceptance Criteria

1. THE progress bar SHALL be 2px tall (h-0.5) and span the full width of the viewport.
2. THE progress bar SHALL use the `--foreground` CSS variable for its color to respect both light and dark modes automatically.
3. THE progress bar SHALL use `z-index: 50` to appear above all page content.
4. THE progress bar SHALL be `pointer-events: none` so it never intercepts user interaction.
5. WHEN not navigating, THE progress bar element SHALL have `aria-hidden="true"` and zero opacity.

### Requirement 3: Accessibility

**User Story:** As a user relying on assistive technology, I want the navigation state to be communicated, so that screen readers announce page transitions.

#### Acceptance Criteria

1. THE RouteChangeIndicator SHALL have `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` attributes.
2. WHEN navigation begins, `aria-busy="true"` SHALL be set on the indicator.
3. WHEN navigation completes, `aria-busy` SHALL be removed or set to `false`.
4. THE indicator SHALL have an `aria-label` of "Page loading".

### Requirement 4: Architecture Compatibility

**User Story:** As a developer, I want the feature implemented using existing patterns, so that the codebase stays consistent.

#### Acceptance Criteria

1. THE implementation SHALL use React Context (no new third-party libraries).
2. THE NavigationProgressProvider SHALL be added to the existing `Providers` component tree.
3. THE RouteChangeIndicator SHALL be rendered once at the root providers level, not per-page.
4. THE BottomNav component SHALL dispatch the navigation-start signal via the context when a link to a different route is clicked.
5. THE implementation SHALL work correctly with Next.js App Router's `usePathname()` hook for detecting navigation completion.
