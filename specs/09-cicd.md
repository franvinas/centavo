# Centavo - CI/CD Pipeline

## Overview

Automated pipeline using **GitHub Actions** that runs on every push and pull request. Vercel handles deployment automatically.

## Pipeline stages

```
Push / PR --> Lint --> Type check --> Test --> Build --> E2E --> Deploy (Vercel)
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

#### 2. Unit & integration tests

- Runs on every push and PR
- Spins up a **PostgreSQL 16** service container
- Pushes Prisma schema to the test database
- Runs `pnpm test` (Vitest — 155 tests covering validations, data access, API routes, server actions, and components)
- Uploads coverage report as artifact

#### 3. E2E tests

- Runs on every push and PR
- Spins up a **PostgreSQL 16** service container
- Seeds the database with test data
- Installs Playwright browsers
- Builds and starts the Next.js app
- Runs `pnpm test:e2e` (Playwright — Chromium + mobile viewport)
- Uploads test report and results as artifacts

#### 4. Database migrations (on merge to main)

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

| Script            | Command                        | Purpose                        |
| ----------------- | ------------------------------ | ------------------------------ |
| `dev`             | `next dev`                     | Local development server       |
| `build`           | `next build`                   | Production build               |
| `start`           | `next start`                   | Start production server        |
| `lint`            | `next lint`                    | Run ESLint                     |
| `format`          | `prettier --write .`           | Format all files               |
| `format:check`    | `prettier --check .`           | Check formatting (CI)          |
| `type-check`      | `tsc --noEmit`                 | Type check without emitting    |
| `db:migrate`      | `prisma migrate dev`           | Run migrations (dev)           |
| `db:push`         | `prisma db push`               | Push schema changes (dev)      |
| `db:seed`         | `pnpm exec tsx prisma/seed.ts` | Seed database with test data   |
| `db:studio`       | `prisma studio`                | Open Prisma Studio GUI         |
| `test`            | `vitest run`                   | Run unit & integration tests   |
| `test:watch`      | `vitest`                       | Run tests in watch mode        |
| `test:coverage`   | `vitest run --coverage`        | Run tests with coverage report |
| `test:e2e`        | `playwright test`              | Run E2E tests                  |
| `test:e2e:ui`     | `playwright test --ui`         | Run E2E tests with UI          |
| `docker:test`     | `docker compose ... test`      | Run unit tests in container    |
| `docker:coverage` | `docker compose ... coverage`  | Run coverage in container      |
| `docker:e2e`      | `docker compose ... e2e`       | Run E2E tests in container     |
| `docker:down`     | `docker compose ... down -v`   | Tear down test containers      |

## Docker test environment

A `docker-compose.test.yml` + `Dockerfile.test` setup allows running all tests in containers without local dependencies:

- **Base image**: `mcr.microsoft.com/playwright:v1.58.0-noble` (includes all browser dependencies)
- **Services**:
  - `postgres` — PostgreSQL 16 Alpine with health check
  - `test` — Unit & integration tests (`pnpm test`)
  - `coverage` — Coverage report (mounts `./coverage` volume)
  - `e2e` — Full E2E: pushes schema, seeds DB, builds app, runs Playwright (mounts report volumes)

## Protected branch rules (GitHub)

- `main` branch:
  - Require PR before merging
  - Require CI checks to pass
  - No force pushes
