# PM Dashboard View — Design

**Date:** 2026-07-22
**Status:** Approved (pending spec review)
**Figma reference:** `Hackathon-2026` file, node `200:5520` (`https://www.figma.com/design/UUy67blU4SHOkM8EIlclSa/Hackathon-2026?node-id=200-5520`)

## Goal

Add a **Product manager** role to the Home dashboard's Generate panel that produces a saved, switchable, renamable view rendering a **dedicated PM layout** — distinct from the existing support widget grid. The PM dashboard surfaces product-signal-from-support: revenue at risk (churn/retention), revenue asking (opportunity/growth), calculated priority (Impact score), and a Detected → Planned → In dev → Shipped lifecycle, with a mock "connect to Jira / any PM tool" flow.

## Context & constraints

- **Frontend-only.** No backend. All PM data is an in-memory deterministic mock (`pm-data.ts`), NOT derived from `DATA.platform`. Same convention as the rest of `src/features/home/`.
- **Determinism.** No `Date.now()` / `Math.random()` (unavailable/nondeterministic here). A module constant `PM_NOW` anchors all date math. Ids from a module `seq` counter, same pattern as `views-store.ts` / `org-context.tsx`.
- **TypeScript strict**, TS pinned to 5.9 (do not bump). No `baseUrl` in tsconfig.
- **Tests:** Vitest + RTL (jsdom). Prefer real-behavior assertions scoped with `within(getByTestId(...))`.
- **Tokens:** use existing semantic/Garden token classes or the inline one-off hues already used in `HomeScreen.tsx` (`INK`, `MUTED`, `BORDER`, `BLUE`, `GREEN`, `AMBER`, `RED`, `PURPLE`). Do NOT reintroduce `font-['...']` arbitrary font-family classes. The Figma's `IBM_Plex_Mono` / `Plus_Jakarta_Sans` families map to the app's existing font stack — match sizes/weights, not the font family.
- **Icons:** `lucide-react` (dashboard convention).

## How it integrates

PM enters through the **Generate panel** as a 5th role. Selecting role = Product manager and generating produces a `kind: 'pm'` view that is saved into the existing views system (switchable via `ViewSwitcher`, renamable, deletable). The four existing roles (ops/quality/knowledge/exec) continue to produce `kind: 'grid'` views that reorder the shared support widgets.

### Views become a discriminated union

`views-store.ts` `DashboardView` gains a `kind` discriminator:

- `kind: 'grid'` (default / existing): two-column support dashboard. Carries `layout: Layout` (`{ left: WidgetId[]; right: WidgetId[] }`) and `role: Role | null`. **Every currently-persisted view is this.** Backward compatible: a loaded view with no `kind` is treated as `'grid'`.
- `kind: 'pm'`: the PM dashboard. Carries `pmLayout: PmWidgetId[]` (an ordered list) and `role: 'pm'`.

Rationale for a single union over a separate route: the user chose "generate a PM view via the panel" and the "switch between views on Home" model, so PM must live in the same `ViewsState`/`ViewSwitcher`.

### Role type

`generate-layout.ts` `Role` extends to include `'pm'`, and `ROLES` gains `{ key: 'pm', label: 'Product manager' }`. `deriveRoleData` (support-grid role tailoring) is unaffected by `'pm'` because PM views never call it — but to keep it total, `METRIC_PRIORITY`/`ROLE_SUMMARY` are typed against the grid roles only (see Task 1).

## PM widgets (customizable, span-aware)

A PM view's body is an ordered `PmWidgetId[]` rendered into a span-aware CSS grid. Four widgets:

| PmWidgetId | Span | Content |
|---|---|---|
| `pm-kpis` | full | 5 stat cards: **Conversations synthesized**, **Spiking now**, **ARR at risk** (churn/retention), **ARR asking** (opportunity/growth), **Realized impact** (shipped). Each: label, big value, sub-caption, delta % with up/down arrow (green good / red bad). |
| `pm-spotlight` | half | Ranked list (numbered) with working **Trending / At risk / Asking** filter tabs. Each row: title, "N conversations · churn risk/opportunity $X", lifecycle badge (Detected/Planned/In dev/Shipped), trend % (colored). |
| `pm-lifecycle` | half | Four stacked funnel bars **Detected → Planned → In dev → Shipped**, each showing $ amount and rec. count, height proportional to amount. |
| `pm-feed` | full | Filter bar (search + date-range preset + "All filters" popover + list/grid toggle) over **opportunity/issue detail cards**. |

**Opportunity card** (in `pm-feed`): Impact donut score (0–100 = calculated priority), title + description + customer quote, REQUEST/BUG tag, lifecycle badge, revenue $ + "Asking/At risk" chip, volume 10-wk trend + %, customer count, plan badges (e.g. "Annual plan", "Pro • Enterprise"), first-seen date, and action buttons: **View in Jira / Add to Jira** (state-driven, see connect flow) + **Generate fix** (presentational no-op).

