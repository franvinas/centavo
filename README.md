# Centavo

Personal expense tracker with multi-currency support. Track spending across currencies with automatic exchange rate conversion, category management, and a mobile-first PWA experience.

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
- PostgreSQL 16+ (or a [Neon](https://neon.tech) database)

### Setup

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Required variables:

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
   | `NEXTAUTH_SECRET` | Random secret for JWT signing |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
   | `RESEND_API_KEY` | Resend API key for email OTP |
   | `OPEN_EXCHANGE_RATES_APP_ID` | Open Exchange Rates API key |

3. Set up the database:

   ```bash
   pnpm db:generate   # Generate Prisma client
   pnpm db:push       # Push schema to database
   pnpm db:seed       # Seed default categories
   ```

4. Start the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # TypeScript check (tsc --noEmit)
pnpm format           # Prettier write
pnpm format:check     # Prettier check

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations (dev)
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed default categories
pnpm db:studio        # Prisma Studio GUI

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

Each expense stores both the original amount/currency and the converted base amount/exchange rate. Rates are fetched from Open Exchange Rates (ECB data) and cached in-memory for 1 hour. Changing a user's base currency recalculates all existing expenses.

### Database Schema

- **User** — Profile, base currency preference
- **Category** — User-scoped expense categories with color and icon
- **Expense** — Amount, currency, base amount, exchange rate, description, date, notes
- **Account / Session / VerificationToken** — NextAuth standard models

### Responsive Layout

- **Mobile (<768px):** Bottom navigation bar with centered FAB for new expenses
- **Desktop (>=768px):** 260px fixed sidebar with bottom-right FAB

## Testing

22 test files covering server actions, API routes, data queries, validations, utilities, and components. Tests use Prisma deep mocks (vitest-mock-extended), auth mocks, and factory functions for test data.

```bash
pnpm test             # Run all tests
pnpm docker:test      # Run with containerized PostgreSQL
```

## CI/CD

GitHub Actions runs on push/PR to `main`:

- **Check job:** lint, format, type-check, build
- **Test job:** PostgreSQL service, schema push, tests, coverage upload
