# PainMap

A privacy-first pain tracking app for chronic pain sufferers. See your pain more clearly.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- shadcn/ui
- Supabase (auth & cloud sync)
- Recharts (trends visualization)

## Getting Started

```sh
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
yarn dev
```

## Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Deployment

Deployed on Vercel. Push to main branch to trigger automatic deployment.
