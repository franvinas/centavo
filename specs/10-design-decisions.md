# Centavo - Design Decisions

Design decisions made during the Pencil prototyping phase that impact future implementation.

## 1. Color Palette (resolves "TBD" from 06-ui-design.md)

The accent color was undecided. We chose a **warm, nature-inspired palette** over cool tones:

| Token               | Value     | Usage                                                                  |
| ------------------- | --------- | ---------------------------------------------------------------------- |
| `--bg-primary`      | `#F5F4F1` | Warm cream page background                                             |
| `--bg-surface`      | `#FFFFFF` | Card surfaces                                                          |
| `--bg-muted`        | `#EDECEA` | Muted controls/backgrounds                                             |
| `--text-primary`    | `#1A1918` | Headlines, primary content                                             |
| `--text-secondary`  | `#6D6C6A` | Body text, descriptions                                                |
| `--text-tertiary`   | `#9C9B99` | Labels, placeholders                                                   |
| `--border-subtle`   | `#E5E4E1` | Card strokes, dividers                                                 |
| `--accent-primary`  | `#3D8A5A` | Primary accent (forest green) — active states, CTAs                    |
| `--accent-light`    | `#C8F0D8` | Light green for badges/progress backgrounds                            |
| `--accent-warm`     | `#D89575` | Secondary accent (terracotta) — schedule markers, secondary highlights |
| `--status-positive` | `#4D9B6A` | Positive trends, income                                                |
| `--status-negative` | `#D08068` | Negative trends, overspend                                             |
| `--status-warning`  | `#D4A64A` | Warning states                                                         |

**Rationale**: Green as primary accent reinforces the "money/finance" association. Warm cream background feels approachable and reduces eye strain vs. pure white. Terracotta as secondary accent provides contrast without clashing.

**Impact**: Tailwind config must define these custom colors. Dark mode will invert the neutrals while keeping accent hues, adjusting lightness for dark backgrounds.

## 2. Typography — Outfit over system fonts

We chose **Outfit** (Google Fonts, geometric sans-serif) instead of the system font stack.

- **Weight scale**: 400 (body), 500 (labels), 600 (headings), 700 (large metrics)
- **Size scale** (iOS-aligned): 32/26/22/18/15/14/13/12/11/10px

**Rationale**: Outfit's geometric shapes feel friendly and modern. It has excellent weight range and readability at small sizes on mobile.

**Impact**: Must load Outfit via Google Fonts or self-host. Add `fontFamily: { sans: ['Outfit', ...defaultTheme.fontFamily.sans] }` to Tailwind config. Consider `font-display: swap` for performance.

## 3. Corner radius — generous rounding

All UI elements use rounded corners:

| Element                          | Radius       |
| -------------------------------- | ------------ |
| Cards, containers                | 16px         |
| Inputs, buttons, search          | 12px         |
| Small badges/tags                | 4-6px        |
| Pills, avatars, circular buttons | 100px (full) |

**Rationale**: Rounded corners create a softer, more approachable feel that aligns with the warm palette.

**Impact**: Define `borderRadius` scale in Tailwind config. Use `rounded-xl` (16px) for cards, `rounded-lg` (12px) for inputs/buttons.

## 4. Shadow system — soft warm shadows

Cards and elevated elements use subtle warm-toned shadows:

```css
--shadow-card: 0 2px 12px #1a191808; /* 8% opacity */
--shadow-elevated: 0 2px 8px #1a191808;
--shadow-subtle: 0 1px 6px #1a191808;
```

**Rationale**: Low-opacity warm shadows create gentle depth without harsh edges. Cards "float" above the cream background.

**Impact**: Define custom `boxShadow` values in Tailwind config. These shadows use warm black (`#1A1918`) at 8% opacity, not pure black.

## 5. Mobile screen dimensions

- **Width**: 402px (iPhone 14/15 standard)
- **Min height**: 874px
- **Tab bar height**: 84px (includes 34px safe area)
- **Content padding**: 24px horizontal

**Impact**: Use these as reference breakpoints. Content area effective width = 402 - 48 = 354px.

## 6. Bottom navigation — 3 tabs + center FAB

Tabs: **Home** | **[+ Add FAB]** | **Settings**

- Active state: forest green icon + label (600 weight)
- Inactive state: gray icon + label (500 weight)
- Icon size: 22px (Lucide icons)
- Label size: 10px
- **Center FAB**: 60px green circle, white "+" icon (28px), elevated with green-tinted shadow (`#3D8A5A` at 25% and 19% opacity)
- Categories removed from bottom nav — accessible via "All categories" link on the dashboard

**Desktop**: No bottom nav. Instead, a **64px floating action button** (FAB) in the bottom-right corner (24px from edges) with a prominent green shadow. "Add Expense" removed from sidebar nav.