**Span-aware grid:** widgets render in order; `full` occupies the whole row, `half` occupies one of two columns. Two consecutive `half` widgets sit side-by-side; a `half` followed by a `full` leaves the half on its own row. Reordering in edit mode can therefore restack them — accepted (user confirmed half-widgets stay individually reorderable).

## Edit mode (customizable)

PM views reuse the existing edit-mode chrome (`editing` state, Drag handle, Remove ✕, Add widget menu, Reset, Done). New PM-specific reducers in `views-store.ts` operate on `pmLayout`:

- `movePmWidget(state, fromIndex, toIndex)` — reorder within the ordered array.
- `removePmWidget(state, id)` — drop a widget (by id; ids are unique within a PM view).
- `addPmWidget(state, id)` — append a not-currently-present widget.
- `resetPmLayout(state)` — restore `DEFAULT_PM_LAYOUT`.

DnD: a single `PmDraggableWidget` wrapper (mirrors `DraggableWidget`) using the same `react-dnd` `HTML5Backend` already mounted by `HomeScreen`'s `DndProvider`. Because the PM grid is a flat ordered list (not two columns), its drag item is `{ id, index }` and hover computes an insert index. `HomeScreen` picks the grid vs PM edit handlers based on `activeView.kind`.

## Data model (`pm-data.ts`, new)

```ts
export const PM_NOW = new Date('2026-06-15T00:00:00Z').getTime() // deterministic anchor

export type PmTrend = 'up' | 'down'
export type LifecycleStageKey = 'detected' | 'planned' | 'in-dev' | 'shipped'
export type SpotlightFilter = 'trending' | 'at-risk' | 'asking'
export type OppType = 'request' | 'bug'

export type PmKpi = {
  key: string; label: string; value: string; caption: string
  delta: string; deltaGood: boolean; up: boolean
}
export type SpotlightItem = {
  id: string; rank: number; title: string; meta: string
  stage: LifecycleStageKey; trendPct: string; trendGood: boolean; up: boolean
  filters: SpotlightFilter[] // which tabs this item appears under
}
export type LifecycleStage = {
  key: LifecycleStageKey; label: string; amount: string; amountValue: number; recCount: number
}
export type Opportunity = {
  id: string; type: OppType; title: string; description: string; quote: string
  impact: number            // 0-100 calculated priority (donut)
  revenue: string; revenueState: 'asking' | 'at-risk'
  volumeTrend: number[]; volumePct: string; volumeGood: boolean; volumeUp: boolean
  customers: number; plans: string[]; stage: LifecycleStageKey
  firstSeen: number         // epoch ms, compared against PM_NOW
  firstSeenLabel: string
}

export type PmData = {
  kpis: PmKpi[]
  spotlight: SpotlightItem[]
  lifecycle: LifecycleStage[]   // ordered detected→shipped
  opportunities: Opportunity[]
}
export const PM_DATA: PmData
```

Values transcribed from the Figma (e.g. ARR at risk $1.36M / +15% bad; ARR asking $912K / +12% good; lifecycle Detected $232K·26rec, Planned $1.08M·14rec, In dev $846K·7rec, Shipped $408K·3rec; opportunities "SAML SSO drops users…" impact 88, $610K asking, and "SCIM auto-provisioning…" impact 78, $455K at-risk).

## Interactivity (everything works)

- **Spotlight tabs** (`pm-spotlight`): local `useState<SpotlightFilter>` filters `spotlight` by `item.filters.includes(tab)`.
- **Feed search:** local text state filters `opportunities` by case-insensitive substring on title + description.
- **Date range:** a **preset dropdown** — "Last 30 days / 60 days / 90 days" — filtering opportunities by `firstSeen >= PM_NOW - days`. **Deviation from Figma** (which shows an explicit calendar range `May 15 – Jun 15`); a real calendar picker is out of scope. The dropdown's default label renders the current preset.
- **"All filters" popover:** working checkboxes for type (Request / Bug) and lifecycle stage; outside-click scrim (same pattern as `AddWidgetMenu`).
- **List/grid toggle:** switches `pm-feed` between stacked rows and a 2-up card grid.

All feed filters compose (search AND date AND type/stage).

## Mock PM-tool connect (`pm-integration.ts`, new; persisted)

