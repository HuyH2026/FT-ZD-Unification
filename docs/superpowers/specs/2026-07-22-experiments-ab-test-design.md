# Experiments → A/B Test screen

**Date:** 2026-07-22
**Figma:** `LMPNsX1T3nwkueIRUCDktm` node `747:86296` ("06 Experiments expanded")

## Goal

Build the **A/B Test** screen for the Experiments section at `/experiments`, ported
faithfully from the Figma frame. Chrome (nav rail, header) already exists; this spec
covers only the content surface.

## Scope

- **A/B Test only.** The Experiments nav already declares a submenu
  (`A/B Test, Test Suite, Simulations`), but only A/B Test is designed. `/experiments`
  renders the A/B Test screen directly — a flat route, like Orchestrator. No nested
  tab routing this round; Test Suite & Simulations are deferred to a future spec.
- **Static rows.** Table rows are display-only (no detail view exists in the frame).
- **Presentational toolbar.** Search / date-range / filters / view-toggle / "Create
  new" are inert, matching the Orchestrator screen.
- **Mock data only.** No backend, consistent with the rest of the console.

## Pattern

Clone the **Orchestrator** screen structure (`src/features/orchestrator/`), the closest
analog: page title + four metric cards + presentational toolbar + card-row table.

## Routing

`src/routes.tsx`:
- Add `/experiments` to the `BUILT` set (removes it from the placeholder list).
- Add route `{ path: 'experiments', element: <ExperimentsScreen /> }` under `AppLayout`.

No `nav-config.ts` change — the Experiments entry and submenu already exist.

## Files (`src/features/experiments/`)

### `experiments-data.ts`
Types + mock data (values exact from the frame).

```ts
export type ABMetric = {
  key: string
  label: string
  value: string        // "5", "55,987", "41,312", "4.1"
  sub?: string         // secondary figure ("80%" on Resolutions)
  accent?: 'green'     // CSAT value rendered green (#2d7e55)
}

export type ExperimentStatus = 'not-started' | 'running' | 'completed' | 'canceled'

export type Experiment = {
  id: string
  name: string
  status: ExperimentStatus
  intent: string
  description: string
  splits: number[]     // e.g. [50, 50] or [33, 33, 33]
}
```

Metrics: Total Tests `5`, Total conversations `55,987`, Resolutions `41,312` + `80%`
sub, CSAT `4.1` (green accent).

Five experiments from the frame:
1. **Test** — Not started · Log in troubleshooting · "Explore which login experience leads to the highest conversion." · [50, 50]
2. **Abandoned Cart Recovery** — Running · Call users with abandoned carts · "Explore which outbound calls experience leads to the highest user satisfaction." · [33, 33, 33]
3. **Conversation recap strategy** — Completed · Update shipping address · "Explore which login experience leads to the highest CSAT rating." · [33, 33, 33]
4. **Self Service Checkout** — Completed · Update Billing address · "Test emails for the highest user satisfaction." · [50, 50]
5. **Guided Troubleshoot Flow** — Canceled · Replacement Card · "Explore which login experience leads to the best customer retention." · [50, 30, 20]

### `ExperimentsScreen.tsx`
Surface: `<h1>A/B test</h1>`, `<MetricStrip>`, toolbar, `<ExperimentTable>`.
`data-testid="screen-experiments"`. Same outer container classes as Orchestrator
(`h-full overflow-y-auto rounded-[26px] bg-white px-8 py-6`).

### `MetricStrip.tsx`
Four cards, reusing the Orchestrator card look (`flex-1 rounded-2xl border
border-surface-border bg-white px-5 py-4`, label + `Info` icon, large value). CSAT
value in green (`#2d7e55`); Resolutions shows `sub` beside the value.

### `ExperimentTable.tsx`
Column headers (Name · Status · Intent · Description · Traffic split) and one card row
per experiment (`rounded-2xl border border-surface-border bg-white`, grid columns).
Static — no click handler.

### `StatusBadge.tsx`
Rounded pill mapping status → color:
- Not started → grey `#9194a0`
- Running → green `#007f74`
- Completed → blue `#3489db`
- Canceled → red `#e53112`

White semibold text.

### `TrafficSplitBar.tsx`
Horizontal stacked bar with `%` labels beneath each segment. Segment palette (in order):
teal `#01567a`, orange `#e05c34`, blue `#2f69c7`. Widths from `splits`.

## Testing

`src/features/experiments/ExperimentsScreen.test.tsx` (Vitest + RTL, render at
`/experiments` via a memory/browser router matching existing screen tests):
- Renders the "A/B test" title.
- Shows all four metrics (labels + values).
- Shows all five experiment names.
- Shows the status badges (at least one of each label present).

Scope assertions with `within(getByTestId('screen-experiments'))`.

## Design tokens / colors

Prefer semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`)
as Orchestrator does. The status-badge and traffic-split brand colors have no token and
are inline hex (expected — matches per-channel/chart colors elsewhere in the codebase).

## Out of scope

- Test Suite and Simulations screens (future spec).
- Any real search / filter / date-range / create behavior.
- A per-experiment detail view.
