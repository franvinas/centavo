# Centavo - Authentication

## Methods

Centavo supports two authentication methods:

### 1. Google OAuth

- User clicks "Sign in with Google"
- Redirected to Google consent screen
- On success, account is created or linked automatically
- Uses NextAuth.js Google provider

### 2. Email OTP (One-Time Password)

- User enters their email address
- A 6-digit code is sent to their email
- User enters the code to authenticate
- No password is ever stored or managed
- Uses NextAuth.js Email provider with a custom OTP flow (not magic link)

## Implementation

- **Library**: NextAuth.js v5 (Auth.js)
- **Session strategy**: JWT (stateless, no session table needed)
- **Session storage**: HTTP-only secure cookie

## User model

A user is uniquely identified by their email. Signing in with Google or email OTP for the same email address results in the same account (automatic account linking by email).

## Authorization

- All API routes require authentication (middleware check)
- All data is scoped to the authenticated user — no user can access another user's data
- Public routes: sign-in page, landing page (if any)

## Email delivery (for OTP)

- **Provider**: Resend (via `RESEND_API_KEY` env var)
- From address: configurable via `EMAIL_FROM` env var, defaults to `Centavo <onboarding@resend.dev>`
- HTML + plain text email templates in `src/lib/email-templates/otp-email.ts`
- OTP codes expire after 5 minutes
- Rate limit: max 5 OTP requests per email per hour (not yet implemented)
