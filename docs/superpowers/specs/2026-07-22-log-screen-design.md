# Log screen design

**Date:** 2026-07-22
**Route:** `/log`
**Status:** Approved for planning

## Summary

Replace the `/log` "Coming soon" placeholder with a full **Log** screen: two tabs —
**Audit** (default) and **Error** — both fully populated with mock data. Every
control is presentational/inert (search, dropdowns, sort carets, buttons). No
backend. The screen follows the established `ToolsScreen` pattern: a white
rounded content card holding a title + tab strip, with each tab rendering its own
toolbar + bordered-grid table.

The reference screenshots are the Figma Make prototype's Audit and Error tabs. The
prototype renders its own top bar (Log title, help, avatar); in our app that chrome
is already provided by `TopBar`, so the in-screen content starts with the `<h1>Log</h1>`
title and tab strip — same as `ToolsScreen`.

## Routing

- New feature folder: `src/features/log/`.
- In `src/routes.tsx`:
  - Add `/log` to the `BUILT` set so it is no longer derived as a placeholder.
  - Add `{ path: 'log', element: <LogScreen /> }` as a child of the `AppLayout` route.
- No nested routes or params — tab switching is local `useState`, not URL-driven
  (mirrors `ToolsScreen`, which keeps its tab in local state).

## Data (`src/features/log/log-data.ts`)

Mock data + types, following the `tools-data.ts` convention.

```ts
export type LogTab = 'Audit' | 'Error'
export const LOG_TABS: LogTab[] = ['Audit', 'Error']

export type AuditEntry = {
  id: string
  timestamp: string   // pre-formatted display string, e.g. 'Jul 21, 2026, 1:39 PM'
  product: string     // e.g. 'Solve'
  action: string      // e.g. 'widget-configuration-updated'
  userEmail: string   // e.g. 'Forethought User'
}

export type Severity = 'High' | 'Medium' | 'Low'

export type ErrorEntry = {
  id: string
  timestamp: string
  product: string
  channel: string          // e.g. 'Widget'
  conversationId: string   // uuid-like string
  message: string          // e.g. 'Failed to decode JWT'
  severity: Severity
}

export const AUDIT_ENTRIES: AuditEntry[]  // ~12 rows
export const ERROR_ENTRIES: ErrorEntry[]  // ~8 rows
```

- Timestamps are hard-coded display strings (no `Date.now()`/`new Date()` — unavailable/nondeterministic here, consistent with the rest of the app).
- Audit actions drawn from the screenshot: `widget-configuration-updated`, `intent-deleted`, `workflow-draft-discarded`.
- Error rows drawn from the screenshot: messages like `Context Variable name not found in decoded JWT`, `Failed to decode JWT`; channel `Widget`; product `Solve`; severity `Medium` (include a couple of `High`/`Low` for variety in the mock).

## Components

