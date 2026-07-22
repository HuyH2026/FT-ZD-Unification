# Agent Builder screen — design

**Date:** 2026-07-21
**Scope:** New feature screen at `/ai-agents` (replaces the current `PlaceholderScreen`),
built as presentational mock UI with light client state.
**Figma:** `LMPNsX1T3nwkueIRUCDktm` node `597-159511` ("AI agents_01").

## Goal

Build the **Agent Builder** screen — the landing view for the "AI Agents" nav item.
It shows, for a selected channel (Widget / Voice / Web Call / Headless), a five-metric
performance strip and a tabbed table of AI agents (All / Active / Active subagents) with
per-agent stats and an on/off toggle. Presentational + light client state only: no backend,
no persistence.

## Routing

- Replace the `/ai-agents` placeholder with `AgentBuilderScreen`.
- In `src/routes.tsx`: add `/ai-agents` to the `BUILT` set and add a child route
  `{ path: 'ai-agents', element: <AgentBuilderScreen /> }` inside the `AppLayout` children,
  alongside `organization`. This mirrors how Insights/Organization are the landing view
  for their nav item. No nested sub-routes (Configuration / QA stay placeholders derived
  from `NAV_ITEMS`).

## Layout (top to bottom)

Full-height white surface (`rounded-[26px] bg-white p-10`, `data-testid="screen-ai-agents"`),
matching `OrganizationScreen`'s surface pattern.

1. **Header row** — `Agent Builder` title (`text-[26px] leading-8 text-ink`) with a muted
   date-range caption to its right (`5/2/2026 - 6/1/2026`). On the right side of the row, a
   **channel switcher**: a segmented pill control with four options —
   `Widget · Voice · Web Call · Headless` — each with a leading lucide icon. The active
   channel (default `Widget`) shows a white raised pill; inactive are muted text.
2. **Metric strip** — five cards in a row. Each card: label + info dot (top-left), a colored
   **delta pill** (top-right, e.g. `0.3% ↘` / `4.2% ↗`), and a large value. See Data model.
3. **Agent tabs** — `All agents · Active agents · Active subagents`, an underline-style tab
   row with a trailing `+` affordance (inert). Active tab is inked with an underline; others
   muted. Tab labels are plain (no counts in the Figma frame — do NOT add counts).
4. **Toolbar** — left group: a Search input (magnifier + placeholder "Search"), a date-range
   button (`May 02, 2026 - Jun 01, 2026` with a chevron), and an `All filters` button.
   Right group: `Preview` (outline) and `New Agent` (solid dark) buttons. All inert.
5. **Agents table** — header row + agent rows. Columns, left to right:
   checkbox · **Agents** (name) · **Activate** (toggle + "On"/"Off" label) ·
   **Type** · **Conversations** · **Deflections** · **Deflection rate** · **Avg. CSAT** · **Tags**.

## Interaction model (client state, in `AgentBuilderScreen`)

- **Channel switcher** — `useState<ChannelKey>('widget')`. Switching swaps BOTH the metric
  strip values AND the agent row set (each channel has its own authored data).
- **Agent tabs** — `useState<AgentTab>('all')` where `AgentTab = 'all' | 'active' | 'subagents'`.
  Filters the current channel's rows:
  - `all` → every row for the channel.
  - `active` → rows currently toggled **On**.
  - `subagents` → rows with `isSubagent === true`.
