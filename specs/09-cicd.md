# Centavo - CI/CD Pipeline

## Current State

There is no checked-in GitHub Actions workflow today. Vercel handles application
deployments through its GitHub integration.

The production deployment runbook lives in `DEPLOYMENT.md`.

## Current Deployment Behavior

- Push/merge to `main`: Vercel production deploy.
- Pull request: Vercel preview deploy, if enabled in the Vercel project.
- Production migrations: manual `prisma migrate deploy`, documented in
  `DEPLOYMENT.md`.
- Local/containerized tests: Vitest through `pnpm test` or `pnpm docker:test`.

## Desired Pipeline

This is the target CI setup to add later:

```
Push / PR --> Lint --> Format Check --> Type Check --> Test --> Build --> Deploy (Vercel)
```

### Proposed GitHub Actions Jobs

#### 1. Quality Checks

- Install dependencies: `pnpm install --frozen-lockfile`.
- Lint: `pnpm lint`.
- Format check: `pnpm format:check`.
- Type check: `pnpm type-check`.
- Build: `pnpm build`.

#### 2. Unit and Integration Tests

- Run on every push and PR.
- Use `pnpm test`.
- Optionally upload coverage from `pnpm test:coverage`.

#### 3. Production Migrations

- Keep manual for now.
- Later, consider a `workflow_dispatch` action that runs
  `pnpm prisma migrate deploy` against Neon after an explicit approval.

## Not Configured Today

- No `.github/workflows/ci.yml`.
- No Playwright or E2E scripts in `package.json`.
- No automatic production migration job.
- No branch protection config represented in this repository.

## Branch strategy

- **`main`**: production branch, always deployable
- **Feature branches**: branch off `main`, PR back to `main`
- No `develop` or `staging` branch — keep it simple while the product and team are still small
- PRs should pass local checks before merge until CI is added

## npm scripts

| Script            | Command                        | Purpose                        |
| ----------------- | ------------------------------ | ------------------------------ |
| `dev`             | `next dev`                     | Local development server       |
| `build`           | `next build`                   | Production build               |
| `start`           | `next start`                   | Start production server        |
| `lint`            | `eslint`                       | Run ESLint                     |
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
| `docker:test`     | `docker compose ... test`      | Run unit tests in container    |
| `docker:coverage` | `docker compose ... coverage`  | Run coverage in container      |
| `docker:down`     | `docker compose ... down -v`   | Tear down test containers      |

## Docker test environment

A `docker-compose.test.yml` + `Dockerfile.test` setup allows running tests in containers:

- **Base image**: `node:20-slim`
- **Services**:
  - `postgres` — PostgreSQL 16 Alpine with health check
  - `test` — Unit & integration tests (`pnpm test`)
  - `coverage` — Coverage report (mounts `./coverage` volume)

## Proposed Protected Branch Rules

- `main` branch:
  - Require PR before merging
  - Require CI checks to pass after CI is added
  - No force pushes
