<!---
inclusion: always
--->

# PainMap - Project Overview

## What This Is

A privacy-first pain tracking PWA for chronic pain sufferers. Built with Next.js 15.x (App Router), React, TypeScript, shadcn/ui, and Tailwind CSS. See your pain more clearly.

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
│   └── page.tsx         # /history (displays "Past days")
├── patterns/
│   └── page.tsx         # /patterns (formerly /trends)
├── about/
│   └── page.tsx         # /about (formerly /settings)
├── trends/
│   └── page.tsx         # /trends (redirects to /patterns)
├── settings/
│   └── page.tsx         # /settings (redirects to /about)
├── sign-in/
│   └── page.tsx         # /sign-in
└── not-found.tsx        # 404 page

components/
├── icons/               # Reusable SVG icon components (GoogleIcon, SpinnerIcon)
├── layout/              # PageLayout, BottomNav (shared structure)
├── pages/               # Page content components (DailyEntry, History, etc.)
├── pain/                # Domain-specific: PainSlider, ChipSelect, HistoryEntryCard, StatsCard, etc.
├── ui/                  # shadcn/ui primitives (DO NOT modify directly)
└── providers.tsx        # Client-side providers wrapper

hooks/                   # Custom hooks (use-pain-entries is the data layer)
types/                   # TypeScript interfaces and constants
lib/                     # Utilities (cn, getPainLevelClass)
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
4. **Routing**: Next.js App Router with file-based routing (Today, Past days, Patterns, About + 404)
5. **Charts**: recharts for the Patterns page visualization
6. **Client Components**: All interactive components use `'use client'` directive
7. **Navigation**: Next.js `Link` component and `usePathname` hook for routing
8. **Icons**: Custom SVG icons in `components/icons/`, lucide-react for standard icons
9. **Utilities**: Shared functions in `lib/utils.ts` (e.g., `cn`, `getPainLevelClass`)

## Design Tokens

- Colors use HSL CSS variables (see `app/globals.css`)
- Typography: `.text-display`, `.text-heading`, `.text-label`
- Animations: `animate-fade-in`, `animate-scale-in`
- Spacing: Mobile-first with `max-w-lg mx-auto`