### `LogScreen.tsx`
- White rounded content card: `h-full overflow-y-auto rounded-[26px] bg-white px-10 py-4` (same as `ToolsScreen`).
- Title row: `<h1 className="text-[22px] text-ink">Log</h1>` followed by the tab strip.
- Tab strip (**Audit / Error**) using the app's underline-active pattern:
  active = `border-b border-[#01567a] text-ink`, inactive = `text-grey-500`
  (same treatment as `ToolsScreen`'s tabs), `role="tablist"` / `role="tab"` / `aria-selected`.
- `data-testid="screen-log"`.
- Body switches on `tab`:
  - `Audit` → `<AuditView />`
  - `Error` → `<ErrorView />`

### Audit tab

**`AuditView.tsx`** (dedicated component, symmetric with `ErrorView.tsx`)
- Sub-header row: left = "See the history of changes made within this account."
  (muted, `text-grey-700`/`text-ink-muted`), right = "Updated hourly" (muted, small).
- `<AuditToolbar />`
- `<AuditTable />`

**`AuditToolbar.tsx`** — inert controls, styled like `ToolsToolbar`:
- Search input with magnifier, placeholder "Search by user email".
- "Last 30 days" pill dropdown with a calendar glyph + chevron.
- "Filter by" pill dropdown with filter glyph + chevron.
- Right-aligned: two icon buttons (columns glyph, list/rows glyph) — inert.

**`AuditTable.tsx`** — bordered grid, same construction as `ToolsTable`:
- Fixed `grid-cols-[...]` template shared by header + rows.
- Columns: **Timestamp** (active sort, down caret ↓), **Product**, **Action**, **User email**.
- Each header cell shows the up/down sort-caret glyph (`ArrowUpDown`); Timestamp
  shows the active single down caret. All inert.
- Rows are plain (not clickable — audit entries have no detail view in scope).
- `data-testid="audit-row-<id>"`.

### Error tab

**`ErrorView.tsx`**
- Sub-header row: left = "**Errors overview**" (ink, semibold) + " Last 24 hours"
  (muted); right = "Error logs are stored for 30 days." (muted).
- `<ErrorOverview />` — the 4 stat cards.
- `<ErrorToolbar />`
- `<ErrorTable />`

**`ErrorOverview.tsx`** — a row of 4 equal bordered cards
(`rounded-[16px] border border-surface-border`), each:
- Card 1: label "New errors" + info glyph; value `n/a` (large, muted grey).
- Cards 2–4: a severity badge (`High` red / `Medium` amber / `Low` blue) as the
  card label; value `n/a` (large, muted grey).
- Values are `n/a` per the screenshot — no fabricated metrics (consistent with the
  project's "do not fabricate metrics" convention).

**`ErrorToolbar.tsx`** — inert:
- Field-selector dropdown "Conversation ID ▾" adjoined to an "Enter keyword" search input.
- "Filter by" pill dropdown.
- "Show muted alerts" button with a bell-off glyph.
- Right-aligned: "Alert management" button (bell glyph, light-tinted) + columns/list icon buttons.

**`ErrorTable.tsx`** — bordered grid, same construction as `AuditTable`/`ToolsTable`:
- Columns: **Timestamp** (active ↓), **Product**, **Channel**, **Conversation Id**,
  **Error Message**, **Severity**.
- Severity rendered via a shared `SeverityBadge`.
- Wide content (conversation IDs) — allow horizontal scroll within the table
  container (`overflow-x-auto`); the grid template gives the Conversation Id column
  enough width.
- `data-testid="error-row-<id>"`.

### `SeverityBadge`
Small badge component (colocated in `ErrorTable.tsx` or `log-data`'s sibling), mapping severity → color:
- **High** → red fill, white text (inline hex, e.g. `#d64535` — no exact token; per CLAUDE.md one-off convention).
- **Medium** → amber fill (e.g. `#e8a33d`), dark/white text.
- **Low** → blue fill (e.g. the Flora `blue-700` token if it matches, else inline).
- Shape: `rounded-[6px] px-2 py-0.5 text-[11px] font-semibold` (match prototype's rounded-rect badges, not full pills).

## Styling & tokens
- Semantic token classes: `text-ink`, `text-ink-muted`, `text-grey-500`,
  `text-grey-700`, `border-surface-border`, `bg-white`.
- Header cells: `bg-[#fbfbfb]` header background + `border-surface-border`
  dividers, matching `ToolsTable`.
- Badge/severity tints and one-off surface tints inline per the one-off convention.
- No `font-['SF_Pro_*']` arbitrary font classes.

## Icons
- `lucide-react` throughout (chrome/dashboard convention): `Search`, `Calendar`,
  `ListFilter`, `ChevronDown`, `ArrowDown`, `ArrowUpDown`, `Info`, `Columns3`,
  `Menu`/rows glyph, `BellOff`, `Bell`.

## Testing (Vitest + RTL, colocated)
- `log.routes.test.tsx` — navigating to `/log` renders `screen-log`; active nav
  state resolves to the Log item (via `findNavItemByPath`).
- `LogScreen.test.tsx` — renders with Audit active by default; both tables' headers
  present after switching tabs; tab `aria-selected` toggles.
- `log-data.test.ts` — sanity: non-empty arrays, unique ids, severities within the
  allowed union.
- Assertions scoped with `within(getByTestId('screen-log'))` where page-wide text
  could collide.

## Out of scope
- No live search/filter/sort behavior (all inert).
- No audit-entry or error-entry detail views.
- No real counts in the Error overview cards (`n/a` only).
- No URL-driven tab state.
