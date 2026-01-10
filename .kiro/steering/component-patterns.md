<!---
inclusion: fileMatch
fileMatchPattern: "src/components/**/*.tsx"
--->

# Component Development Patterns

## When Creating New Components

### Domain Components (`src/components/pain/`)
These are specific to pain tracking functionality:
- Encapsulate business logic related to pain data
- Accept typed props from `@/types/pain-entry`
- Handle their own local UI state
- Emit changes via callbacks, don't mutate external state

### Layout Components (`src/components/layout/`)
- `PageLayout` wraps all pages - provides consistent structure
- `BottomNav` is the fixed navigation - modify `navItems` array to add routes
- Keep layout components stateless when possible

### UI Components (`src/components/ui/`)
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

## Example: Creating a New Pain Component

```typescript
// src/components/pain/PainBadge.tsx
import { cn } from '@/lib/utils';

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

  const colorClass = level <= 3 
    ? 'text-foreground' 
    : level <= 6 
      ? 'text-foreground' 
      : 'text-destructive';

  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-semibold tabular-nums',
        sizeClasses[size],
        colorClass
      )}
      aria-label={`Pain level ${level} out of 10`}
    >
      {level}
    </span>
  );
}
```

## Pain Level Color Logic

Consistent across the app:
- 0-3: Normal text (`text-foreground`)
- 4-6: Normal text (`text-foreground`)  
- 7-10: Destructive/warning (`text-destructive`)

Use the `getPainClass` helper pattern found in pages.
