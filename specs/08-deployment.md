# Centavo - Deployment & Infrastructure

## Architecture

```
[Browser / PWA] --> [Vercel (Next.js)] --> [Neon (PostgreSQL)]
                                      --> [Resend (Email OTP)]
                                      --> [Exchange Rate API]
```

## Application hosting: Vercel

- **Why**: Native Next.js support, zero-config deploys, automatic preview deployments per PR
- **Plan**: Free tier (Hobby) is sufficient for early testing and a small user base
- **Region**: Auto (choose closest to user, or pin to match Neon region)
- **Domains**: custom domain TBD (e.g. centavo.app or similar)

### Vercel configuration

- Framework preset: Next.js (auto-detected)
- Build command: `pnpm build`
- Output: `.next`
- Environment variables: set via Vercel dashboard (never committed)

## Database: Neon (PostgreSQL)

- **Why**: Serverless Postgres, scales to zero on inactivity, generous free tier, native Vercel integration
- **Plan**: Free tier (0.5 GiB storage, 190 compute hours/month) is enough for development and a small beta
- **Region**: Match Vercel deployment region to minimize latency
- **Branching**: Use Neon branches for preview deployments (each PR gets its own DB branch)
- **Connection**: Use Neon's serverless driver (`@neondatabase/serverless`) for edge compatibility, or standard connection string with Prisma

### Connection pooling

- Use Neon's built-in connection pooler (PgBouncer)
- Prisma `datasource` uses the pooled connection string
- Direct connection string used only for migrations

## Email: Resend

- **Why**: Modern API, good DX, 3,000 free emails/month, React Email support
- **Usage**: Sending OTP codes for authentication
- **From address**: `noreply@centavo.app` (requires domain verification)
- **Template**: Simple text email with the 6-digit code and expiry notice

## Exchange rate API

- **Primary**: Open Exchange Rates API — requires `OPEN_EXCHANGE_RATES_APP_ID` env var
- **Caching**: Cache rates for 1 hour in-memory server-side to reduce external calls

## Environment variables

| Variable                     | Description                             | Where set  |
| ---------------------------- | --------------------------------------- | ---------- |
| `DATABASE_URL`               | Neon pooled connection string           | Vercel env |
| `DIRECT_DATABASE_URL`        | Neon direct connection (for migrations) | Vercel env |
| `NEXTAUTH_SECRET`            | Random secret for JWT signing           | Vercel env |
| `NEXTAUTH_URL`               | App URL (e.g. https://centavo.app)      | Vercel env |
| `GOOGLE_CLIENT_ID`           | Google OAuth client ID                  | Vercel env |
| `GOOGLE_CLIENT_SECRET`       | Google OAuth client secret              | Vercel env |
| `RESEND_API_KEY`             | Resend API key for sending emails       | Vercel env |
| `OPEN_EXCHANGE_RATES_APP_ID` | Open Exchange Rates API app ID          | Vercel env |
| `EMAIL_FROM`                 | From address for emails (optional)      | Vercel env |

## Local development

- PostgreSQL via Docker Compose or Neon dev branch
- `.env.local` file for environment variables (git-ignored)
- `pnpm dev` runs Next.js dev server on `localhost:3000`
