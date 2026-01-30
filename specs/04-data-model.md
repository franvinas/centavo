# Centavo - Data Model

## Overview

The data model is intentionally simple for the MVP. All monetary values use `Decimal` to avoid floating-point issues.

## Entities

### User

| Field        | Type     | Notes                                             |
| ------------ | -------- | ------------------------------------------------- |
| id           | UUID     | Primary key                                       |
| email        | String   | Unique, used for account linking                  |
| name         | String?  | Optional display name (from Google or user input) |
| image        | String?  | Profile picture URL (from Google)                 |
| baseCurrency | String   | ISO 4217 code (e.g. "USD", "EUR"). Default: "USD" |
| createdAt    | DateTime | Account creation timestamp                        |
| updatedAt    | DateTime | Last update timestamp                             |

### Expense

| Field        | Type     | Notes                                              |
| ------------ | -------- | -------------------------------------------------- |
| id           | UUID     | Primary key                                        |
| userId       | UUID     | Foreign key to User                                |
| amount       | Decimal  | The expense amount in the original currency        |
| currency     | String   | ISO 4217 code of the expense (e.g. "JPY", "EUR")   |
| baseAmount   | Decimal  | Amount converted to the user's base currency       |
| exchangeRate | Decimal  | Rate used for conversion (1.0 if same currency)    |
| description  | String   | What the expense was for                           |
| categoryId   | UUID     | Foreign key to Category                            |
| date         | Date     | When the expense occurred (not when it was logged) |
| notes        | String?  | Optional additional notes                          |
| createdAt    | DateTime | When the record was created                        |
| updatedAt    | DateTime | Last update timestamp                              |

### Category

| Field     | Type     | Notes                                     |
| --------- | -------- | ----------------------------------------- |
| id        | UUID     | Primary key                               |
| userId    | UUID     | Foreign key to User                       |
| name      | String   | Category name (e.g. "Food", "Transport")  |
| color     | String   | Hex color for UI display (e.g. "#4CAF50") |
| icon      | String?  | Optional icon identifier                  |
| createdAt | DateTime | Creation timestamp                        |

**Constraints:**

- (userId, name) is unique — no duplicate category names per user

### Default categories

When a new user signs up, seed these categories:

- Food & Dining (#FF9800)
- Transport (#2196F3)
- Housing (#9C27B0)
- Utilities (#607D8B)
- Entertainment (#E91E63)
- Shopping (#4CAF50)
- Health (#F44336)
- Other (#795548)

## Relationships

```
User 1 --- * Expense
User 1 --- * Category
Category 1 --- * Expense
```

## Currency handling

- Each user has a **base currency** (set in profile, default "USD")
- Each expense stores:
  - `amount` + `currency`: the original amount in whatever currency was spent
  - `baseAmount` + `exchangeRate`: the converted value in the user's base currency
- Exchange rates are fetched at the time of expense creation
- If the expense currency equals the base currency, `exchangeRate = 1` and `baseAmount = amount`
- Exchange rate source: TBD (frankfurter.app is free, or exchangerate.host)

## Indexes

- `Expense(userId, date)` — for listing expenses by date range
- `Expense(userId, categoryId)` — for filtering by category
- `Category(userId)` — for listing user's categories