- **Row on/off toggle** — the screen holds an override map `Record<string, boolean>` keyed by
  agent id (empty by default; a row's effective state is `overrides[id] ?? agent.on`).
  Toggling flips the override, which moves the row between the All and Active views live.
  Resets to authored defaults when the channel changes (override map is cleared on channel
  switch, so each channel starts from its authored toggles).
- **Inert affordances** — Search input (uncontrolled, no filtering), date-range button,
  `All filters`, `Preview`, `New Agent`, the tab-row `+`, row checkboxes, info dots. They are
  styled and focusable but perform no action. This matches the mock scope of CX Journey.

## Data model (`src/features/ai-agents/agent-builder-data.ts`)

Single source of truth; no runtime derivation of authored numbers.

```ts
export type ChannelKey = 'widget' | 'voice' | 'webcall' | 'headless'
export type Trend = 'up' | 'down'

// One metric card. `delta`/`trend` drive the pill (↗/↘ + green/red tint); `good`
// decides the tint independent of direction (a falling Fallback is good → green).
// `accent` renders the value itself in green (CSAT in the Figma frame).
export type Metric = {
  key: string
  label: string
  value: string      // formatted, e.g. "21,590", "$706.8K", "4.1"
  sub?: string       // secondary figure shown beside the value (Resolutions → "80%")
  delta: string      // e.g. "0.3%"
  trend: Trend       // 'up' → ↗, 'down' → ↘
  good: boolean      // true → green pill, false → red pill
  accent?: boolean   // true → value text rendered green
}

// One agent row. `deflectionRate` is authored as a displayed string (matching the
// Figma frame, which shows a headline rate independent of the raw counts) — not
// derived from deflections/conversations at runtime.
export type Agent = {
  id: string
  name: string
  on: boolean          // default toggle state for this channel
  isSubagent: boolean  // included in the "Active subagents" tab
  type: string         // "Knowledge Retrieval" | "Fallback" | "With intent"
  conversations: number
  deflections: number
  deflectionRate: string
  csat: number
  tags: string[]
}

export type Channel = {
  key: ChannelKey
  label: string        // "Widget" | "Voice" | "Web Call" | "Headless"
  metrics: Metric[]    // exactly 5, in order: chats, resolutions, fallback, csat, cost
  agents: Agent[]
}

export const CHANNELS: Channel[]
```

### Authored values

**Widget channel — must match the Figma frame exactly:**

Metrics (order fixed):
| key | label | value | sub | delta | trend | good | accent |
|-----|-------|-------|-----|-------|-------|------|--------|
| chats | Total Chats | `21,590` | — | `0.3%` | down | false | — |
| resolutions | Resolutions | `19,673` | `80%` | `4.2%` | up | true | — |
| fallback | Fallback | `486` | — | `1.8%` | down | true | — |
| csat | CSAT | `4.1` | — | `1.7%` | down | false | true |
| cost | Cost Savings | `$706.8K` | — | `3.4%` | up | true | — |

Agents (three rows, matching Figma):
| id | name | on | isSubagent | type | conversations | deflections | deflectionRate | csat | tags |
|----|------|----|-----------|------|---------------|-------------|----------------|------|------|
| w1 | Knowledge Retrieval | true | false | Knowledge Retrieval | 3000 | 2500 | 95% | 3 | ["member_center"] |
| w2 | Fallback | true | false | Fallback | 3000 | 2500 | 95% | 3 | ["member_center"] |
| w3 | Service cancellation | false | true | With intent | 3000 | 2500 | 95% | 3 | ["member_center"] |

(Figma shows the first two toggled On and "Service cancellation" Off; its type reads
"With intent". The `member_cente…` tag is truncated in Figma; author it as `member_center`.)

**Voice / Web Call / Headless channels — plausible authored mock** (distinct numbers so tab
switching visibly changes data). Author each with 5 metrics (same order/keys) and an agent
set sized: Voice = 2 agents, Web Call = 1 agent, Headless = 4 agents. Each channel must have
at least one On agent and at least one `isSubagent: true` agent so all three tabs are
non-empty. `deflectionRate` is authored as a displayed percentage string per row (like the
Figma frame — not derived from the raw counts). Exact numbers are the implementer's to author
within these constraints (the plan will fix them so tests can assert).

## Styling

- Reuse the existing inline palette convention from sibling feature files (CX Journey /
  HomeScreen re-declare `INK`, `MUTED`, `BORDER`, `BLUE`, `GREEN`, `AMBER`, `RED` locally).
  Re-declare the needed constants locally in this feature; do **not** add a shared palette
  module and do **not** introduce new hex beyond the green/red delta-pill tints (a light
  green and light red background — derive from `GREEN`/`RED` with low-alpha backgrounds).
- Delta pill: `trend==='up' ? '↗' : '↘'`; tint green when `good`, red otherwise. Use lucide
  `TrendingUp`/`TrendingDown` or `ArrowUpRight`/`ArrowDownRight` for the arrow (pick one and
  use consistently).
- Icons: lucide-react throughout (channel switcher, toolbar, tags). No custom SVGs.
- No `font-['SF_Pro_*']` arbitrary font classes. Use semantic token classes
  (`text-ink`, `text-ink-muted`, `border-surface-border`) where a token exists; inline hex
  only for the per-metric accent tints, matching how sibling features handle one-offs.
- Desktop-fluid: the surface fills available width (the screen sits inside `AppLayout`).
  The metric strip is a 5-column flex/grid that fills the row; the table is full-width.

## Accessibility

- **Channel switcher** — `role="tablist"` with four `role="tab"` buttons carrying
  `aria-selected`; the active one `aria-selected="true"`. Accessible name = channel label.
- **Agent tabs** — same `role="tab"`/`aria-selected` pattern; accessible names
  "All agents" / "Active agents" / "Active subagents".
- **Row toggle** — a `<button role="switch">` with `aria-checked` reflecting the effective
  on/off state and an accessible name including the agent name (e.g. via `aria-label`
  `"Activate Knowledge Retrieval"`).
- Info dots and inert buttons are real `<button>`s (focusable) but perform no action.

## Tests

Two files, matching the CX Journey split.

**`agent-builder-data.test.ts` (data invariants):**
- `CHANNELS` has 4 entries with keys `widget`, `voice`, `webcall`, `headless`.
- Every channel has exactly 5 metrics, in the fixed key order
  `['chats','resolutions','fallback','csat','cost']`.
- Agent counts per channel: widget 3, voice 2, webcall 1, headless 4.
- Every channel has ≥1 On agent and ≥1 subagent (so all tabs are non-empty).
- Every agent's `deflectionRate` matches `/^\d+%$/` (a displayed percentage string).

**`AgentBuilderScreen.test.tsx` (behavior), scoped to `screen-ai-agents`:**
- Renders the Widget channel by default: "Agent Builder" title, "Total Chats" with
  `21,590`, and the three Widget agent names.
- Switching to Voice changes the headline: clicking the `Voice` tab shows Voice's authored
  Total Chats value (≠ `21,590`) and Voice's agent rows.
- `Active agents` tab shows only On rows: on Widget, "Service cancellation" (Off) is absent
  while "Knowledge Retrieval" (On) is present.
- Toggling a row moves it: clicking Knowledge Retrieval's switch to Off, then viewing
  `Active agents`, drops it from the active list.
- `Active subagents` tab shows only `isSubagent` rows.

## Out of scope

- Real search / filtering / date-range behavior (inert affordances).
- `New Agent` / `Preview` / `+` actions and any create-agent flow.
- Persisting channel selection or toggle state across reloads.
- Nested AI-Agents sub-routes (Configuration, QA remain placeholders).
- Row selection (checkboxes are inert) and bulk actions.
- Real per-agent analytics or backend of any kind.
```
