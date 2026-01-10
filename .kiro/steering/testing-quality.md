<!---
inclusion: manual
--->

# Testing & Quality Assurance

## Build Verification

**CRITICAL**: Every change must pass `npm run build` before being considered complete.

```bash
npm run build
```

This runs:
- TypeScript compilation (strict mode)
- Vite production build
- Tree shaking and optimization

## Linting

```bash
npm run lint
```

ESLint checks:
- React hooks rules (dependencies, order)
- TypeScript best practices
- React Refresh compatibility

## Manual Testing Checklist

Before shipping any feature:

### Functionality
- [ ] Feature works as expected
- [ ] Edge cases handled (empty state, max values, etc.)
- [ ] Data persists after page refresh
- [ ] No console errors

### Accessibility
- [ ] Can navigate with keyboard only
- [ ] Screen reader announces important changes
- [ ] Focus management is correct
- [ ] Color contrast passes (use browser dev tools)

### Responsive
- [ ] Works on mobile (320px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1024px+ width)
- [ ] Bottom nav doesn't overlap content

### Performance
- [ ] No unnecessary re-renders
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts

## Common Issues

### TypeScript Errors
- Missing return type → Add explicit return type
- Implicit any → Define proper interface
- Unused variable → Remove or prefix with `_`

### Build Failures
- Import path wrong → Use `@/` alias
- Missing dependency → Check package.json
- Circular import → Restructure modules

### Runtime Errors
- localStorage not available → Check `isLoaded` before rendering
- Invalid date → Validate ISO string format
- Missing array method → Check for undefined/null
