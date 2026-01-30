# Centavo - UI Design

## Design philosophy

- **Minimal and clean**: no clutter, generous whitespace, focus on content
- **Mobile-first**: designed for phone screens first, scales up to desktop
- **Fast entry**: adding an expense should require as few taps as possible
- **Light and dark mode**: system preference with manual toggle

## Layout

### Mobile (< 768px)
- Bottom navigation bar with 3-4 tabs: Dashboard, Add (+), Categories, Settings
- The "Add" button is prominent (center, larger, accent color)
- Full-screen pages, no sidebars
- Pull-to-refresh on expense list

### Desktop (>= 768px)
- Left sidebar navigation
- Main content area
- No right sidebar (keep it simple)
- Max content width: ~800px centered

## Color palette

- **Neutral base**: slate/zinc grays for backgrounds and text
- **Accent**: a single primary color (TBD — something warm like amber or teal)
- **Category colors**: predefined palette of 12-16 distinct, accessible colors
- **Semantic**: green for income/positive, red for expense/negative (if needed later)
- Dark mode: inverted neutrals, same accent and category colors adjusted for dark backgrounds

## Typography

- System font stack (`font-sans` in Tailwind) for performance
- Clear hierarchy: page titles (xl/2xl), section headers (lg), body (base), secondary text (sm, muted)
- Monospace for amounts/numbers for easy scanning

## Components

### Expense card (list item)
```
[Category dot] Description            $12.50
               Category name     Jan 15, 2025
```
- Left: colored dot for category
- Middle: description (primary), category + date (secondary)
- Right: amount in original currency, bold

### Quick add form
- Amount input (large, auto-focused, numeric keyboard on mobile)
- Description input
- Category selector (grid of colored chips)
- Date picker (defaults to today)
- Currency selector (defaults to base, dropdown for others)
- Save button

### Dashboard summary
- Total spent this month (in base currency)
- Expense count
- Below: scrollable expense list with date grouping

## Animations

- Keep it subtle: fade-in for page transitions, slide-up for modals
- No heavy animations — prioritize speed

## Accessibility

- All interactive elements keyboard-navigable
- Proper ARIA labels on icons and buttons
- Color is never the only indicator (always paired with text/icon)
- Minimum contrast ratios per WCAG 2.1 AA
