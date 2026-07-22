# CX Journey → Topics tab

**Date:** 2026-07-21
**Status:** Approved (design)
**Figma:** `CX Journey_01` — node `676-67822` in the `Unification` file (`LMPNsX1T3nwkueIRUCDktm`)

## Goal

Replace the "Coming soon" placeholder on the CX Journey **Topics** tab (`src/features/insights/cx-journey/CxJourneyView.tsx`) with the full Topics screen from Figma. Frontend-only, all data mocked — consistent with the rest of CX Journey.

## Non-goals

- No backend, no live filtering. Search, date range, audience dropdown, view toggles, and the top-movers carousel pager are **presentational** (static), matching how the sibling sections (`FilterRow`, `TrendsSection`) treat their filters.
- No new design tokens. Reuse the existing semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`, `bg-app-backdrop`, `bg-nav-active`) and the inline one-off hues already used across CX Journey (the `BLUE`/`TEAL`/`AMBER`/`RED`/`GREY` constants in `cx-journey-data.ts`) for chart/delta colors.
- The other CX Journey tabs (Overview, Automation) are unchanged.

## Architecture

Follows the established CX Journey pattern: one mock-data module + presentational components, styled with design tokens. New files under `src/features/insights/cx-journey/topics/`:

- `topics-data.ts` — all mocked data + exported types.
- `TopicsView.tsx` — the tab root; rendered from `CxJourneyView` when `tab === 'Topics'`.
- `TopMoversPanel.tsx` — the collapsible top-movers & recommendations panel (two inner cards).
- `TopicStatCards.tsx` — the 8-card metric grid.
- `TopicsTable.tsx` — the nested, expandable topics table and its toolbar row.

`CxJourneyView.tsx` change: replace the `tab === 'Topics'` "Coming soon" block with `<TopicsView />`.

## The screen — four zones (top to bottom)

Header line above the panel: **"All topics (Human only)"** (static label, `text-ink`).

### 1. Top movers & recommendations

A collapsible panel with a soft left-to-right gradient background (peach → lilac → mint, matching the Figma; expressed as an inline `linear-gradient` like the existing Knowledge-gaps hero in `HomeScreen.tsx`) and a rounded-2xl radius. Header: title **"Top movers & recommendations"** + a chevron collapse toggle (local state, default expanded). Holds two white rounded cards side by side:

- **Top movers by Discover categorized tickets** — a compact table with columns `Topic | # of tickets | Previous | Comparison`. Topic names render as blue links (`text` in accent blue, non-navigating). `Comparison` is a signed percentage colored green when negative (fewer tickets = good) / red when positive, matching the Figma sign→color mapping. A **"1 of 5"** carousel pager (`‹ 1 of 5 ›`) sits in the card header — **presentational**, buttons are inert.
  Rows (from Figma): Website Link Errors · 35 · (101) · −50.21%; Checkout Issues · 12 · (45) · −12.15%; Shipping Address Problems · 18 · (23) · +18.76%; Payment Processing Errors · 9 · (56) · −23.89%; Login Problems · 21 · (78) · +34.56%.
- **Topics that required the most coaching** — a dropdown header (label "Topics that required the most coaching", inert) over a horizontal bar chart. Each row: topic label + a teal bar sized to its volume + the numeric value at the bar end. Rows: Unable to log in · 102; Billing Discrepancies · 123; Cancel subscription · 82; Cancel subscription · 67; Unable to send email · 36. Bars scale to the max value.

### 2. Stat card grid

Eight cards, responsive `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`. Each card: rounded-2xl, `border-surface-border`, white, `p-4`; a `text-ink-muted` title with a small info `ⓘ` glyph, and a large (`text-[32px]`) value.

Cards (title → value): Categorized tickets → 23,877 · First contact resolution → 75% · Avg. first resolution time → 24 hrs · Avg. full resolution time → 29.9 hrs · Sentiment → 50% (with a green smiley chip, like `StatCards`) · CSAT → 4.2 (green value) · Agent reply time → 11.7 hrs · Agent replies → 1.15.

A lean local card component — **not** a reuse of `ai-performances/StatCards.tsx`, which is hard-wired to a 3-row channel breakdown this design doesn't have.

### 3. Toolbar row

A flex row above the table: a search input ("Search by topic"), a date-range pill ("May 2, 2025 – Jun 1, 2025"), a "Human only" audience pill, table/flow view-toggle icons, a right-aligned cluster of export/list/settings icons, and a checked **"Group topics"** checkbox. All presentational, styled with the existing `FilterRow` pill idiom (`border-surface-border`, `rounded-lg`). Lucide icons throughout (chrome convention).

### 4. Nested topics table

The centerpiece. A column-header row: `Topic (N) | Tickets | First contact resolution | Sentiment` (each header with a sort-caret glyph, static).

