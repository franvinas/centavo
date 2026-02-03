# Centavo - API Design

## Approach

All API endpoints are Next.js Route Handlers under `/app/api/`. They return JSON. All endpoints (except auth) require authentication.

## Endpoints

### Expenses

#### `GET /api/expenses`

List expenses for the authenticated user.

Query parameters:

- `from` (date, optional) — start of date range
- `to` (date, optional) — end of date range
- `categoryId` (UUID, optional) — filter by category
- `search` (string, optional) — search description text
- `page` (int, default 1) — pagination
- `limit` (int, default 50, max 100) — items per page

Response: `{ expenses: Expense[], total: number, page: number, totalPages: number }`

#### `POST /api/expenses`

Create a new expense.

Body:

```json
{
  "amount": 12.5,
  "currency": "USD",
  "description": "Lunch",
  "categoryId": "uuid",
  "date": "2025-01-15",
  "notes": "optional"
}
```

The server calculates `baseAmount` and `exchangeRate`.

Response: `{ expense: Expense }`

#### `GET /api/expenses/:id`

Get a single expense.

Response: `{ expense: Expense }`

#### `PUT /api/expenses/:id`

Update an expense. Partial updates allowed.

Body: any subset of the POST fields.

Response: `{ expense: Expense }`

#### `DELETE /api/expenses/:id`

Delete an expense.

Response: `{ success: true }`

### Categories

#### `GET /api/categories`

List all categories for the user.

Response: `{ categories: Category[] }`

#### `POST /api/categories`

Create a category.

Body:

```json
{
  "name": "Groceries",
  "color": "#4CAF50",
  "icon": "shopping-cart"
}
```

Response: `{ category: Category }`

#### `PUT /api/categories/:id`

Update a category.

Response: `{ category: Category }`

#### `DELETE /api/categories/:id`

Delete a category. Fails if expenses reference it (400 error with message).

Response: `{ success: true }` or `{ error: "Category has N expenses. Reassign them first." }`

### User / Settings

#### `GET /api/user`

Get the authenticated user's profile.

Response: `{ user: User }`

#### `PUT /api/user`

Update profile (name, baseCurrency).

Body:

```json
{
  "name": "Fran",
  "baseCurrency": "EUR"
}
```

If `baseCurrency` changes, trigger a background recalculation of all `baseAmount` values.

Response: `{ user: User }`

### Exchange Rates

#### `GET /api/exchange-rate?from=USD&to=EUR`

Get the current exchange rate between two currencies. Used by the frontend when the user selects a non-base currency.

Response: `{ from: "USD", to: "EUR", rate: 0.92, timestamp: "..." }`

## Error format

All errors return:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

Standard HTTP status codes:

- 400: Bad request (validation error)
- 401: Not authenticated
- 403: Not authorized (accessing another user's data)
- 404: Not found
- 429: Rate limited
- 500: Server error

## Validation

- All inputs validated server-side using Zod schemas
- Amount must be > 0
- Currency must be a valid ISO 4217 code
- Date must be a valid date, not in the future (configurable)
- Description: 1-200 characters
- Category name: 1-50 characters
- Color: valid hex color
