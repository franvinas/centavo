# Centavo

Multi-user expense tracker with multi-currency support. Track spending across currencies with automatic exchange rate conversion, category management, authenticated accounts, and a mobile-first PWA experience.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** PostgreSQL via Prisma 7 with `@prisma/adapter-pg`
- **Auth:** NextAuth v5 (JWT strategy) — Google OAuth + Email OTP (Resend)
- **Styling:** Tailwind CSS 4, shadcn/ui (New York style)
- **PWA:** Serwist (service worker, installable)
- **Validation:** Zod 4
- **Testing:** Vitest 4, React Testing Library, vitest-mock-extended
- **Package Manager:** pnpm 10

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker, for the local PostgreSQL and Mailpit sandbox

### Setup

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Start the local sandbox and prepare the database:

   ```bash
   pnpm sandbox:setup
   ```

   This starts PostgreSQL on `localhost:5432`, Mailpit SMTP on
   `localhost:1026`, Mailpit UI on `localhost:8027`, syncs the Prisma schema,
   and seeds the local database.

3. Start the dev server with sandbox environment variables:

   ```bash
   pnpm sandbox:dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Email OTP messages are
   captured in [http://localhost:8027](http://localhost:8027).

4. Optional: copy the environment template if you want to run against custom
   local or external services instead of `.env.sandbox`:

   ```bash
   cp .env.example .env.local
   ```

   Required variables for a non-sandbox setup:

   | Variable                  | Description                            |
   | ------------------------- | -------------------------------------- |
   | `DATABASE_URL`            | PostgreSQL connection string           |
   | `NEXTAUTH_URL`            | App URL (e.g. `http://localhost:3000`) |
   | `NEXTAUTH_SECRET`         | Random secret for JWT signing          |
   | `GOOGLE_CLIENT_ID`        | Google OAuth client ID                 |
   | `GOOGLE_CLIENT_SECRET`    | Google OAuth client secret             |
   | `RESEND_API_KEY`          | Resend API key for email OTP           |
   | `OPENAI_API_KEY`          | OpenAI API key (Telegram assistant)    |
   | `TELEGRAM_BOT_TOKEN`      | Telegram bot token                     |
   | `TELEGRAM_WEBHOOK_SECRET` | Secret used to validate webhook calls  |
   | `TELEGRAM_WEBHOOK_URL`    | Public `/api/telegram/webhook` URL     |
   | `TELEGRAM_BOT_USERNAME`   | Bot username (default `CentaBot`)      |

   Do not point local development commands at production databases.

### CLI

Install the published CLI:

```bash
npm install -g centavo-cli
```

The CLI targets production by default (`https://centavo.vercel.app/`), so you can sign in immediately:

```bash
centavo auth login
centavo auth whoami
centavo expense list
```

Use `npx` if you do not want a global install:

```bash
npx centavo-cli auth login
```

For local development against a local app instance, build and link the CLI locally:

```bash
pnpm cli:build
pnpm cli:link
```

Then authenticate against your running local Centavo app:

```bash
centavo auth login --base-url http://localhost:3000
```

## Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # TypeScript check (tsc --noEmit)
pnpm format           # Prettier write
pnpm format:check     # Prettier check

# Local sandbox
pnpm sandbox:setup    # Start Postgres/Mailpit, migrate, seed
pnpm sandbox:up       # Start Postgres and Mailpit
pnpm sandbox:down     # Stop sandbox containers
pnpm sandbox:reset    # Recreate sandbox database volume
pnpm sandbox:migrate  # Sync Prisma schema to sandbox DB
pnpm sandbox:seed     # Seed sandbox DB
pnpm sandbox:dev      # Start Next.js with .env.sandbox

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations (dev)
pnpm db:deploy        # Apply existing migrations
pnpm db:push          # Push schema directly to DB
pnpm db:seed          # Seed default categories
pnpm db:studio        # Prisma Studio GUI

# CLI
pnpm cli:build        # Build the Centavo CLI
pnpm cli:link         # Link the CLI globally

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage report

