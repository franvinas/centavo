# Releasing to Production

This project uses the `CI` workflow (`.github/workflows/ci.yml`) for quality
checks on push/PR.

## Required local environment variables

- `DATABASE_URL` (set this to your production direct connection string only
  while running migrations)

## Standard release flow

1. Merge your changes to `main` after CI is green.
2. Run production migrations locally:

   ```bash
   DATABASE_URL="<DIRECT_DATABASE_URL>" pnpm prisma migrate deploy
   ```

3. Trigger or wait for Vercel production deploy from `main`.
4. Validate smoke checks in production:
   - Sign in
   - Create/update/delete expense
   - Create/update/delete category
   - Telegram link/connect flow
5. Monitor logs for migration or runtime errors for a few minutes.

For high-risk schema changes, you can still do a short write-freeze window,
but it is optional for this project stage.

## Database-breaking migration checklist

Before running production migration:

1. Create a Neon backup/snapshot of production.
2. Rehearse migrations on a Neon branch cloned from production.
3. Confirm migration execution time is acceptable.

## Rollback

1. Restore production DB from Neon backup/snapshot.
2. Redeploy the previous working app version.
