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

| Variable                     | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string used by Prisma   |
| `AUTH_SECRET`                | NextAuth v5 secret                            |
| `NEXTAUTH_SECRET`            | Backward-compatible auth secret               |
| `NEXTAUTH_URL`               | Canonical app URL                             |
| `GOOGLE_CLIENT_ID`           | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET`       | Google OAuth client secret                    |
| `RESEND_API_KEY`             | Resend API key                                |
| `EMAIL_FROM`                 | Sender address for email OTP                  |
| `OPEN_EXCHANGE_RATES_APP_ID` | Open Exchange Rates app ID                    |
| `OPENAI_API_KEY`             | OpenAI API key for Telegram assistant         |
| `TELEGRAM_BOT_TOKEN`         | Telegram bot token                            |
| `TELEGRAM_WEBHOOK_SECRET`    | Secret used to validate Telegram webhooks     |
| `TELEGRAM_WEBHOOK_URL`       | Public `/api/telegram/webhook` URL            |
| `TELEGRAM_BOT_USERNAME`      | Telegram bot username, defaults to `CentaBot` |

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

Migrations are currently run manually. There is no checked-in GitHub Actions
workflow that applies production migrations.

Before a production release with schema changes:

1. Create a Neon backup or snapshot.
2. Prefer rehearsing the migration on a Neon branch cloned from production.
3. Run migrations against the production database:

```bash
DATABASE_URL="<PRODUCTION_DATABASE_URL>" pnpm prisma migrate deploy
```

Use a direct database connection for migrations if your Neon setup provides one.
The current Prisma config reads `DATABASE_URL`.

## Standard Release Flow

1. Confirm the local quality gates pass:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

2. Merge changes to `main`.
3. If the release includes migrations, run `prisma migrate deploy` as described
   above.
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

- Production migrations are not automated in this repository.
- GitHub Actions workflows are not checked in.
- End-to-end tests are not configured in `package.json`.
- Vercel project settings are not represented as code.
