# Top intents brand breakdown — design

**Date:** 2026-07-21
**Scope:** Home dashboard, "Top intents" widget (`IntentsCard` in `src/features/home/HomeScreen.tsx`)

## Goal

Let a user click any Top-intents row (Order status, Refund request, …) to expand an
inline breakdown of that intent's volume across three fixed customer tiers —
**VIP, Premium, Vendor**. Each tier row shows `share% · N tickets` with a proportional
bar. Clicking the open row (or another row) collapses it. This is a presentational +
mock-data change only. No backend, no aggregation math.

## Interaction model

- **Click to expand.** Each intent row is a full-width `<button>` carrying `aria-expanded`
  and `aria-controls` (pointing at its panel). A chevron rotates when open.
- **Accordion — one open at a time.** Local `useState<string | null>` holds the single
  expanded intent id. Opening a row closes any other; clicking the open row collapses it.
- Collapsed is the default (matches today's card exactly — no regression).

## Data model (`src/features/home/dashboard-data.ts`)

Fixed tier vocabulary, shared across every intent:

```ts
export type BrandKey = 'vip' | 'premium' | 'vendor'
export type IntentBrandDatum = { key: BrandKey; label: string; share: number; tickets: number }
```

Extend the existing intent shape with a total ticket count and the per-brand breakdown:

```ts
// on LevelData:
intents: { id: string; name: string; share: number; tickets: number; byBrand: IntentBrandDatum[] }[]
```

- `byBrand[].share` is the tier's **% within that intent** and the three shares sum to
  100. `tickets` is that tier's slice of the intent's `tickets` total.
- Values are authored per-intent (not derived) so tier mixes differ realistically — e.g.
  Order status skews toward Vendor; Refund request skews toward VIP. There is exactly one
  authored source of each number; the per-brand `tickets` are authored consistently with
  `share × intent.tickets` (rounded) — no runtime derivation.
- Tier order is fixed `['vip', 'premium', 'vendor']` in every `byBrand` array.

## Rendering (`IntentsCard`)

- The top-level row keeps its current look: intent name (left), `share%` (right), and the
  thin top-level bar below, colored by `INTENT_COLORS[idx % …]`. The row becomes a
  `<button type="button">` with a small chevron (right of the share, or before it) that
  rotates 180° / points down when expanded.
- **Expanded panel** (rendered only for the open intent, directly under its row): the three
  tier rows, each with:
  - a small colored dot or tier marker + tier label (VIP / Premium / Vendor),
  - `share% · N tickets` (e.g. `18% · 2,140 tickets`), tickets formatted with a thousands
    separator,
  - a thin proportional bar whose width = the tier's `share` (reads as "share of this
    intent"), reusing the existing bar track styling (`#efeeec` track, rounded, `h-1.5`).
- A small per-tier color map (VIP / Premium / Vendor) drives the dot + bar fill. Reuse
  existing palette constants (`BLUE`, `PURPLE`, `AMBER`, `GREEN`) rather than new hex.
- No change to card width or the widget's place in the layout; the panel expands in flow
  and pushes rows below it down.

## Accessibility

- Row `<button>`: `aria-expanded={open}`, `aria-controls="<panel id>"`, accessible name =
  the intent name. Chevron is decorative (`aria-hidden`).
- Panel: `id` matching `aria-controls`; `role="region"` with `aria-label="<intent> by brand"`.

## Tests (`src/features/home/HomeScreen.test.tsx`)

Scope assertions to the intents card (find the "Top intents" title, `.closest` the card).

- **Default collapsed:** no tier labels (VIP/Premium/Vendor) visible; every intent row
  button has `aria-expanded="false"`.
- **Expand:** clicking an intent row reveals its three tier labels and a known
  `share% · tickets` string for that intent; the clicked button flips to
  `aria-expanded="true"`.
- **Accordion:** with one row open, clicking a second row collapses the first (only one
  panel/`aria-expanded="true"` at a time).

## Out of scope

- Persisting the expanded state across reloads.
- Applying the brand dimension to any other widget.
- Real per-brand analytics / backend.
- Trends, resolution rates, or deltas per brand (share + volume only).
- Multi-open (multiple rows expanded simultaneously) — accordion only.