**Rationale**: The Add action is the single most important interaction in the app. A visually distinct FAB ensures it's always one tap/click away on both platforms. Reducing mobile nav to 3 items prevents crowding and gives the FAB breathing room.

**Impact**:

- Mobile nav component renders 3 items with a special center slot for the FAB
- Desktop FAB uses `position: fixed; bottom: 24px; right: 24px;` with `z-index` above content
- Categories page is accessed from dashboard links or can be added as a sub-route
- Both FABs open the Add Expense modal/screen

## 7. Expense card design

```
[Category dot] Description               $12.50
               Category · Jan 15          USD
```

- Category dot: 10px circle, filled with category color
- Amount: bold (700 weight), right-aligned
- Currency label: smaller, muted text below amount

**Impact**: Expense card is a core reusable component. Category colors from the predefined palette (12-16 colors) must contrast well against white card backgrounds.

## 8. Monthly summary — metric cards

Two side-by-side metric cards at the top of the dashboard:

1. **Total spent** — large bold number + trend indicator
2. **Expense count** — count + comparison to last month

**Rationale**: Quick glance at the most important numbers without scrolling.

**Impact**: These cards need to fetch aggregated data. Consider caching monthly totals.

## 9. Add Expense — full-screen modal pattern

The "Add Expense" screen is a **full-screen modal** (not a bottom sheet or inline form):

- **Header**: Close (X) button left, centered title, no right action
- **Amount hero**: Large centered amount (`$0.00` at 48px/700 weight) with a currency pill below (tappable to switch currency)
- **Form fields**: Description, date, and optional note as separate input rows with left-aligned icons
- **Category selector**: 4-column grid of icon+label chips (2 rows visible + "More" overflow)
  - Selected state: category-colored 2px border + colored icon/label
  - Unselected state: subtle gray 1px border + gray text
- **Save button**: Full-width, 56px tall, green accent, pinned at bottom with safe area padding

**Rationale**: Full-screen gives the amount input maximum prominence and avoids keyboard-overlap issues on mobile. The category grid (vs. dropdown) minimizes taps — most users will have ≤8 frequent categories.

**Impact**:

- The category grid needs a "More" action that opens an expanded view (modal or separate screen) for additional categories
- Amount input should trigger the numeric keyboard on mobile (`inputmode="decimal"`)
- Currency selector is a separate interaction — likely a bottom sheet with search
- The form does NOT have a bottom tab bar — it's a modal that overlays the main navigation

## 10. Category color palette

Predefined colors used for category identification across the app:

| Category      | Color          | Hex       |
| ------------- | -------------- | --------- |
| Food & Dining | Orange         | `#E67E22` |
| Transport     | Blue           | `#3498DB` |
| Groceries     | Green (accent) | `#3D8A5A` |
| Entertainment | Purple         | `#9B59B6` |
| Health        | Red            | `#E74C3C` |
| Housing       | Emerald        | `#2ECC71` |
| Shopping      | Teal           | `#1ABC9C` |

Additional colors for user-created categories: `#F39C12` (amber), `#34495E` (dark slate), `#E91E63` (pink), `#607D8B` (blue-gray), `#795548` (brown).

**Impact**: These 12 colors must be defined in the category model and available in the category creation UI. All colors pass WCAG AA contrast against white (`#FFFFFF`) card backgrounds for the 10px dot indicator.

## 11. Desktop layout — sidebar + main content

Desktop (≥768px) uses a **fixed sidebar + scrollable main content** pattern:

- **Sidebar**: 260px wide, white surface, right border, vertical layout
  - Top: Logo (green square with "C" + "Centavo" wordmark)
  - Middle: Nav items (Dashboard, Add Expense, Categories, All Expenses) — active state uses green filled background with white text/icon
  - Bottom: Settings link, divider, user avatar row (initial circle + name)
- **Main content**: Fills remaining width, 40px horizontal / 32px vertical padding
  - Top bar: Greeting + page title (left), search box + notification bell (right)
  - Metric cards: **3 cards** in a row (vs. 2 on mobile) — adds "Top category" card
  - Bottom split: Category breakdown (left) + recent expenses (right), side by side

**Rationale**: Sidebar navigation is standard for desktop dashboards. The extra horizontal space allows a third metric card and side-by-side panels that would stack vertically on mobile.

**Impact**:

- Navigation component must render as bottom tabs (<768px) or sidebar (≥768px) — use a shared nav config, different layout components
- Desktop adds "All Expenses" as a dedicated nav item (on mobile, accessed via "View all" links)
- Search is persistent on desktop (top bar) vs. hidden/toggle on mobile
- The sidebar width (260px) should be a CSS variable for potential future collapsible sidebar
- Desktop main content has no max-width constraint (fills available space), but cards use `fill_container` to distribute evenly