- A **"Connect PM tool"** button (in `pm-feed` header). Clicking opens a mock picker: **Jira / Linear / Asana**.
- Selecting a tool sets `{ connected: true, tool }`, persisted to `home-pm-integration-v1` (same load/validate/persist/guard pattern as `views-store`: `window.localStorage?.`, try/catch, own-key validation of `tool` against an allowed set).
- Once connected, each opportunity card's action reads: not connected → **"Connect to add"** (opens picker); connected & not added → **"Add to {Tool}"**; added → **"Added ✓"**. "Added" state is in-memory per opportunity id (a `Set<string>`), not persisted (resets on reload — acceptable for a mock).
- **"View in Jira"** and **"Generate fix"** are styled buttons, presentational no-ops (matches the presentational-composer convention in `AiStudioPanel`).

`pm-integration.ts` exports: `type PmTool = 'jira' | 'linear' | 'asana'`, `type PmIntegration = { connected: boolean; tool: PmTool | null }`, `loadPmIntegration()`, `persistPmIntegration(s)`, and the tool display-name map.

## Files

- **Create** `src/features/home/pm-data.ts` — types + `PM_DATA` mock + `PM_NOW`.
- **Create** `src/features/home/pm-data.test.ts` — invariants (5 KPIs, lifecycle ordered/4 stages, spotlight filter membership non-empty per tab, opportunities well-formed).
- **Create** `src/features/home/pm-integration.ts` — connect store (load/validate/persist).
- **Create** `src/features/home/pm-integration.test.ts` — load/validate/persist (unknown tool → not connected, malformed → default).
- **Create** `src/features/home/PmDashboard.tsx` — the PM widgets + `PmDraggableWidget` + span-aware grid + widget registry `PM_WIDGETS`.
- **Create** `src/features/home/PmDashboard.test.tsx` — render, spotlight tab filter, feed search filter, date preset, all-filters popover, list/grid toggle, connect flow.
- **Modify** `src/features/home/generate-layout.ts` — add `'pm'` to `Role`, add ROLES entry, keep grid roles typed for `deriveRoleData`; add `DEFAULT_PM_LAYOUT` + `PmWidgetId` + `PM_WIDGET_ID_LIST`.
- **Modify** `src/features/home/views-store.ts` — `DashboardView`/`NewView` discriminated union on `kind`; `sanitizeView` handles both kinds (default missing `kind` → `'grid'`); PM reducers (`movePmWidget`, `removePmWidget`, `addPmWidget`, `resetPmLayout`); `addView` accepts a PM `NewView`.
- **Modify** `src/features/home/views-store.test.ts` — PM view round-trips, sanitizer drops invalid pm ids/dedupes, PM reducers, grid regression stays green.
- **Modify** `src/features/home/GenerateHomePanel.tsx` — PM role selectable; when role = pm, emit a `kind: 'pm'` `NewView` with `DEFAULT_PM_LAYOUT` (the focus-area/prompt scoring only applies to grid roles; PM ignores focuses).
- **Modify** `src/features/home/HomeScreen.tsx` — branch on `activeView.kind`: render `PmDashboard` for `'pm'` (with edit-mode props) or the existing two-column grid for `'grid'`. Route edit handlers per kind. Greeting/ViewSwitcher/Generate chrome unchanged.

## Where `PmWidgetId`, `DEFAULT_PM_LAYOUT` live

To avoid a circular import (`views-store` ↔ `PmDashboard`), the PM widget id union + default layout + id list live in `generate-layout.ts` alongside the existing `Role`/`Layout`-adjacent constants (which `views-store` already imports). `PmDashboard.tsx` imports them from there too.

```ts
export type PmWidgetId = 'pm-kpis' | 'pm-spotlight' | 'pm-lifecycle' | 'pm-feed'
export const PM_WIDGET_ID_LIST: PmWidgetId[] = ['pm-kpis', 'pm-spotlight', 'pm-lifecycle', 'pm-feed']
export const DEFAULT_PM_LAYOUT: PmWidgetId[] = ['pm-kpis', 'pm-spotlight', 'pm-lifecycle', 'pm-feed']
```

## Testing strategy

- Pure reducers/stores tested directly (no render): PM view round-trip through persist/load, sanitizer (invalid pm id dropped, dedupe, unknown role/kind → grid default, malformed → seed), `movePmWidget`/`removePmWidget`/`addPmWidget`/`resetPmLayout`, `pm-integration` load/validate.
- Component tests scoped with `within(getByTestId(...))`: generating with PM role creates a `kind:'pm'` view and switching renders `pm-kpis`; spotlight tab re-filters; feed search filters; date preset filters; connect picker flips the card action to "Added ✓"; removing a PM widget in edit mode drops it.
- Existing grid-view + nav + org tests must stay green (backward compat).

## Out of scope

- Real Jira/Linear/Asana API or OAuth (mock only).
- A real calendar date-range picker (preset dropdown instead).
- Persisting the per-opportunity "Added" set across reloads.
- PM as a separate nav route (it lives in the Home views switcher).
- Charts library work for the lifecycle funnel (plain proportional divs, like existing bars).
