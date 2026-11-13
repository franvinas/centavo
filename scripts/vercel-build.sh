#!/usr/bin/env bash
# Vercel runs the `vercel-build` package script instead of `build` when present.
# Production deploys apply pending Prisma migrations before building, so new
# code is only promoted once the schema is migrated. If a migration fails, the
# build fails and the current production deployment stays live.
set -euo pipefail

if [ "${VERCEL_ENV:-}" = "production" ]; then
  # Prefer Neon's direct (non-pooled) connection for migrations.
  url="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"
  url="$(printf '%s' "$url" | tr -d '\r\n')"
  if [ -z "$url" ]; then
    echo "DIRECT_DATABASE_URL or DATABASE_URL is required to migrate" >&2
    exit 1
  fi
  echo "Applying production database migrations..."
  DATABASE_URL="$url" pnpm exec prisma migrate deploy
else
  echo "Skipping database migrations (VERCEL_ENV=${VERCEL_ENV:-unset})"
fi

pnpm build
