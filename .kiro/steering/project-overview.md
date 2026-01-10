<!---
inclusion: always
--->

# Pain Diary - Project Overview

## What This Is

A privacy-first pain tracking PWA for chronic pain sufferers. Built with Next.js 15.x (App Router), React, TypeScript, shadcn/ui, and Tailwind CSS. All data stays on-device via localStorage.

## Architecture Philosophy

This app follows a **neo-minimal, editorial, Swiss-inspired** design system. Every component should feel calm, intentional, and accessible. We prioritize:

- **Simplicity over features** - Each screen does one thing well
- **Privacy by design** - No servers, no accounts, no tracking
- **Accessibility** - Pain sufferers may have limited mobility/vision
- **Performance** - Instant interactions, no loading states for local data

## Directory Structure

```
app/                     # Next.js App Router pages
├── layout.tsx           # Root layout (providers, global styles)
├── page.tsx             # Home route (/)
├── globals.css          # Global styles
├── history/
│   └── page.tsx         # /history
├── trends/
│   └── page.tsx         # /trends
├── settings/
│   └── page.tsx         # /settings
└── not-found.tsx        # 404 page

components/
├── layout/              # PageLayout, BottomNav (shared structure)
├── pages/               # Page content components (DailyEntry, History, etc.)
├── pain/                # Domain-specific: PainSlider, ChipSelect, PainTypeInfo
├── ui/                  # shadcn/ui primitives (DO NOT modify directly)
└── providers.tsx        # Client-side providers wrapper

hooks/                   # Custom hooks (use-pain-entries is the data layer)
types/                   # TypeScript interfaces and constants
lib/                     # Utilities (cn function)
```

## Core Data Model

```typescript
interface PainEntry {
  id: string;           // crypto.randomUUID()
  timestamp: string;    // ISO 8601
  painLevel: number;    // 0-10
  locations: string[];  // From PAIN_LOCATIONS constant
  types: string[];      // From PAIN_TYPES constant
  radiating: boolean;
  notes: string;
}
```

## Key Patterns

1. **State Management**: `usePainEntries` hook manages all CRUD + localStorage sync
2. **Styling**: Tailwind + CSS variables for theming (light/dark via `--background`, `--foreground`, etc.)
3. **Components**: shadcn/ui for primitives, custom components in `pain/` for domain logic
4. **Routing**: Next.js App Router with file-based routing (4 main routes + 404)
5. **Charts**: recharts for the Trends page visualization
6. **Client Components**: All interactive components use `'use client'` directive
7. **Navigation**: Next.js `Link` component and `usePathname` hook for routing

## Design Tokens

- Colors use HSL CSS variables (see `app/globals.css`)
- Typography: `.text-display`, `.text-heading`, `.text-label`
- Animations: `animate-fade-in`, `animate-scale-in`
- Spacing: Mobile-first with `max-w-lg mx-auto`
