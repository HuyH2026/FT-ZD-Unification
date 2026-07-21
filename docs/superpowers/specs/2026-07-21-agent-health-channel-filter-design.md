# Agent-health channel filter — design

**Date:** 2026-07-21
**Scope:** Home dashboard, "Overall agent health" card (`AgentHealthCard`)

## Goal

Add a channel-breakdown filter to the Overall agent health card. The user ticks any
combination of the four channel families (Messaging, Email, Voice, Headless); the
**entire** card re-scopes to the selected channels — the big score, the health-state
pill, the trend sparkline, the four metric tiles, and the AI summary all recompute.

All four channels selected (the default) is the "everything" state and renders exactly
as the card does today — no regression.

This is a mock-data + presentational change only. No backend.

## Selection model

- Multi-select checkboxes: any subset of `{messaging, email, voice, headless}` can be on.
- Seeded to **all four on** (equivalent to today's unfiltered card).
- **Minimum one channel:** unchecking the last remaining channel is a no-op (the card
  never shows an empty/meaningless state).
- State is local `useState<Set<ChannelKey>>` inside `AgentHealthCard`. Not persisted —
  it is a transient view filter (like the existing per-tile hover popover), distinct
  from the persisted dashboard *layout*.

## Aggregation (honest, volume-weighted)

Weighting uses each channel's `share` (% of total volume). `share` is currently
duplicated identically across every metric's `byChannel` entries (58 / 24 / 14 / 4);
it is lifted to a single source of truth (see Data model).

When a subset S of channels is selected, weight `w_c = share_c / Σ(share over S)`.

- **Score:** `round(Σ w_c · score_c)` over per-channel scores.
- **Trend:** element-wise weighted average of per-channel trend arrays, rounded.
- **Metric tile value:** parse the numeric part of each channel's `value`, take the
  weighted average, re-format in the metric's own unit:
  - percent (`"82%"`) → number → `"NN%"`
  - score (`"4.6"`) → number → one decimal `"4.6"`
  - duration (`"1m 48s"`) → total seconds → weighted avg → `"Xm SSs"`
  The metric's unit is inferred from the string shape (`%` suffix, `m`/`s` present, else
  decimal). A metric's `byChannel` values are always the same unit, so per-metric
  inference is safe.
- **Metric delta:** weighted average of the per-channel numeric deltas, re-formatted with
  a leading `+`/`-`. **This is an approximation** (deltas are not strictly additive) and
  MUST be marked as such in a code comment. Accepted trade-off.
- **`up` / `good` per metric:** derived from the aggregated delta and the metric's
  polarity. Escalations and avg-handle-time are "good when down"; resolution and CSAT are
  "good when up". Polarity is captured per metric (see Data model) rather than re-derived
  from strings.

When **all four** channels are selected, the card uses the existing top-level `score`,
`trend`, and per-metric `value`/`delta`/`up`/`good` **verbatim** — the aggregation path is
bypassed so the default view is byte-for-byte today's card. (The all-selected weighted
result should closely match, but bypassing guarantees no drift.)

## Health state

The aggregated score maps back to a `HealthState` via thresholds so the pill label/colour
and the sparkline colour react:

- `score >= 90` → `good`
- `score >= 75` → `attention`
- else → `critical`

When all four are selected, use the existing `healthState` verbatim (same bypass rule).

## AI summary

Prose cannot be hand-authored for every subset. Two paths:

- **All four selected:** use the existing hand-written `aiSummary` verbatim.
- **Any subset:** a deterministic templater generates one line from the aggregated
  metrics — name the selected channels, call out the weakest metric (the one whose
  aggregated `good` is false, or nearest to its threshold), and note a steady metric.
  Example: _"Filtered to Voice, Email — escalations are the weak spot at 8.6%. Resolution
  is holding at 77%."_ No randomness (deterministic from the data).

## Data model (`src/features/home/dashboard-data.ts`)

Add per-channel health so the header can re-scope, and lift `share` to one place:

```ts
export type ChannelHealth = { score: number; trend: number[]; share: number }

// On LevelData:
channelHealth: Record<ChannelKey, ChannelHealth>
```

Add a polarity flag to `HealthMetric` so aggregation knows the "good" direction without
parsing labels:

```ts
// true when a rising value is good (resolution, CSAT); false when falling is good
// (escalations, avg handle time).
goodWhenUp: boolean
```

Populate `channelHealth` with plausible per-channel scores/trends whose volume-weighted
average lands at/near the existing top-level `score: 94` and `trend`. `share` values
(58 / 24 / 14 / 4) move here; the per-metric `byChannel[].share` fields may stay (still
used to weight metric values) or read from `channelHealth` — implementation detail for the
plan, but there must be exactly one authored source of the numbers.

## Rendering (`src/features/home/HomeScreen.tsx`, `AgentHealthCard`)

- **Filter row:** four pill toggles below the card title (or as the header `action` slot),
  each = channel icon (`CHANNEL_FAMILY_ICON`) + label + checkbox affordance. Checked =
  ink border + subtle fill; unchecked = muted/hollow. Reuses existing palette constants.
- **Scoped caption:** when fewer than four are selected, a small muted line near the score
  reads `Filtered · <selected labels>` so the scoped score isn't read as the platform
  figure. Hidden when all four are on.
- **Metric tiles:** show aggregated value/delta. The hover popover still lists all four
  channels, but **unselected channels are dimmed** so the breakdown stays honest about
  what's included.
- Score, `/100`, state pill, sparkline, AI summary all bind to the aggregated values.

## Aggregation helper (pure, testable)

Extract the math into a pure function (e.g. `computeHealthView(data, selected)` in a new
`src/features/home/health-aggregate.ts`) returning `{ score, healthState, trend, metrics,
aiSummary }` for the selected set. Keeps `AgentHealthCard` presentational and the math
unit-testable in isolation.

## Tests

**Unit (`health-aggregate.test.ts`):**
- weighted score for a known subset matches hand-computed value
- value parse/reformat round-trips for each unit (`%`, decimal, `Xm SSs`)
- all-four-selected path returns the verbatim top-level score/trend/metrics
- delta sign drives `good`/`up` per metric polarity

**Component (`HomeScreen.test.tsx`):**
- default: four toggles rendered and checked, score `94`, no "Filtered" caption
- unchecking down to a single channel shows that channel's raw numbers and the caption
- last-channel guard: attempting to uncheck the final channel leaves it checked

## Out of scope

- Persisting the filter across reloads.
- Applying channel filters to any other widget (approvals, QA, etc.).
- Real per-channel analytics / backend.
- Any change to the four channel *families* themselves (mirrors `channel-meta.ts`).
