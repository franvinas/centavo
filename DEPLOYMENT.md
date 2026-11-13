# Deployment

This document describes the production deployment as it works today.

## Production Infrastructure

- App hosting: Vercel, using the GitHub integration.
- Database: Neon PostgreSQL.
- Email provider: Resend, used by NextAuth email OTP.
- Auth: NextAuth v5 with JWT sessions, Google OAuth, and email OTP.
- Exchange rates: Open Exchange Rates API.
- Telegram assistant: Telegram Bot API plus OpenAI.
- Production branch: `main`.

## App Deployment

Vercel deploys the app from GitHub.

- Push/merge to `main`: production deployment.
- Pull request: Vercel preview deployment, if enabled in the Vercel project.
- Build command: `pnpm build`.
- Production start command: managed by Vercel.
- Output directory: `.next`.

There is no `vercel.json` in this repository. Project settings are currently
managed in the Vercel dashboard.

## Required Environment Variables

Set these in Vercel for production. Use `.env.example` as the local template.

| Variable                  | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string used by Prisma   |
| `DIRECT_DATABASE_URL`     | Neon direct (non-pooled) URL for migrations   |
| `AUTH_SECRET`             | NextAuth v5 secret                            |
| `NEXTAUTH_SECRET`         | Backward-compatible auth secret               |
| `NEXTAUTH_URL`            | Canonical app URL                             |
| `GOOGLE_CLIENT_ID`        | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth client secret                    |
| `RESEND_API_KEY`          | Resend API key                                |
| `EMAIL_FROM`              | Sender address for email OTP                  |
| `OPENAI_API_KEY`          | OpenAI API key for Telegram assistant         |
| `TELEGRAM_BOT_TOKEN`      | Telegram bot token                            |
| `TELEGRAM_WEBHOOK_SECRET` | Secret used to validate Telegram webhooks     |
| `TELEGRAM_WEBHOOK_URL`    | Public `/api/telegram/webhook` URL            |
| `TELEGRAM_BOT_USERNAME`   | Telegram bot username, defaults to `CentaBot` |

Secrets must not be committed. If a real secret is accidentally written to a
tracked or shared file, rotate it in the provider dashboard.

Do not set `EMAIL_TRANSPORT=smtp` in production unless you intentionally want to
use an SMTP provider. The local sandbox uses this value to route OTP emails to
Mailpit.

## Local Sandbox

The local sandbox runs PostgreSQL and Mailpit through Docker Compose. The app
still runs on the host for fast Next.js development.

```bash
pnpm sandbox:setup
pnpm sandbox:dev
```

Local endpoints:

- App: `http://localhost:3000`.
- PostgreSQL: `localhost:5432`, database/user/password all `centavo`.
- Mailpit SMTP: `localhost:1026`.
- Mailpit UI: `http://localhost:8027`.

The sandbox uses `.env.sandbox`, which is committed because it contains only
local dummy values. Prisma sandbox commands set `CENTAVO_ENV=sandbox` so they
load `.env.sandbox` explicitly. The sandbox uses `prisma db push` because it is
a disposable local database; production releases must use migrations.

Use email sign-in in the app and read the OTP from Mailpit. Google OAuth,
Telegram, OpenAI, Resend, and live exchange rates still require real provider
credentials if you want to test those integrations locally.

## Database Migrations

Production migrations run automatically during the Vercel production build.
Vercel runs the `vercel-build` package script (`scripts/vercel-build.sh`)
instead of `build`:

- `VERCEL_ENV=production`: `prisma migrate deploy` runs first, using
  `DIRECT_DATABASE_URL` (Neon's non-pooled host) and falling back to
  `DATABASE_URL`. Then `pnpm build` runs.
- Preview and other environments skip migrations.
- If a migration fails, the build fails and Vercel keeps the current production
  deployment live. Fix the migration and redeploy.

Migrations must be backward compatible. The schema is migrated while the
previous deployment is still serving traffic, and it keeps running against the
new schema until the new build is promoted (or indefinitely if the build fails
after migrating). Prefer additive changes; split destructive ones (dropping or
renaming columns, adding `NOT NULL` without a default) into an expand release
and a later contract release.

Before merging a release with risky schema changes:

1. Rely on Neon point-in-time restore or create a Neon branch/snapshot.
2. Prefer rehearsing the migration on a Neon branch cloned from production.

CI already applies every migration to a fresh PostgreSQL database
(`pnpm db:deploy`) before running the test suite.

To run migrations manually (for example, a one-off data backfill workflow):

```bash
DATABASE_URL="<PRODUCTION_DIRECT_DATABASE_URL>" pnpm prisma migrate deploy
```

## Standard Release Flow

1. Confirm the local quality gates pass:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

2. Merge changes to `main`.
3. Pending migrations are applied by the Vercel production build.
4. Wait for the Vercel production deployment from `main` to complete.
5. Run production smoke checks.
6. Watch Vercel and provider logs for runtime or migration errors.

## Smoke Checks

- Sign in with an available auth provider.
- Complete onboarding if using a new test account.
- Create, update, and delete an expense.
- Create, update, and delete a category.
- Verify dashboard totals render.
- Verify currency conversion for a non-base currency expense.
- Verify Telegram link/connect flow if Telegram changes shipped.
- Verify the CLI can authenticate against production if CLI/API changes shipped.

## Rollback

For application-only regressions:

1. Redeploy the previous working Vercel deployment.
2. Confirm smoke checks.

For database-breaking regressions:

1. Restore the production database from the Neon backup/snapshot.
2. Redeploy the compatible app version.
3. Confirm smoke checks and monitor logs.

## Not Automated Today

- End-to-end tests are not configured in `package.json`.
- Vercel project settings are not represented as code.

## Historical blue valuation migration

1. Run `pnpm db:backfill-blue --backup-only` before the schema migration and keep the private backup outside Git.
2. Run `pnpm db:backfill-blue --dry-run` to check historical coverage.
3. Apply `3_historical_valuations` with `pnpm db:deploy`. It only adds fields, relaxes two legacy NOT NULL constraints, and archives each expense's old conversion and former account currency. Original expense fields are untouched.
4. Deploy the application changes, then run `pnpm db:backfill-blue --apply`. Existing expenses display their original amounts immediately; converted totals show pending counts until the backfill finishes.
5. Verify `originalsUnchanged: true`, `conflicts: 0`, and the pending counts. Re-run `--apply` to retry missing quotes or skipped concurrent edits. It never substitutes today's rate for a missing historical rate.

All existing ARS expenses are valued using historical blue sale quotes, even when their old stored USD equivalent used an official rate. Existing non-ARS USD conversions are retained when identifiable. Old converted values remain available in the backup and `legacy_conversion`.

For an app rollback, retain the new fields. New expenses may have NULL legacy conversions, so rolling back to old code requires adapting its writes and reports; do not drop the new fields or restore a whole-table backup over newer expenses. Restore individual original fields only after comparing the backup with subsequent edits.
