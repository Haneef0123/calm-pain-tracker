<!---
inclusion: always
--->

# Code Standards

## TypeScript

- **Strict mode** - No `any` types, no `@ts-ignore`
- **Explicit return types** on exported functions
- **Interface over type** for object shapes
- **Const assertions** for static arrays (`as const`)

## React Patterns

### Component Structure
```typescript
// 1. Imports (external, then internal, then types)
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PainEntry } from '@/types/pain-entry';

// 2. Interface for props
interface MyComponentProps {
  value: number;
  onChange: (value: number) => void;
}

// 3. Component (named export for pages, named function for components)
export function MyComponent({ value, onChange }: MyComponentProps) {
  // 4. Hooks first
  const [state, setState] = useState(false);
  
  // 5. Derived values / memos
  const computed = useMemo(() => value * 2, [value]);
  
  // 6. Handlers
  const handleClick = () => { /* ... */ };
  
  // 7. Render
  return <div>...</div>;
}
```

### Hooks
- Custom hooks go in `src/hooks/`
- Prefix with `use-` (kebab-case filename, camelCase export)
- Return objects, not arrays, for clarity: `{ entries, addEntry }` not `[entries, addEntry]`

### State
- Local state for UI concerns (expanded/collapsed, form inputs)
- `usePainEntries` for all pain data operations
- No prop drilling beyond 2 levels - create a hook or context

## Styling

### Tailwind Classes
- Use `cn()` utility for conditional classes
- Order: layout → spacing → typography → colors → effects
- Example: `cn('flex items-center gap-2 text-sm text-muted-foreground', isActive && 'text-foreground')`

### CSS Variables
- All colors via CSS variables for theme support
- Never hardcode colors: use `text-foreground`, `bg-background`, etc.
- Custom tokens in `src/index.css` under `:root`

### Responsive
- Mobile-first: base styles for mobile, `md:` for tablet+
- Max width constraint: `max-w-lg mx-auto`
- Safe area insets: `pb-safe-bottom` for iOS

## Accessibility

- All interactive elements must be keyboard accessible
- Use semantic HTML (`button`, `nav`, `main`, `header`)
- ARIA labels for icon-only buttons
- Color contrast: minimum 4.5:1 for text
- Focus states: visible focus rings on all interactive elements

## File Naming

- Components: PascalCase (`PainSlider.tsx`)
- Hooks: kebab-case with `use-` prefix (`use-pain-entries.ts`)
- Types: kebab-case (`pain-entry.ts`)
- Pages: PascalCase (`DailyEntry.tsx`)

## Imports

- Use `@/` alias for all internal imports
- Group: React → external libs → internal components → types
- No relative imports going up more than one level
