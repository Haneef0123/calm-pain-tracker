<!---
inclusion: fileMatch
fileMatchPattern: "app/**/page.tsx"
--->

# Page Development Patterns (Next.js App Router)

## App Router Page Structure

Pages in Next.js App Router are Server Components by default. Our pages import Client Components for interactivity:

```typescript
// app/page.tsx (Server Component - route handler)
import DailyEntry from '@/components/pages/DailyEntry';

export default function HomePage() {
  return <DailyEntry />;
}
```

```typescript
// components/pages/DailyEntry.tsx (Client Component - actual page content)
'use client';

import { PageLayout } from '@/components/layout/PageLayout';

export default function DailyEntry() {
  return (
    <PageLayout>
      <div className="pt-8 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-heading">Page Title</h1>
        </header>
        
        {/* Page content */}
      </div>
    </PageLayout>
  );
}
```

## Key Patterns

### Two-Layer Page Architecture
- `app/**/page.tsx` - Thin Server Component wrapper (route handler)
- `components/pages/*.tsx` - Client Component with actual page logic

### 'use client' Directive
All page content components in `components/pages/` must have `'use client'` at the top because they:
- Use React hooks (useState, useEffect, etc.)
- Access browser APIs (localStorage)
- Handle user interactions

### PageLayout Wrapper
Always wrap page content in `PageLayout` - it provides:
- Consistent max-width container
- Bottom padding for nav
- Background color
- Bottom navigation

### Header Pattern
- Use `<header>` semantic element
- `text-heading` class for title
- Optional subtitle with `text-label mt-1`

### Empty States
When no data exists, show helpful guidance:

```typescript
'use client';

import { PageLayout } from '@/components/layout/PageLayout';

export default function History() {
  const { entries, isLoaded } = usePainEntries();

  if (!isLoaded) return null; // Prevent hydration mismatch

  if (entries.length === 0) {
    return (
      <PageLayout>
        <div className="pt-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-heading">History</h1>
          </header>
          <div className="text-center py-16">
            <p className="text-muted-foreground">No entries yet.</p>
            <p className="text-label mt-2">Start tracking your pain on the Today tab.</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  // ...
}
```

### Destructive Actions
Always confirm with AlertDialog:

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" className="text-destructive">
      Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="bg-card">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete entry?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Toast Notifications
Use for success/error feedback:

```typescript
import { toast } from '@/hooks/use-toast';

toast({
  title: 'Entry saved',
  description: 'Your pain entry has been recorded.',
});

// For errors
toast({
  title: 'Import failed',
  description: 'Could not read the CSV file.',
  variant: 'destructive',
});
```

## Navigation

### Using Next.js Link
```typescript
import Link from 'next/link';

<Link href="/history">View History</Link>
```

### Getting Current Route
```typescript
'use client';

import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const isActive = pathname === '/history';
  // ...
}
```

## Adding a New Page

1. Create route file: `app/newpage/page.tsx`
   ```typescript
   import NewPage from '@/components/pages/NewPage';
   
   export default function NewPageRoute() {
     return <NewPage />;
   }
   ```

2. Create page component: `components/pages/NewPage.tsx`
   ```typescript
   'use client';
   
   import { PageLayout } from '@/components/layout/PageLayout';
   
   export default function NewPage() {
     return (
       <PageLayout>
         {/* Page content */}
       </PageLayout>
     );
   }
   ```

3. Add nav item in `components/layout/BottomNav.tsx` (if needed)

## Hydration Safety

When accessing browser APIs like localStorage:

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function MyPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Or a loading skeleton

  // Safe to access localStorage here
}
```

The `usePainEntries` hook handles this with its `isLoaded` state.
