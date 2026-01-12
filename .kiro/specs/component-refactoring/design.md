# Design Document: Component Refactoring

## Overview

This design describes the refactoring of the Pain Diary application to extract inline SVGs into reusable icon components, consolidate duplicated utility functions, and extract reusable JSX sections into focused sub-components. The refactoring follows the existing project architecture patterns and maintains all current functionality.

## Architecture

The refactoring introduces three new architectural elements:

1. **Icon Components** (`components/icons/`) - Reusable SVG icon components
2. **Sub-Components** (`components/pain/`) - Extracted JSX sections as focused components
3. **Utility Functions** (`lib/utils.ts`) - Centralized pure functions

```
components/
├── icons/                    # NEW: Icon components
│   ├── GoogleIcon.tsx
│   └── SpinnerIcon.tsx
├── pain/                     # EXTENDED: Domain components
│   ├── ChipSelect.tsx        # Existing
│   ├── PainSlider.tsx        # Existing
│   ├── PainTypeInfo.tsx      # Existing
│   ├── HistoryEntryCard.tsx  # NEW
│   ├── StatsCard.tsx         # NEW
│   ├── TimeRangeSelector.tsx # NEW
│   └── AccountInfo.tsx       # NEW
└── ...

lib/
└── utils.ts                  # EXTENDED: Add getPainLevelClass
```

## Components and Interfaces

### Icon Components

#### GoogleIcon

```typescript
// components/icons/GoogleIcon.tsx
interface GoogleIconProps {
  className?: string;
  size?: number;
}

export function GoogleIcon({ className, size = 20 }: GoogleIconProps): JSX.Element
```

Renders the Google "G" logo SVG with four colored paths. Accepts className for additional styling and size for dimensions.

#### SpinnerIcon

```typescript
// components/icons/SpinnerIcon.tsx
interface SpinnerIconProps {
  className?: string;
  size?: number;
}

export function SpinnerIcon({ className, size = 16 }: SpinnerIconProps): JSX.Element
```

Renders an animated spinner SVG. The component applies `animate-spin` class internally. Accepts className for additional styling.

### Sub-Components

#### HistoryEntryCard

```typescript
// components/pain/HistoryEntryCard.tsx
import type { PainEntry } from '@/types/pain-entry';

interface HistoryEntryCardProps {
  entry: PainEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function HistoryEntryCard({ 
  entry, 
  isExpanded, 
  onToggle, 
  onDelete 
}: HistoryEntryCardProps): JSX.Element
```

Renders a single history entry with:
- Collapsed view: pain level, date, locations preview, expand icon
- Expanded view: full details (date/time, locations, types, radiating, notes) and delete button with confirmation dialog

#### StatsCard

```typescript
// components/pain/StatsCard.tsx
interface StatsCardProps {
  label: string;
  value: number;
  showPainColor?: boolean;
  className?: string;
}

export function StatsCard({ 
  label, 
  value, 
  showPainColor = true,
  className 
}: StatsCardProps): JSX.Element
```

Renders a centered statistic with label above and large value below. When `showPainColor` is true, applies pain level coloring to the value.

#### TimeRangeSelector

```typescript
// components/pain/TimeRangeSelector.tsx
type TimeRange = '7d' | '30d' | 'all';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeSelector({ 
  value, 
  onChange 
}: TimeRangeSelectorProps): JSX.Element
```

Renders three toggle buttons for time range selection. The selected option has filled styling, others have outline styling.

#### AccountInfo

```typescript
// components/pain/AccountInfo.tsx
interface AccountInfoProps {
  email: string | null;
  entryCount: number;
}

export function AccountInfo({ email, entryCount }: AccountInfoProps): JSX.Element
```

Renders user account information card with:
- Avatar placeholder (User icon from lucide-react)
- Email or "Not signed in" text
- Entry count with "entries synced" label

### Utility Functions

#### getPainLevelClass

```typescript
// lib/utils.ts
export function getPainLevelClass(level: number): string
```

Returns the appropriate CSS class for pain level coloring:
- Levels 0-6: `'text-foreground'`
- Levels 7-10: `'text-destructive'`

## Data Models

No new data models are introduced. All components use the existing `PainEntry` type:

```typescript
interface PainEntry {
  id: string;
  timestamp: string;
  painLevel: number;
  locations: string[];
  types: string[];
  radiating: boolean;
  notes: string;
}
```

## Error Handling

- **Invalid pain levels**: `getPainLevelClass` treats any level > 6 as destructive, any level ≤ 6 as foreground
- **Null email**: `AccountInfo` displays "Not signed in" when email is null
- **Empty locations**: `HistoryEntryCard` displays time instead of locations preview
- **Missing props**: TypeScript enforces required props at compile time
