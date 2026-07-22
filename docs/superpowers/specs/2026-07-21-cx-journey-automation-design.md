# CX Journey → Automation tab — Design

**Date:** 2026-07-21
**Figma:** node `676-64292` (CX Journey_01), file `LMPNsX1T3nwkueIRUCDktm`
**Status:** approved

## Context

`src/features/insights/cx-journey/CxJourneyView.tsx` renders the CX Journey
screen: a sticky frosted header with a decorative `Overview / Topics /
Automation` tab strip, followed by the Overview body (conversation flow, agents
breakdown, trends). The tab strip currently has no routing and no state — all
three tabs are inert text.

This work gives the **Automation** tab real content, matching the Figma design.
It stays consistent with the rest of the screen: a static, presentational mock
(no backend), numbers taken from the design where legible.

## Scope

- **Automation tab content** — the "Agent gaps" sub-view only.
- The Automation view has its own segmented control with three sub-tabs:
  **Agent gaps** (built), **Knowledge gaps**, **Realized impact**. Only Agent
  gaps is designed; the other two render a lightweight "Coming soon" empty
  region when selected.
- **Out of scope:** Topics tab content (stays a placeholder), working
  search/sort/filter, nested routing, any backend.

## Approach

### Tab strip → interactive (local state)

`CxJourneyView` gains local state:

```ts
type CxTab = 'Overview' | 'Topics' | 'Automation'
const [tab, setTab] = useState<CxTab>('Overview')
```

- The existing sticky header/tab strip becomes clickable (`onClick={() => setTab(t)}`).
  Active-tab styling (the `-mb-px border-b-2 border-ink` treatment) is driven by
  `tab === t` instead of the hardcoded `i === 0`.
- Body switches on `tab`:
  - `Overview` → existing `ConversationFlowSection` + `AgentsBreakdownTable` +
    `TrendsSection` (unchanged, including the granularity state).
  - `Automation` → new `<AutomationView />`.
  - `Topics` → a titled empty region (placeholder, no fabricated content).

No URL change; consistent with the in-view granularity toggle already in this
screen.

### New files

**`src/features/insights/cx-journey/automation-data.ts`** — types + mock data:

- `AUTOMATION_SUBTABS` — const list: `Agent gaps`, `Knowledge gaps`,
  `Realized impact` (label + lucide icon per chip).
- `AutomationStat` — `{ value: string; label: string }`. `AUTOMATION_STATS`:
  - `6,908` — Potential ticket coverage
  - `228,821 hrs` — Potential full resolution time decrease
  - `$229,860` — Potential savings
- `AutomationRow` — `{ topic: string; policy: string; coverage: string;
  savings: string; created: string }`. `AUTOMATION_ROWS` — the three rows from
  the design (Reactivate account, Account Lock Issues, Account Linking and
  Updating), with their policy text, ticket coverage/year, potential
  savings/year, and `Jan 4, 2024 9:25 AM` timestamps.

**`src/features/insights/cx-journey/AutomationView.tsx`** — composes:

1. **Header row** — "Automation" heading (left) + segmented control (right).
   The segmented control is a pill group backed by local
   `useState('Agent gaps')`; the selected chip gets the white raised
   treatment, the others are muted with their icon. Selecting a non-built chip
   swaps the body below the banner for a "Coming soon" empty region.
2. **Gradient stats banner** — a rounded card with a soft peach→blue horizontal
   gradient (`bg-gradient-to-r`), an intro line ("By automating these topics
   with agents, you could annually achieve:"), and the three `AUTOMATION_STATS`
   rendered as large values with a muted label + `lucide` `Info` icon.
3. **Toolbar** — a static search input (lucide `Search` icon + placeholder) on
   the left; three icon buttons (`Download`, `List`, `Table2`/table-options) on
   the right. Presentational only.
4. **Table** — a semantic `<table>`. Columns: *Topic for generated policy*
   (rendered as a bolt-icon chip reusing the existing pill idiom), *Autoflow
   policy* (text clamped to 3 lines via `line-clamp-3`), *Ticket coverage/year*,
   *Potential savings/year*, *Time created*. Rows from `AUTOMATION_ROWS`, with a
   bottom border between rows matching the design.

Only Agent gaps has table/banner content. When Knowledge gaps or Realized
impact is selected, the banner + toolbar + table are replaced by a centered
muted "Coming soon" region (the segmented control stays visible).

### Styling

- Reuse semantic token classes (`text-ink`, `text-ink-muted`,
  `border-surface-border`, `bg-app-backdrop`) per project convention.
- The gradient uses inline/arbitrary Tailwind color stops (per-design one-offs,
  as elsewhere in this screen); the info icons and toolbar icons use
  `lucide-react`, consistent with the rest of the app (nav rail excepted).
- No new fonts, no `font-['SF_Pro_*']` classes.

## Testing

- **`CxJourneyView.test.tsx`** (extend): clicking the "Automation" tab renders
  the Automation banner stats and table rows; clicking "Overview" restores the
  conversation-flow section (`view-cx-journey` scoped queries).
- **`AutomationView.test.tsx`** (new): renders the three headline stats and all
  mock rows under Agent gaps; selecting "Knowledge gaps" hides the table and
  shows the empty "Coming soon" region.

## Files touched

- `src/features/insights/cx-journey/CxJourneyView.tsx` (edit — interactive tabs)
- `src/features/insights/cx-journey/automation-data.ts` (new)
- `src/features/insights/cx-journey/AutomationView.tsx` (new)
- `src/features/insights/cx-journey/AutomationView.test.tsx` (new)
- `src/features/insights/cx-journey/CxJourneyView.test.tsx` (edit)
