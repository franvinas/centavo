# Centavo - CLI Specification

## Goal

Add a first-party CLI for Centavo users so they can manage their data from the terminal with feature parity for the current web app:

- Authenticate
- Complete onboarding
- Add, list, view, edit, and delete expenses
- List, add, edit, and delete categories
- View dashboard summary
- View analytics
- View and update settings
- Link and unlink Telegram

The CLI must be safe for interactive use, scriptable for automation, and efficient for bulk operations.

## Non-goals for v1

- Natural-language chat mode
- Local-only storage
- Offline sync
- Plugin system
- Budgets or recurring expenses

## Product principles

### 1. The CLI is a real Centavo client

The CLI talks to Centavo APIs over HTTPS. It does not access Prisma or the database directly.

This keeps:

- auth centralized
- permissions consistent
- web and CLI behavior aligned
- future hosted deployment simple

### 2. Batch support is native, not bolted on

Batch operations are part of the normal command model. Users should not need a separate `batch` command.

### 3. Human output and machine output are both first-class

Every read command and every mutating command should support:

- human-friendly default output
- `--json` for scripts

### 4. Help output is part of the product

`--help` should be accurate, short, and example-driven at every command level.

## Packaging

The CLI should live in a separate workspace package:

```text
packages/
  cli/
```

Recommended high-level structure:

```text
packages/cli/
  package.json
  tsconfig.json
  src/
    index.ts
    commands/
    lib/
      api.ts
      auth.ts
      output.ts
      selectors.ts
      prompts.ts
```

Rationale:

- keeps CLI dependencies isolated from the Next.js app
- allows independent release/versioning later
- avoids mixing terminal concerns into the web package

## Authentication

### Chosen approach

Use browser-based login as the default CLI auth path, with the web sign-in page handling existing sessions or OTP as needed.

Flow:

1. User runs `centavo auth login`
2. CLI requests a short-lived device authorization from the server
3. CLI opens the browser to a Centavo approval page
4. If the user already has a web session, they approve immediately
5. If not, they sign in through the existing web flow
6. After approval, the CLI polls the server
7. The server issues a dedicated CLI token
8. The CLI stores the token securely on the machine

### Why this approach

- reuses existing web auth UX
- supports Google and email OTP without duplicating auth logic in the terminal
- works for users who are already signed in
- keeps CLI auth separate from browser sessions

### Required commands

- `centavo auth login`
- `centavo auth login --no-browser`
- `centavo auth logout`
- `centavo auth whoami`

### Token model

CLI tokens must be distinct from NextAuth sessions.

Recommended data model additions:

- `CliAuthRequest`
  - `id`
  - `code`
  - `userCode`
  - `status` (`pending`, `approved`, `consumed`, `expired`)
  - `userId`
  - `expiresAt`
  - `createdAt`
- `CliToken`
  - `id`
  - `userId`
  - `name`
  - `tokenHash`
  - `lastUsedAt`
  - `expiresAt`
  - `revokedAt`
  - `createdAt`

Notes:

- store token hashes, not raw tokens
- allow multiple active CLI tokens per user
- show and revoke tokens from the web settings page later

### Storage on the client

Preferred order:

1. OS keychain / credential store
2. Fallback config file with restrictive permissions if keychain support is unavailable

Suggested local config path:

```text
~/.config/centavo/config.json
```

Stored values:

- API base URL
- active token metadata
- output preference if the user sets a default

## Command tree

```bash
centavo auth login
centavo auth logout
centavo auth whoami

centavo setup

centavo expense add
centavo expense list
centavo expense show <expense-id>
centavo expense edit [expense-id]
centavo expense delete [expense-id]
centavo expense export
centavo expense import

centavo category list
centavo category add
centavo category edit <category-id>
centavo category delete <category-id>
centavo category reassign

centavo dashboard

centavo analytics summary
centavo analytics categories
centavo analytics trend
centavo analytics currencies

centavo settings show
centavo settings set

centavo telegram link
centavo telegram unlink
```

## Command behavior

### `auth`

#### `centavo auth login`

- starts device auth flow
- opens browser unless `--no-browser` is provided
- prints fallback URL and short code
- stores token locally on success

#### `centavo auth whoami`

Shows:

- email
- display name
- base currency
- locale
- token label or session label if available

#### `centavo auth logout`

- deletes the local token
- optional future behavior: revoke remote token with `--revoke`

### `setup`

Completes onboarding for authenticated users who have not set up their account yet.

Flags:

- `--name <name>`
- `--base-currency <code>`
- interactive prompts if flags are missing

### `expense add`

Single add:

```bash
centavo expense add --amount 12.50 --currency USD --description Coffee --category Food
```

Batch add:

```bash
centavo expense import --file expenses.csv
cat expenses.jsonl | centavo expense import --stdin --format jsonl
```

Flags:

- `--amount <number>`
- `--currency <code>`
- `--description <text>`
- `--category <name-or-id>`
- `--date <YYYY-MM-DD>`
- `--notes <text>`

Behavior:

