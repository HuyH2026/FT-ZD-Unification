# Orchestrator screen — design

**Date:** 2026-07-21
**Figma:** https://www.figma.com/design/LMPNsX1T3nwkueIRUCDktm/Unification?node-id=747-86430
**Status:** approved (brainstorming)

## Summary

Replace the shared "Coming soon" placeholder at `/orchestrator` with a real
`OrchestratorScreen`: a title, a 4-card metric strip, a toolbar (search /
date-range / filters / Simulations / New automation), and a table of automation
rows with a per-row On/Off toggle and a mini success-rate bar. All data is
mocked (no backend), consistent with the other feature screens in this repo.

## Scope & interactivity

- **Toggles are live.** Each row's On/Off switch flips local component state; the
  row updates (a row with no success rate shows `n/a` and reads as Off in the
  design — "Refund request").
- **Everything else is presentational.** Search box, date-range picker, "All
  filters", "Simulations", and "New automation" render to match Figma but do not
  respond to input — matching how Configuration and Agent Builder were built.

## Routing & placement

- Orchestrator is a top-level nav item (`/orchestrator`) with an empty submenu —
  a **flat screen** (no nested routes), like Home and Organization.
- Currently `/orchestrator` is produced by the derived `placeholderRoutes` in
  `src/routes.tsx`. Change:
  - Add `/orchestrator` to the `BUILT` set.
  - Add an explicit route: `{ path: 'orchestrator', element: <OrchestratorScreen /> }`.
- No change to `nav-config.ts` (Orchestrator already listed, empty submenu).

## File layout — `src/features/orchestrator/`

- `orchestrator-data.ts` — types + mock data (metrics, automation rows)
- `OrchestratorScreen.tsx` — surface: title, metric strip, toolbar, table
- `MetricStrip.tsx` — the 4 metric cards
- `AutomationTable.tsx` — the rows table (owns toggle state)
- `NodeChips.tsx` — the "Sentiment Detection +4" pill
- `SuccessBar.tsx` — mini green/red success-rate bar with `99%` / `1%` labels
- co-located tests: `orchestrator-data.test.ts`, `MetricStrip.test.tsx`,
  `AutomationTable.test.tsx`; routes assertion added to the existing routes test.

## Data model (`orchestrator-data.ts`)

All values illustrative, matching the Figma frame.

```ts
export type OrchMetric = {
  key: string
  label: string
  value: string          // "32,128", "98%", "20,109", "69%"
  sub?: string           // "80%" beside Conversations triggered
  delta?: string         // "10%" pill on Success rate
  trend?: 'up'           // ↗
  sentiment?: boolean    // Positive sentiment → green emoji before value
}

export type NodeKind = 'sentiment' | 'event' | 'csat'  // drives chip icon color

export type Automation = {
  id: string
  name: string
  updatedLabel: string   // "Last updated: Jan 4, 2024 9:25 AM by Brandon Mango"
  primaryNode: string    // "Sentiment Detection"
  primaryNodeKind: NodeKind
  extraNodes: number     // the "+4"
  description: string
  runs: number           // 200
  successRate: number | null  // 99 → bar; null → "n/a"
  on: boolean
}
```

**Metric cards (4):**
1. Total runs — `32,128`
2. Success rate — `98%`, delta `10%`, trend `up`
3. Conversations triggered — `20,109`, sub `80%`
4. Positive sentiment — `69%`, `sentiment: true` (green emoji)

**Automations (3, from Figma):**
1. Call users with issues — Sentiment Detection +4 — Runs 200 — 99% — On
2. Refund request — Event Fired +1 — Runs 200 — `n/a` — Off
3. Send discount code — CSAT Submission +2 — Runs 200 — 99% — On

## Styling

- Semantic tokens only: `text-ink`, `text-ink-muted`, `bg-app-backdrop`,
  `border-surface-border`; accent green from the existing accent token.
- lucide-react icons (search, calendar, chevrons, info); nav icons unchanged.
- Rounded-card look consistent with Configuration / Agent Builder.
- `SuccessBar`: two-segment horizontal bar (green success / red remainder) with
  end labels (`99%` left, `1%` right). Renders `n/a` (muted) when
  `successRate === null`.
- `NodeChips`: rounded pill with a small colored icon keyed off `primaryNodeKind`
  plus the node name and a `+N` suffix.

## Testing

- `orchestrator-data.ts` — shape test (4 metrics; 3 automations; one with
  `successRate: null`).
- `AutomationTable` — toggling a row's switch flips its On/Off state.
- `MetricStrip` — renders all 4 cards with their labels/values.
- Routes test — navigating to `/orchestrator` renders `data-testid="screen-orchestrator"`
  (not the placeholder).

## Out of scope

- No backend / persistence. Search, date-range, filters, Simulations, and
  New automation are inert. No pagination. No row detail / editing flow.
