# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Centavo is a personal expense tracker web app with multi-currency support. Single-user, cloud-based (PostgreSQL), PWA-installable. Built with Next.js 16 App Router, Prisma 7, NextAuth v5 (JWT strategy), and Tailwind CSS 4.

## Common Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI)

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations (dev)
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed default categories
pnpm db:studio        # Prisma Studio GUI

# Testing
pnpm test             # Run all Vitest tests
pnpm test -- src/lib/__tests__/format.test.ts   # Run single test file
pnpm test:watch       # Watch mode
pnpm test:coverage    # With v8 coverage report

# Docker (containerized tests with PostgreSQL)
pnpm docker:test      # Unit/integration in container
pnpm docker:down      # Tear down containers
```

## Architecture

### Route Structure

- `src/app/(auth)/` — Sign-in page (public)
- `src/app/(onboarding)/` — First-time user setup (name + base currency selection)
- `src/app/(app)/` — All authenticated pages (dashboard, expenses, categories, settings)
- `src/app/api/` — REST API routes (expenses, categories, user, exchange-rate, auth)
- `src/app/page.tsx` — Redirects to `/dashboard`

### Data Flow (Three Layers)

1. **Server Actions** (`src/lib/actions/`) — Form submissions from components. Validate with Zod, mutate via Prisma, call `revalidatePath()`. Used by `expense-form.tsx` and other client components.
2. **API Route Handlers** (`src/app/api/`) — REST endpoints. Use `getAuthUser()` from `src/lib/api-utils.ts` for auth. Return JSON responses.
3. **Data Access** (`src/lib/data/`) — Read-only queries used by server components. `getExpenses()`, `getCategories()`, `getCurrentUser()`, `getExpenseSummary()`.

All three layers authenticate via `src/lib/auth.ts` (NextAuth). All data is scoped per `userId`.

### Database

- **Prisma schema**: `prisma/schema.prisma`
- **Generated client output**: `src/generated/prisma/` (gitignored, generated at build time)
- **Prisma singleton**: `src/lib/db.ts` — uses `pg.Pool` + `PrismaPg` adapter with a Proxy for lazy initialization. Import as `import { prisma } from "@/lib/db"`.
- **Decimal fields**: `amount`, `baseAmount`, `exchangeRate` are Prisma `Decimal(12,2)` / `Decimal(12,6)`. Convert with `Number(expense.baseAmount)`, not `.toNumber()`.

### Auth

- NextAuth v5 beta with JWT strategy (no database sessions)
- Providers: Google OAuth + Resend (Email OTP)
- Config: `src/lib/auth.ts`, route handler: `src/app/api/auth/[...nextauth]/route.ts`
- `getCurrentUser()` in `src/lib/data/user.ts` returns the authenticated user from DB, or `null` if no session exists
- On first sign-in, users without a name are redirected to `/onboarding` (see `src/lib/actions/onboarding.ts`, `src/lib/validations/onboarding.ts`)

### Multi-Currency

- Each expense stores `amount` + `currency` (original) and `baseAmount` + `exchangeRate` (converted to user's `baseCurrency`)
- Exchange rates from Open Exchange Rates API (`OPEN_EXCHANGE_RATES_APP_ID` env var), cached 1 hour in-memory (`src/lib/exchange-rate.ts`)
- Supported currencies: `["USD", "EUR", "ARS"]` (defined in `src/lib/constants.ts`)
- Changing user's base currency recalculates all expense `baseAmount` values

### Validation

- Zod v4 schemas in `src/lib/validations/` — imported from `"zod/v4"` (not `"zod"`)
- Schemas: `createExpenseSchema`, `updateExpenseSchema`, `createCategorySchema`, `updateCategorySchema`, `updateUserSchema`, `completeOnboardingSchema`
- Currency codes are uppercased via `.transform(v => v.toUpperCase())`

### UI

- **Component library**: shadcn/ui (New York style) in `src/components/ui/`
- **Layout**: Mobile-first. `<768px` = bottom nav + center FAB. `≥768px` = 260px sidebar + fixed bottom-right FAB. Wrapper: `src/components/layout/app-shell.tsx`
- **Design tokens**: Defined as CSS custom properties in `src/app/globals.css` — cream background (#F5F4F1), forest green accent (#3D8A5A), Outfit font
- **Icons**: Lucide React. Category icon mapping in `src/lib/category-icon-map.ts`

## Testing Patterns

- **Framework**: Vitest 4 + jsdom + React Testing Library
- **Test location**: Colocated `__tests__/` folders next to source files
- **Path alias**: `@/*` → `./src/*` (configured in both `tsconfig.json` and `vitest.config.ts`)

### Mocking

- **Prisma**: `import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock"` — deep mock via `vitest-mock-extended`. Auto-mocks `@/lib/db`.
- **Auth**: `import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock"` — mocks `@/lib/auth`.
- **Fetch** (exchange rates): `import { mockExchangeRateApi } from "@/test-utils/fetch-mock"` — stubs `global.fetch`.
- **Factories**: `import { createMockExpense, createPrismaExpense, ... } from "@/test-utils/factories"` — `createMock*` returns app-level types, `createPrisma*` returns Prisma-shaped objects.

### Component Tests

React 19 in jsdom double-renders components, causing duplicate DOM elements. Use `container.querySelector()` instead of RTL's `screen.getByRole()` / `screen.getByText()` to avoid "multiple elements found" errors.

### API Route Tests

Next.js 16 route params are async. Pass params as: `{ params: Promise.resolve({ id: "exp-1" }) }`.

## Code Style

- **Formatter**: Prettier (semicolons, double quotes, trailing commas, 80-char width, tailwindcss plugin)
- **Import alias**: Always use `@/` prefix (e.g., `@/lib/auth`, `@/components/ui/button`)
- **Server actions**: Files start with `"use server"` directive