- `currency` defaults to the user's base currency
- `date` defaults to the user's current date based on timezone
- category can be resolved by exact ID or exact name

### `expense list`

Flags:

- `--search <text>`
- `--category <name-or-id>`
- `--from <YYYY-MM-DD>`
- `--to <YYYY-MM-DD>`
- `--page <n>`
- `--limit <n>`
- `--json`

Default output should be a compact table with:

- expense ID
- date
- description
- category
- amount
- base amount

### `expense show`

Shows one expense in expanded form.

### `expense edit`

Supports both single-target and batch-target modes.

Single target:

```bash
centavo expense edit exp_123 --amount 14.00 --notes "corrected amount"
```

Batch target:

```bash
centavo expense edit --search Uber --from 2026-03-01 --set notes="work trip" --preview
```

Selectors:

- `--ids <id1,id2,id3>`
- `--search <text>`
- `--category <name-or-id>`
- `--from <YYYY-MM-DD>`
- `--to <YYYY-MM-DD>`
- `--before <YYYY-MM-DD>`
- `--after <YYYY-MM-DD>`

Update flags:

- `--amount <number>`
- `--currency <code>`
- `--description <text>`
- `--category <name-or-id>`
- `--date <YYYY-MM-DD>`
- `--notes <text>`
- `--clear-notes`
- repeated `--set <field=value>` for scripting

Safety flags:

- `--preview`
- `--yes`
- `--json`

Rules:

- if multiple rows are matched, require confirmation unless `--yes` is passed
- if no update fields are provided, fail with usage help
- if both an explicit expense ID and selectors are provided, fail

### `expense delete`

Supports single-target and selector-based batch delete.

Examples:

```bash
centavo expense delete exp_123
centavo expense delete --search test --from 2026-04-01 --preview
```

Flags:

- all selector flags from `expense edit`
- `--preview`
- `--yes`
- `--json`

Rules:

- multi-row delete must show a summary before confirmation
- if the command matches zero rows, return a non-zero exit code

### `expense export`

Exports expenses matching selectors.

Formats:

- `csv`
- `json`
- `jsonl`

Flags:

- selector flags
- `--format <csv|json|jsonl>`
- `--output <path>`

### `expense import`

Imports expenses from CSV or JSONL.

Flags:

- `--file <path>`
- `--stdin`
- `--format <csv|jsonl>`
- `--atomic`
- `--continue-on-error`
- `--json`
- `--dry-run`

Rules:

- default should be atomic for safety
- `--continue-on-error` returns per-row success and failure details
- import format should support category by name or ID

Future improvement:

- idempotent imports with an external ID or import fingerprint

### `category`

#### `category list`

Shows all user categories.

Recommended output:

- ID
- name
- color
- icon
- expense count

#### `category add`

Flags:

- `--name <text>`
- `--color <#RRGGBB>`
- `--icon <icon-name>`

#### `category edit`

Flags:

- `--name <text>`
- `--color <#RRGGBB>`
- `--icon <icon-name>`

#### `category delete`

Rules:

- if expenses still reference the category, deletion fails
- error message should direct the user to `category reassign`

#### `category reassign`

Reassign expenses from one category to another in bulk.

Example:

```bash
centavo category reassign --from Transport --to Commute --yes
```

This command exists because category deletion is blocked when expenses still reference the category.

### `dashboard`

Shows the current dashboard summary in terminal form:

- total spent this month
- expense count this month
- last month comparison
- top categories
- recent expenses

### `analytics`

#### `analytics summary`

Flags:

- `--period <preset>`
- `--from <YYYY-MM-DD>`
- `--to <YYYY-MM-DD>`

Presets should match the web app:

- `this-month`
- `last-3-months`
- `last-6-months`
- `last-12-months`
- `this-year`
- `custom`

#### `analytics categories`

Shows spend by category for a time range.

#### `analytics trend`

Shows spend over time for a time range.

The human output can be a simple text table in v1. ASCII sparklines are optional, not required.

#### `analytics currencies`

Shows spending grouped by original currency.

### `settings`

#### `settings show`

Shows:

- display name
- email
- base currency
- locale
- timezone
- Telegram connection status

#### `settings set`

Supported updates:

- `--name <text>`
- `--base-currency <code>`
- `--locale <en|es>`
- `--timezone <iana-tz>`

### `telegram`

#### `telegram link`

- returns the same link token flow as the web settings page
- prints the `t.me` URL and optionally opens it with `--open`

#### `telegram unlink`

- unlinks the chat
- clears Telegram conversation history, matching current web behavior

## Batch semantics

Batch behavior must be consistent across commands.

### Targeting

Commands may target rows in one of three ways:

1. Single positional ID
2. Explicit ID list with `--ids`
3. Query selectors

### Preview

`--preview` never mutates data. It prints:

- matched row count
- a short sample or full list depending on count
- the proposed mutation

### Confirmation

Interactive confirmation is required when:

- more than one row will be changed
- deleting any rows without a positional ID

`--yes` bypasses confirmation.

### Atomicity

Defaults:

- batch edit: atomic
- batch delete: atomic
- import: atomic

Alternative:

