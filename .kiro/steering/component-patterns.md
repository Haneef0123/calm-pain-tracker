<!---
inclusion: fileMatch
fileMatchPattern: "components/**/*.tsx"
--->

# Component Development Patterns

## When Creating New Components

### Icon Components (`components/icons/`)
Reusable SVG icon components:
- Extract inline SVGs into dedicated icon components
- Accept `className` and optional `size` props
- Use `cn()` for merging className with defaults
- Export from `components/icons/index.ts` barrel file

```typescript
// components/icons/MyIcon.tsx
import { cn } from '@/lib/utils';

interface MyIconProps {
  className?: string;
  size?: number;
}

export function MyIcon({ className, size = 20 }: MyIconProps) {
  return (
    <svg
      className={cn('shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* SVG paths */}
    </svg>
  );
}
```

### Domain Components (`components/pain/`)
These are specific to pain tracking functionality:
- Encapsulate business logic related to pain data
- Accept typed props from `@/types/pain-entry`
- Handle their own local UI state
- Emit changes via callbacks, don't mutate external state
- Use `getPainLevelClass` from `@/lib/utils` for pain level coloring

**Existing domain components:**
- `PainSlider` - Pain level input (0-10)
- `ChipSelect` - Multi-select chips for locations/types
- `PainTypeInfo` - Info sheet about pain types
- `HistoryEntryCard` - Expandable entry card for history list
- `StatsCard` - Statistics display (label + value)
- `TimeRangeSelector` - Time range toggle (7d/30d/all)
- `AccountInfo` - User account info display

### Layout Components (`components/layout/`)
- `PageLayout` wraps all pages - provides consistent structure
- `BottomNav` is the fixed navigation - modify `navItems` array to add routes
- Keep layout components stateless when possible

### UI Components (`components/ui/`)
- **DO NOT MODIFY** - These are shadcn/ui primitives
- To customize, wrap them in domain components
- If you need a variant, extend via `className` prop

## Component Checklist

Before committing a new component:

- [ ] Props interface defined and exported
- [ ] All props have TypeScript types (no `any`)
- [ ] Keyboard accessible (can tab to it, Enter/Space activates)
- [ ] Has appropriate ARIA attributes if needed
- [ ] Uses `cn()` for conditional classes
- [ ] No hardcoded colors (use CSS variables)
- [ ] Animations use design system tokens (`animate-fade-in`, etc.)
- [ ] Mobile-first responsive design
- [ ] No inline SVGs - extract to `components/icons/` if custom
- [ ] No duplicated utility logic - use `lib/utils.ts`

## Example: Creating a New Pain Component

```typescript
// components/pain/PainBadge.tsx
import { cn, getPainLevelClass } from '@/lib/utils';

interface PainBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PainBadge({ level, size = 'md' }: PainBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-1.5',
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-semibold tabular-nums',
        sizeClasses[size],
        getPainLevelClass(level)
      )}
      aria-label={`Pain level ${level} out of 10`}
    >
      {level}
    </span>
  );
}
```

## Pain Level Color Logic

Consistent across the app via `getPainLevelClass(level: number)` in `lib/utils.ts`:
- 0-6: Normal text (`text-foreground`)
- 7-10: Destructive/warning (`text-destructive`)

**Always use `getPainLevelClass` - never duplicate this logic in components.**
