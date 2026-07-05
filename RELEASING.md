# Releasing

Use `DEPLOYMENT.md` as the source of truth for production deploys, migrations,
smoke checks, and rollback steps.

## Quick Release Checklist

1. Run local checks:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

2. Merge to `main`.
3. Run production migrations manually if the release includes schema changes:

```bash
DATABASE_URL="<PRODUCTION_DATABASE_URL>" pnpm prisma migrate deploy
```

4. Wait for the Vercel production deploy from `main`.
5. Run the smoke checks listed in `DEPLOYMENT.md`.
