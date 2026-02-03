# Centavo - MVP Features

## Core: Expense management

### Add expense

- Fields: amount, currency, description, category, date, notes (optional)
- Currency defaults to user's base currency but can be changed
- Date defaults to today
- If currency differs from base currency, auto-convert using current exchange rate
- Quick-entry form optimized for mobile (large tap targets, minimal fields visible)

### Edit expense

- All fields are editable
- If currency or amount changes, recalculate baseAmount

### Delete expense

- Soft confirmation ("Are you sure?")
- Hard delete (no trash/undo in MVP)

### List expenses

- Default view: reverse chronological (newest first)
- Group by date (today, yesterday, this week, earlier)
- Show: description, amount (in original currency), category color/name, date
- Filter by:
  - Date range (this month, last month, custom range)
  - Category
  - Currency
- Search by description text

## Categories

### View categories

- List all user categories with name, color, and expense count

### Add category

- Name + color picker
- Optional icon

### Edit category

- Change name, color, icon

### Delete category

- Only allowed if no expenses use this category, OR reassign expenses to "Other" first

## User settings

### Profile

- View/edit display name
- View email (not editable — tied to auth)

### Base currency

- Select from supported ISO 4217 currencies
- Changing base currency recalculates all existing `baseAmount` values

## Onboarding

On first sign-in, users who don't have a name set are redirected to `/onboarding`:

- Collect display name (required)
- Select base currency (grid of supported currencies, defaults to USD)
- On submit, sets name + baseCurrency and redirects to `/dashboard`

## Pages / Routes

| Route            | Description                                      |
| ---------------- | ------------------------------------------------ |
| `/`              | Landing / redirect to dashboard if logged in     |
| `/auth/signin`   | Sign-in page (Google + email OTP)                |
| `/onboarding`    | First-time setup (name + base currency)          |
| `/dashboard`     | Main view: expense list with filters and summary |
| `/expenses/new`  | Add new expense                                  |
| `/expenses/[id]` | View/edit expense                                |
| `/expenses`      | Full expense list with filters and pagination    |
| `/categories`    | Manage categories                                |
| `/settings`      | User profile and preferences                     |
