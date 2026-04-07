# Centavo - Project Overview

## What is Centavo?

Centavo is a multi-user expense tracking web app. It helps authenticated users record, categorize, and review their own spending across multiple currencies.

## Platform

- **Web application** (primary) built as a Progressive Web App (PWA)
- Installable on mobile devices (iOS/Android) via the browser
- No native mobile app — the PWA provides an app-like experience on phones

## Target users

- Individual users with their own Centavo account
- Wants a fast, minimal interface to log expenses
- Needs multi-currency support
- Values simplicity over feature bloat

## Data management

- **Cloud-based**: all data stored server-side in PostgreSQL
- Requires authentication to access
- Each user's data is isolated from other users
- Accessible from any device via browser

## MVP scope

The first version focuses on **basic expense tracking**:

- Add, edit, delete expenses
- Categorize expenses
- Multi-currency support with a base currency
- Date, amount, category, notes per expense
- Simple list/filter view of expenses

## Future roadmap (post-MVP)

These are not part of the initial build:

- Monthly budgets per category with alerts
- Analytics: charts, spending trends, category breakdowns
- Recurring expenses (rent, subscriptions)
- CSV/PDF export
- Receipt photo upload
