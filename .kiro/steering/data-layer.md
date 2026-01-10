<!---
inclusion: fileMatch
fileMatchPattern: "src/hooks/**/*.ts"
--->

# Data Layer Guidelines

## The `usePainEntries` Hook

This is the single source of truth for all pain data. It handles:
- Loading from localStorage on mount
- Persisting changes automatically
- CRUD operations with proper typing
- CSV import/export

### Usage Pattern

```typescript
const { 
  entries,           // PainEntry[] - sorted newest first
  isLoaded,          // boolean - true after initial load
  addEntry,          // (entry: Omit<PainEntry, 'id' | 'timestamp'>) => PainEntry
  updateEntry,       // (id: string, updates: Partial<PainEntry>) => void
  deleteEntry,       // (id: string) => void
  clearAllEntries,   // () => void
  exportToCsv,       // () => void - triggers download
  importFromCsv,     // (file: File) => Promise<void>
} = usePainEntries();
```

### Rules

1. **Never access localStorage directly** - Always go through `usePainEntries`
2. **Don't store derived data** - Compute stats/filters in components via `useMemo`
3. **Entries are immutable** - Use `updateEntry` to modify, never mutate directly
4. **IDs are UUIDs** - Generated via `crypto.randomUUID()`
5. **Timestamps are ISO 8601** - Always use `new Date().toISOString()`

## Creating New Hooks

When adding a new hook:

```typescript
// src/hooks/use-something.ts
import { useState, useCallback } from 'react';

export function useSomething(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  
  // Wrap handlers in useCallback for stable references
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);
  
  // Return object, not array
  return { value, handleChange };
}
```

## Storage Key Convention

If you need additional localStorage keys:
- Prefix with `painDiary.` (e.g., `painDiary.settings`, `painDiary.theme`)
- Document in this file
- Consider adding to `usePainEntries` or creating a dedicated hook

Current keys:
- `painDiary.entries` - All pain entries (managed by `usePainEntries`)
