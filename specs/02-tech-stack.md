# Centavo - Tech Stack

## Decision summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript | Single language across the entire stack |
| Framework | Next.js (App Router) | Fullstack React framework, API routes built in |
| Database | PostgreSQL | Robust relational DB, great for financial data |
| ORM | Prisma | Type-safe database access, excellent DX with TypeScript |
| Auth | NextAuth.js (Auth.js) | Supports Google OAuth + email OTP out of the box |
| Styling | Tailwind CSS | Utility-first, fast to build minimal/clean UIs |
| UI components | shadcn/ui | Copy-paste components built on Radix, no heavy dependency |
| PWA | next-pwa / Serwist | Service worker generation for installability and offline shell |
| Testing | Vitest + React Testing Library + Playwright | Unit/integration with Vitest, component tests with RTL, E2E with Playwright |
| Deployment | TBD | Vercel, self-hosted, or Docker — to be decided |

## Why this stack?

### Next.js + API routes (no separate backend)

For a personal expense tracker, a separate backend service adds unnecessary complexity. Next.js API routes (Route Handlers in App Router) provide:
- Server-side logic co-located with the frontend
- Built-in request handling, middleware, and auth integration
- Easy deployment as a single unit

If the app grows beyond what API routes can handle, we can extract a separate service later.

### Prisma + PostgreSQL

- Prisma provides type-safe queries generated from the schema
- Migrations are handled declaratively
- PostgreSQL handles decimal arithmetic correctly (important for money)
- JSONB support for flexible metadata if needed

### Tailwind + shadcn/ui

- Tailwind keeps styling fast and consistent without writing CSS files
- shadcn/ui gives us accessible, well-built components (dialogs, dropdowns, forms, tables) without a heavy component library dependency
- Both support dark mode out of the box

### PWA

- The app will be installable on mobile home screens
- A service worker caches the app shell for fast loading
- Full offline support is **not** an MVP goal (cloud-based), but the PWA shell ensures the app feels native

## Package manager

- **pnpm** — fast, disk-efficient, strict dependency resolution

## Code quality

- **ESLint** — linting with Next.js recommended config
- **Prettier** — code formatting
- **TypeScript strict mode** — enabled

## Testing

- **Vitest** — unit and integration tests (jsdom environment)
- **React Testing Library** — component tests with user-event
- **Playwright** — E2E browser tests (Chromium + mobile viewport)
- **vitest-mock-extended** — deep mocking for Prisma client
- **Docker Compose** — containerized test execution with PostgreSQL service