# Docker (containerized tests with PostgreSQL)
pnpm docker:test      # Run tests in container
pnpm docker:coverage  # Coverage in container
pnpm docker:down      # Tear down containers
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Sign-in page (public)
│   ├── (onboarding)/        # First-time user setup
│   ├── (app)/               # Authenticated pages
│   │   ├── dashboard/       # Spending summary & recent expenses
│   │   ├── expenses/        # List, create, edit expenses
│   │   ├── categories/      # Manage expense categories
│   │   └── settings/        # User profile & preferences
│   └── api/                 # REST endpoints
├── components/
│   ├── dashboard/           # Dashboard-specific components
│   ├── expenses/            # Expense forms, cards, filters
│   ├── layout/              # App shell, sidebar, nav, FAB
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── actions/             # Server actions (form mutations)
│   ├── data/                # Read-only queries (server components)
│   ├── validations/         # Zod schemas
│   ├── auth.ts              # NextAuth config
│   ├── db.ts                # Prisma singleton
│   ├── exchange-rate.ts     # Currency conversion (cached)
│   └── format.ts            # Date & currency formatting
└── test-utils/              # Mocks & factories for tests
```

## Architecture

### Data Flow

The app uses three data layers, all scoped per authenticated user:

1. **Server Actions** (`src/lib/actions/`) — Client component form submissions. Validate with Zod, mutate via Prisma, call `revalidatePath()`.
2. **API Routes** (`src/app/api/`) — REST endpoints returning JSON. Auth via `getAuthUser()`.
3. **Data Access** (`src/lib/data/`) — Read-only Prisma queries consumed by server components.

### Multi-Currency

Each expense keeps its original `amount` and `currency`, plus a fixed USD valuation and historical quote snapshots. ARS uses **dólar blue venta** from [ArgentinaDatos](https://argentinadatos.com/docs/operations/get-cotizaciones-dolares-casa), selecting the expense date or the last available earlier observation. EUR/USD uses [Frankfurter historical rates](https://frankfurter.dev/). Both providers are public and require no API key.

The stored snapshots include rate, effective date, and source. Changing the account's `baseCurrency` changes presentation only; it never rewrites expenses or refreshes their rates. Expenses already in the display currency are summed directly from their originals, so ARS amounts never round-trip through USD. Changing the expense date or original currency selects a new historical snapshot; changing its amount retains its existing quote.

Missing quotes leave the conversion pending. Original amounts remain available, converted totals include only valued expenses, and the UI/API/CLI/Telegram report `pendingConversionCount` for incomplete totals. The historical rate endpoint accepts `GET /api/exchange-rate?from=ARS&to=USD&date=YYYY-MM-DD`.

Legacy `base_amount` and `exchange_rate` values remain in the database for audit, with their former display currency saved in `legacy_conversion`. New expenses use `usd_amount`, `usd_exchange_rate`, and `conversion_rates`; API `baseAmount` is computed for the current display preference.

To backfill existing expenses after deploying the schema migration:

```bash
pnpm db:backfill-blue --backup-only # Private, gitignored expense backup
pnpm db:backfill-blue --dry-run     # Read-only conversion preview
pnpm db:backfill-blue --apply       # Adds valuations; preserves all originals
```

The backfill is resumable, retains successful snapshots, detects concurrent edits, and verifies a fingerprint covering original amounts, currencies, dates, categories, descriptions, notes, timestamps, and legacy conversions. Backups are stored with private permissions in `backups/`.

### Database Schema

- **User** — Profile, base currency preference
- **Category** — User-scoped expense categories with color and icon
- **Expense** — Amount, currency, base amount, exchange rate, description, date, notes
- **Account / Session / VerificationToken** — NextAuth standard models

### Responsive Layout

- **Mobile (<768px):** Bottom navigation bar with centered FAB for new expenses
- **Desktop (>=768px):** 260px fixed sidebar with bottom-right FAB

## Testing

Tests cover server actions, API routes, data queries, validations, utilities, CLI commands, Telegram helpers, and components. Tests use Prisma deep mocks (vitest-mock-extended), auth mocks, and factory functions for test data.

```bash
pnpm test             # Run all tests
pnpm docker:test      # Run with containerized PostgreSQL
```

## Deployment

Production deploys are handled by Vercel from the `main` branch. See `DEPLOYMENT.md` for the production runbook and `TODO.md` for pending operational improvements.
