# A/B Test row click-through — per-experiment detail data

**Date:** 2026-07-23
**Status:** Approved (design)
**Area:** `src/features/experiments/`

## Problem

The A/B Test table (`ExperimentTable.tsx`) lists 5 experiments but rows are
static ("no click-through"). The only detail screen, `ExperimentSetupScreen`
(`/experiments/new`), is hardcoded to a single "Login fix method comparison"
test — its Results tab reads one fixed dataset from `results-data.ts`. Clicking a
row does nothing, so there is no way to present a populated experiment.

## Goal

Clicking any table row opens a fully-populated Results presentation. Each of the
5 experiments has its own believable mock data (winner, traffic split, avg
delta, metric cards, time-series) so the demo reads well. The existing
create-new flow stays unchanged.

## Decisions (from brainstorming)

- **Depth:** Full Results view for *every* row, regardless of status.
- **Routing:** Reuse the existing `/experiments/new` screen; select the
  experiment via a query param rather than adding a new route.
- **Data flow:** Prop-drill each Results card (no context).
- **Landing tab:** Row click lands on the **Results** tab; the plain
  `/experiments/new` create flow still defaults to **Setup**.

## Architecture

### Routing / row click

- `ExperimentTable` rows become clickable (a `<button>`/role or an accessible
  clickable row) that calls `navigate('/experiments/new?id=' + e.id)`.
- `ExperimentSetupScreen` reads `useSearchParams()`:
  - `id` present → look up `EXPERIMENT_DETAILS[id]`; if found, use it and
    default the active tab to **Results**.
  - `id` absent or unknown → fall back to the existing default detail
    (login-fix dataset) and default tab **Setup**. Create-new is unchanged.

### Data model (`results-data.ts`)

Introduce a single bundle type and a keyed map:

```ts
export type ExperimentDetail = {
  id: string
  name: string
  description: string
  winnerLabel: string
  winnerVariants: WinnerVariant[]
  recommendation: ResultsRecommendation
  keyLearning: ResultsRecommendation
  trafficSplit: TrafficSplitSlice[]
  trafficSplitTotal: number
  avgDelta: AvgDeltaEntry[]
  metricCards: MetricCard[]
  resolutionsSeries: ResolutionsPoint[]
}

export const EXPERIMENT_DETAILS: Record<string, ExperimentDetail>
export const DEFAULT_EXPERIMENT_DETAIL: ExperimentDetail // = login-fix (current data)
```

The current top-level consts (`WINNER_VARIANTS`, `TRAFFIC_SPLIT`, `AVG_DELTA`,
`METRIC_CARDS`, `RESOLUTIONS_SERIES`, etc.) are reorganized into
`DEFAULT_EXPERIMENT_DETAIL` (the `e1` login-fix story) so nothing regresses. The
shared color/enum consts (`CONTROL_COLOR`, `POSITIVE_COLOR`, `BAR_COLORS`,
`RESOLUTIONS_TABS`, and the row-level `EXPERIMENTS`/`METRICS` in
`experiments-data.ts`) stay as-is.

### Data flow — cards become prop-driven

Today each Results card imports its consts directly. Change:

- `ResultsView` takes a `detail: ExperimentDetail` prop and passes each slice to
  the relevant card as props.
- `WinnerCard`, `RecommendationCard`, `TrafficSplitCard`, `AvgDeltaCard`,
  `ResolutionsTimeSeriesCard` take their data via props instead of importing it.
  `MetricBarCard` already takes a `card` prop — unchanged.
- Purely presentational; no behavior change beyond the data source.

### Mock data — 5 distinct stories

Keyed `e1`–`e5`, matching the row names/statuses in `EXPERIMENTS`:

| id | Name | Story |
|----|------|-------|
| e1 | Test | Login-fix dataset (current), 3-way even split, Variant B wins |
| e2 | Abandoned Cart Recovery | 3-way split, Variant A wins clearly |
| e3 | Conversation recap strategy | Close race, Control edges out |
| e4 | Self Service Checkout | 2-way split, Variant B wins on CSAT |
| e5 | Guided Troubleshoot Flow | 3-way split, mixed/negative deltas (canceled) |

Each story sets its own winner variants, traffic split (+ total), avg delta
signs/values, the 7 metric-card numbers, and a distinct resolutions time-series
shape. Values are internally consistent (traffic split counts sum to total;
winner matches the strongest deltas).

## Testing

- Row click navigates to `/experiments/new?id=<id>` (extend
  `ExperimentTable.test.tsx` / `experiments.routes.test.tsx`).
- `ExperimentSetupScreen` with `?id=e2` renders the Results tab and shows e2's
  data (e.g. its winner label); with no id renders Setup and the default detail.
- Existing results-card tests (if any) adjust to prop inputs.
- `pnpm typecheck` + `pnpm test` are the gates (lint is broken upstream per
  CLAUDE.md).

## Out of scope

- No status-specific Results variants (running/canceled render the same full
  Results per the decision above).
- No backend; all data remains in-memory mock.
- No new route path; query-param selection only.