- `--continue-on-error` only for import in v1

### Exit codes

- `0`: success
- `1`: unexpected failure
- `2`: usage or validation error
- `3`: auth failure
- `4`: zero rows matched for a selector mutation
- `5`: partial success during non-atomic import

## Output rules

### Human output

Use compact terminal-friendly formatting:

- tables for lists
- key/value blocks for detail views
- short summaries for mutations

Human output should always include IDs for rows that may need follow-up operations.

### JSON output

`--json` should return stable JSON shapes.

Suggested mutation shape:

```json
{
  "ok": true,
  "matched": 3,
  "changed": 3,
  "items": []
}
```

Suggested preview shape:

```json
{
  "ok": true,
  "preview": true,
  "matched": 3,
  "changes": {
    "notes": "work trip"
  },
  "items": []
}
```

## Help system

The CLI must have strong built-in help from day one.

### Help requirements

Every command and subcommand should include:

- one-line summary
- usage line
- argument descriptions
- option descriptions
- 2 to 5 examples
- batch notes if selector mode is supported
- related commands where useful

### Help behavior

- `centavo --help` shows the top-level command map
- `centavo expense --help` shows expense subcommands
- `centavo expense edit --help` shows examples for both single and batch modes
- invalid usage should print the relevant command help, not only an error

### Example

```bash
centavo expense edit [expense-id]

Edit one expense or many matching expenses.

Examples:
  centavo expense edit exp_123 --amount 14.50
  centavo expense edit --search Uber --set notes="work trip" --preview
  centavo expense edit --category Food --before 2026-01-01 --set category=Dining --yes
```

### Testing

Add snapshot-style tests for `--help` output at:

- root
- each top-level command
- each batch-capable command

## API changes required

The current app already has API coverage for expenses, categories, user, and Telegram linking, but the CLI needs additional endpoints and auth support.

### 1. Add bearer-token auth support

Introduce an API auth helper that accepts either:

- existing authenticated browser session
- `Authorization: Bearer <cli-token>`

This allows the same API routes to serve web and CLI clients.

### 2. Add CLI auth endpoints

Recommended endpoints:

- `POST /api/cli/auth/requests`
  - create a device auth request
- `GET /api/cli/auth/requests/:id`
  - poll current request status
- `POST /api/cli/auth/requests/:id/approve`
  - browser session approves the request
- `POST /api/cli/auth/requests/:id/consume`
  - CLI exchanges approved request for token
- `POST /api/cli/auth/revoke`
  - revoke current token

### 3. Add analytics API endpoints

Recommended endpoints:

- `GET /api/analytics/summary`
- `GET /api/analytics/categories`
- `GET /api/analytics/trend`
- `GET /api/analytics/currencies`

These should map to the existing analytics data layer.

### 4. Add onboarding/setup API endpoint

Recommended endpoint:

- `POST /api/setup`

This should reuse onboarding rules already present in the app.

### 5. Add bulk expense endpoints

Recommended endpoints:

- `POST /api/expenses/bulk-update`
- `POST /api/expenses/bulk-delete`
- `POST /api/expenses/import`
- `GET /api/expenses/export`

Notes:

- selectors should use the same filtering model as `GET /api/expenses`
- preview mode may be implemented as a request flag on bulk endpoints

### 6. Add category reassign endpoint

Recommended endpoint:

- `POST /api/categories/reassign`

Body:

```json
{
  "fromCategoryId": "cat_1",
  "toCategoryId": "cat_2"
}
```

### 7. Extend user API

The CLI needs consistent support for:

- locale
- timezone
- base currency
- display name

The current settings logic should be consolidated so web and API use the same service layer.

## Service-layer refactor required

Today, expense and user/category logic is split between server actions, data access, and API handlers, with some duplication.

Before or alongside CLI work, extract shared app services for:

- categories create/update/delete/reassign
- user settings update
- onboarding completion
- bulk expense operations

This avoids implementing one set of rules for web and another for CLI.

## Data validation

Reuse Zod-based validation patterns already used in the app.

Additional validations needed:

- selector schema for batch operations
- bulk update schema
- import row schema
- CLI auth request schema
- CLI token revoke schema

## Release phases

### Phase 1

- CLI spec approved
- schema for CLI auth defined
- API auth abstraction added

### Phase 2

- browser-based CLI login working
- `auth login`, `auth logout`, `auth whoami`
- `setup`

### Phase 3

- `expense add|list|show|edit|delete`
- `category list|add|edit|delete`

### Phase 4

- batch edit/delete
- category reassign
- expense import/export

### Phase 5

- `dashboard`
- `analytics summary|categories|trend|currencies`
- `settings show|set`
- `telegram link|unlink`

### Phase 6

- polish help output
- docs
- automated tests
- packaging and release

## Open questions

- Do we want CLI tokens to expire automatically or remain long-lived until revoked?
- Should import support duplicate detection in v1 or wait for a later phase?
- Should category lookup by name be exact-match only in v1 to avoid ambiguity?
- Should `expense list` support sorting flags beyond default reverse chronological order in v1?
