\
# Implementation Plan: Next.js Migration

## Overview

Migrate Pain Diary from Vite + React to Next.js 15.x App Router while maintaining all functionality and Vercel deployment compatibility.

## Tasks

- [x] 1. Project Setup
  - [x] 1.1 Initialize Next.js configuration files
    - Create next.config.js with Vercel-compatible settings
    - Create next-env.d.ts for TypeScript
    - Update tsconfig.json for Next.js paths and plugins
    - _Requirements: 1.1, 1.3, 1.4, 6.1_
  - [x] 1.2 Update package.json
    - Add next, update react/react-dom versions
    - Remove vite, @vitejs/plugin-react-swc, lovable-tagger
    - Update scripts (dev, build, start, lint)
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 1.3 Update Tailwind configuration
    - Update content paths for Next.js structure
    - Preserve all existing theme configuration
    - _Requirements: 3.1_

- [x] 2. Create App Router Structure
  - [x] 2.1 Create root layout
    - Create app/layout.tsx with metadata, fonts, providers wrapper
    - Move global styles to app/globals.css
    - Preserve all CSS custom properties and utility classes
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [x] 2.2 Create providers component
    - Create components/providers.tsx with 'use client'
    - Wrap QueryClientProvider, TooltipProvider, Toasters
    - _Requirements: 2.1_
  - [x] 2.3 Create page routes
    - Create app/page.tsx (home/daily entry)
    - Create app/history/page.tsx
    - Create app/trends/page.tsx
    - Create app/settings/page.tsx
    - Create app/not-found.tsx
    - _Requirements: 1.2, 5.5_

- [x] 3. Migrate Components
  - [x] 3.1 Add 'use client' directives
    - Add to all components in components/pain/
    - Add to components/layout/PageLayout.tsx
    - Add to components/layout/BottomNav.tsx
    - _Requirements: 2.1, 4.3_
  - [x] 3.2 Migrate navigation
    - Update BottomNav to use next/link and usePathname
    - Remove react-router-dom NavLink usage
    - Preserve active state styling logic
    - _Requirements: 5.1, 5.3_
  - [x] 3.3 Move page components
    - Move src/pages/*.tsx to components/pages/
    - Update imports in each component
    - Ensure all use 'use client' directive
    - _Requirements: 2.2, 2.4_

- [x] 4. Migrate Hooks and Utilities
  - [x] 4.1 Update usePainEntries hook
    - Add 'use client' directive
    - Verify localStorage access is client-side only
    - Preserve same storage key 'painDiary.entries'
    - _Requirements: 4.1, 4.3, 4.4, 4.5_
  - [x] 4.2 Update other hooks
    - Add 'use client' to use-mobile.tsx
    - Add 'use client' to use-toast.ts
    - _Requirements: 2.1_

- [x] 5. Cleanup Old Files
  - [x] 5.1 Remove Vite-specific files
    - Delete vite.config.ts
    - Delete src/App.tsx (router setup)
    - Delete src/main.tsx (entry point)
    - Delete src/App.css
    - Delete src/vite-env.d.ts
    - Delete index.html
    - _Requirements: 7.1_
  - [x] 5.2 Remove unused dependencies
    - Run npm uninstall for removed packages
    - Verify no peer dependency conflicts
    - _Requirements: 7.5_
  - [x] 5.3 Reorganize directory structure
    - Move src/components to components/
    - Move src/hooks to hooks/
    - Move src/types to types/
    - Move src/lib to lib/
    - Delete empty src/ directory
    - _Requirements: 2.4_

- [x] 6. Update ESLint Configuration
  - [x] 6.1 Configure ESLint for Next.js
    - Update eslint.config.js for Next.js rules
    - Add next/core-web-vitals extends
    - _Requirements: 8.2_

- [x] 7. Checkpoint - Build Verification
  - Run npm install to verify dependencies
  - Run npm run build to verify compilation
  - Run npm run lint to verify code quality
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 1.5, 8.3, 8.4_

- [x] 8. Update Steering Files
  - [x] 8.1 Update project-overview.md
    - Update directory structure for Next.js
    - Update key patterns section
    - _Requirements: N/A (documentation)_
  - [x] 8.2 Update page-patterns.md
    - Update for App Router page structure
    - Update navigation patterns
    - _Requirements: N/A (documentation)_

- [x] 9. Final Verification
  - [x] 9.1 Local testing
    - Start dev server with npm run dev
    - Test all routes manually
    - Verify localStorage persistence
    - Test CSV export/import
    - _Requirements: 8.5, 4.4, 4.5_
  - [x] 9.2 Production build test
    - Run npm run build
    - Run npm run start
    - Verify production behavior matches development
    - _Requirements: 6.2, 6.3_

- [x] 10. Final Checkpoint
  - Ensure npm run build passes
  - Ensure npm run lint passes
  - Confirm ready for Vercel deployment
  - Ask user to deploy to Vercel preview and verify
  - _Requirements: 1.5, 6.4_

## Notes

- All interactive components require 'use client' directive
- localStorage access must only happen in useEffect (client-side)
- No API routes or server actions needed (privacy-first)
- Vercel will auto-detect Next.js and configure deployment
- Keep same URL structure to avoid breaking existing bookmarks
