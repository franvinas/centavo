# Centavo - CI/CD Pipeline

## Overview

Automated pipeline using **GitHub Actions** that runs on every push and pull request. Vercel handles deployment automatically.

## Pipeline stages

```
Push / PR --> Lint --> Type check --> Build --> Deploy (Vercel)
```

## GitHub Actions workflow

### Trigger
- On push to `main` branch
- On pull request to `main` branch

### Jobs

#### 1. Quality checks

Runs on every push and PR:

- **Install dependencies**: `pnpm install --frozen-lockfile`
- **Lint**: `pnpm lint` (ESLint)
- **Format check**: `pnpm format:check` (Prettier, check-only — no auto-fix in CI)
- **Type check**: `pnpm type-check` (tsc --noEmit)
- **Build**: `pnpm build` (ensures the app compiles)

All steps must pass before a PR can be merged.

#### 2. Database migrations (on merge to main)

- Runs only on push to `main` (after merge)
- Executes `pnpm prisma migrate deploy` against the production Neon database
- Uses `DIRECT_DATABASE_URL` for migrations (not the pooled connection)

### Deployment

- **Vercel GitHub integration** handles deploys automatically — no custom deploy step needed in GitHub Actions
- Push to `main` → production deploy
- PR → preview deploy with unique URL
- Neon branch per preview (via Vercel + Neon integration) for isolated preview databases

## Branch strategy

- **`main`**: production branch, always deployable
- **Feature branches**: branch off `main`, PR back to `main`
- No `develop` or `staging` branch — keep it simple for a personal project
- PRs require passing CI checks before merge

## npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Local development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint |
| `format` | `prettier --write .` | Format all files |
| `format:check` | `prettier --check .` | Check formatting (CI) |
| `type-check` | `tsc --noEmit` | Type check without emitting |
| `db:migrate` | `prisma migrate dev` | Run migrations (dev) |
| `db:push` | `prisma db push` | Push schema changes (dev) |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |

## Protected branch rules (GitHub)

- `main` branch:
  - Require PR before merging
  - Require CI checks to pass
  - No force pushes