**Top-level rows** (each a rounded bordered row): a chevron expander, the topic name + count in parens, then Tickets (count + % of total), First contact resolution %, and Sentiment (score + emoji face colored by sentiment band), plus a trailing `⋮` menu glyph (inert).

Top-level rows (from Figma): Account Management (16) · 25,286 (40.89%) · 69.4% · 48.6; Verification and Security (16) · 14,286 (22.89%) · 87.3% · 54.7; **Payment Management (18)** · 8,879 (14.39%) · 71.5% · 75.1 (shown expanded in Figma); Profile Management (21) · 3,404 (5.5%) · 91.2% · 38.3; Contract and Job Management (14) · 2,920 (4.72%) · 73.4% · 90.4; Legal and Compliance (10) · 2,450 (3.96%) · 84.4% · 60.4; Support Services (15) · 1,188 (1.89%) · 55.4% · 44.8; Support Services (15) · 1,188 (1.89%) · 55.4% · 44.8.

**Expanding a top-level row** reveals a nested sub-table with a **different** column set: `Topic (N) | Tickets | % of tickets change | Full resolution time (hrs) | % of full resolution time (hrs) change`. Percentage-change cells are colored green/red by direction.

The nested sub-table has **one further level of nesting**: a sub-topic row (e.g. "Refund Requests and Inquiries (3)") can itself expand to leaf rows. Payment Management's expansion (from Figma):
- Refund Requests and Inquiries (3) · 2,000 (26.4%) · −6.7% (2,137) · 94.4 · −40% (56.8) — expands to: Refund Status Check · 700 (4.4%) · +3% (646) · 104.5 · +60% (56); Subscription Cancellation Refund · 700 (4.4%) · +12% (617) · 104.5 · −60% (145); Failed Transaction Refund · 600 (3.7%) · −20% (723) · 104.5 · −60% (145).
- Payment Method Issues (5) · 2,000 (50%) · −60.7% (937) · 94.4 · −40% (56.8) — collapsed.
- Withdrawal Issues (5) · 2,000 (50%) · −60.7% (937) · 94.4 · −40% (56.8) — collapsed.
- Withdrawal Issues (5) · 2,000 (50%) · −60.7% (937) · 94.4 · −40% (56.8) — collapsed.

## Interactivity (the only stateful behavior)

Two independent accordion mechanisms, all local `useState`:

1. **Top-movers panel** collapse/expand (default: expanded).
2. **Topics table** row expansion — a `Set` of expanded top-level topic ids, and a separate `Set` of expanded nested sub-topic ids. Multiple rows may be open at once (matching the Figma, which shows nested rows independently expanded/collapsed).

Everything else (search, date, dropdowns, pager, view toggles, sort carets, `⋮` menus) is inert/presentational.

## Data model (`topics-data.ts`)

Exported types and const arrays (illustrative names):

- `TopMoverRow = { topic: string; tickets: number; previous: number; comparisonPct: number }` → `TOP_MOVERS: TopMoverRow[]`.
- `CoachingBar = { topic: string; volume: number }` → `COACHING_BARS: CoachingBar[]`.
- `TopicStat = { title: string; value: string; sentiment?: boolean; valueColor?: string }` → `TOPIC_STATS: TopicStat[]`.
- Sentiment band helper for the emoji/color (reuse the green/amber/red thresholds already implied by the Figma faces).
- Nested topic tree:
  - `TopicLeaf = { id; name; tickets: number; ticketsPct: string; ticketsChangePct: number; ticketsChangeAbs: string; fullResTime: string; fullResChangePct: number; fullResChangeAbs: string }`
  - `TopicSub = TopicLeaf & { count: number; children: TopicLeaf[] }`
  - `TopicRow = { id; name; count: number; tickets: number; ticketsPct: string; firstContactResolution: string; sentiment: number; children: TopicSub[] }`
  - `TOPIC_ROWS: TopicRow[]`.

Reuse the existing color constants (`BLUE`, `TEAL`, `AMBER`, `RED`, `GREY`) exported from `cx-journey-data.ts` for bars and delta text rather than re-declaring them.

## Testing

- `topics/TopicsView.test.tsx` — renders within the CX Journey Topics tab; asserts the four zones are present; asserts that expanding a topic row (Payment Management) reveals its nested sub-rows, and collapsing hides them; asserts the top-movers panel collapses.
- `topics/topics-data.test.ts` — data-shape sanity (e.g. every top-level row's children ids are unique; percentages parse; counts match `children.length`).
- Update `CxJourneyView.test.tsx` if it asserts on the "Coming soon" Topics text.

Consistent with existing CX Journey test coverage (behavioral assertions scoped with `within`/`getByTestId`).

## Verification gates

`pnpm typecheck`, `pnpm test`, `pnpm build` (per CLAUDE.md — `pnpm lint` is a known-broken upstream gap and is not a gate).
