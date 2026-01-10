<!---
inclusion: manual
--->

# Vercel Deployment Guide for Next.js

## Pre-Deployment Checklist

### 1. Use Yarn (Recommended)
npm has known issues on Vercel ("Exit handler never called"). Use yarn instead:

```bash
rm -rf node_modules package-lock.json
yarn install
```

### 2. Force Public npm Registry
If you work with private registries (corporate environments), create `.npmrc` in project root:

```
registry=https://registry.npmjs.org/
```

Then regenerate lockfile:
```bash
rm yarn.lock
yarn install --registry https://registry.npmjs.org/
```

### 3. Verify package.json
Ensure `next` is in dependencies:
```json
{
  "dependencies": {
    "next": "^15.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x"
  }
}
```

### 4. Add vercel.json (Optional but Recommended)
```json
{
  "framework": "nextjs",
  "installCommand": "yarn install"
}
```

### 5. Git Author Must Have Vercel Access
Check your git config matches your Vercel account:
```bash
git config user.email
git config user.name
```

If different, update for this repo:
```bash
git config user.email "your-vercel-email@example.com"
git config user.name "YourVercelUsername"
```

## Common Deployment Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Exit handler never called" | npm bug | Switch to yarn |
| "No Next.js version detected" | `next` missing from deps | Add to package.json |
| "getaddrinfo ENOTFOUND" | Private registry in lockfile | Regenerate with public registry |
| "git author without access" | Git email mismatch | Update git config |
| "next: command not found" | Install failed silently | Check lockfile, use yarn |

## Deployment Steps

1. Commit all changes including `yarn.lock`
2. Push to GitHub
3. Vercel auto-deploys from connected repo
4. If issues persist, clear Vercel build cache: Dashboard → Settings → General → Clear Cache

## Files to Commit

- `package.json`
- `yarn.lock` (not package-lock.json)
- `.npmrc` (if using public registry override)
- `vercel.json` (optional)
