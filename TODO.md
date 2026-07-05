# TODO

Operational project backlog. Keep this file focused on actionable items that
improve reliability, deployability, local development, or product quality.

## High Priority

- Rotate secrets that were present in `.env.local` and verify providers use the
  new values.
- Add a real local sandbox with app dependencies, likely `docker-compose.yml`
  for PostgreSQL plus documented setup commands.
- Add a checked-in GitHub Actions workflow for `pnpm lint`,
  `pnpm format:check`, `pnpm type-check`, `pnpm test`, and `pnpm build`.
- Decide and document the production migration policy: keep manual migrations or
  add an explicitly triggered GitHub Action.
- Update Vercel project settings documentation with production URL, project
  name, region, and required environment variable scopes.

## Medium Priority

- Add branch protection rules for `main` once CI exists.
- Add a repeatable Neon preview/local database workflow.
- Add smoke-test checklist ownership after every production deploy.
- Add coverage thresholds after stabilizing the current suite.
- Review README periodically so test counts and operational docs stay current.

## Low Priority

- Consider E2E tests for the core flows: sign in, onboarding, expenses,
  categories, and dashboard.
- Consider a Vercel project configuration file if dashboard-only settings become
  hard to track.
- Add a release notes checklist for CLI publication and app deployment.

## Done

- Documented the current production deployment flow in `DEPLOYMENT.md`.
- Added `.env.example` with sanitized local placeholders.
- Updated release and CI/CD docs to reflect the current repository state.
- Ignored built CLI output in ESLint.
