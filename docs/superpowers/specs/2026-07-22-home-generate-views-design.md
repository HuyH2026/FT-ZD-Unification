# Home: switchable, role-tailored dashboard views

**Date:** 2026-07-22
**Status:** Approved (design)
**Area:** `src/features/home/`

## Problem

The Home dashboard's "Generate a Home" feature produces a single layout that
immediately replaces the current one. There is no way to keep more than one
dashboard, switch between them, or tailor what a generated dashboard *shows*
to the role that asked for it. Generation only reorders which widgets appear —
the metrics inside them are identical for every role.

We want:

1. **Saved, named, switchable views.** Each generated dashboard becomes a named
   view the user can rename, delete, and switch between from a switcher next to
   the greeting. The built-in "Default" view is always present.
2. **Role-tailored content.** Picking a role in the generate form changes both
   which widgets appear *and* the emphasis of the metrics inside them (recycling
   the existing mock numbers — no invented data).

Out of scope (explicitly deferred by the user): PM and Developer roles,
per-widget configuration, widget resizing, and any backend. This remains
frontend-only mock UI.

## Current state (what we're changing)

- `HomeScreen.tsx` holds one `layout: Layout` (persisted to
  `home-dashboard-layout-v2`) plus a transient `previewLayout: Layout | null`.
- Every widget renders from a single shared `DATA.platform` blob regardless of
  any role.
- `generate-layout.ts#generateLayout` scores and orders the 10 widgets into a
  `{ left, right }` layout. It does not touch widget internals.
- `GenerateHomePanel.tsx` collects role + focus areas + free text, calls
  `generateLayout`, and the result is applied as the single layout.

## Design

### 1. Views as first-class state

Introduce a views store replacing the single-layout model.

```ts
// dashboard-data.ts (or a new views module)
export type DashboardView = {
  id: string          // deterministic, minted from a module seq counter
  name: string        // "Default", "Ops lead" — user-renamable
  role: Role | null   // null = built-in Default; drives data tailoring
  layout: Layout      // { left, right }
  builtIn?: boolean   // Default view: renamable but NOT deletable
}

export type ViewsState = {
  views: DashboardView[]
  activeId: string
}
```

- **Persistence:** new localStorage key `home-dashboard-views-v1`. Access stays
  guarded (`window.localStorage?.`) exactly like today, degrading gracefully in
  jsdom.
- **Validation on load:** mirror the rigor of the existing `loadLayout` — for
  every view's `left`/`right`, require own-key membership in the widget registry
  (`WIDGET_IDS.has`, never the `in` operator), dedupe widget ids, and validate
  `role` against the known role set (unknown → treated as `null`). Any malformed
  blob falls back to the seeded default state. Guarantee `activeId` resolves to
  an existing view (else fall back to the Default/first view).
- **Seeding:** on first load (no stored state) create a single view:
  `{ id, name: 'Default', role: null, layout: DEFAULT_LAYOUT, builtIn: true }`,
  active.
- **No migration** from `home-dashboard-layout-v2`. It is mock foundation data;
  the old key is simply abandoned. (Noted so a reviewer doesn't expect a
  migration path.)
- **Deterministic ids:** a module-level `seq` counter (same pattern as
  `org-context.tsx#addOrg`) — never `Date.now()`/`Math.random()`, which are
  unavailable/nondeterministic in this environment.

### 2. Role tailoring — `role-data.ts`

New pure module. Single export:

```ts
export function deriveRoleData(base: LevelData, role: Role | null): LevelData
```

Behavior:

- `role === null` → returns `base` unchanged (Default view is the untouched
  platform data).
- Otherwise returns a `LevelData` with **the same numbers**, but:
  - **Health metrics reordered** by a per-role priority over the existing metric
    keys (`res`, `csat`, `esc`, `aht`). Priority lists per role:
    - `ops`: `['res', 'esc', 'aht', 'csat']` — throughput/resolution first
    - `quality`: `['esc', 'aht', 'csat', 'res']` — failure signals first
    - `knowledge`: `['res', 'csat', 'esc', 'aht']` — outcome first
    - `exec`: `['csat', 'res', 'esc', 'aht']` — satisfaction/outcome first
    Any metric key not in a role's list is appended in its original order, so the
    function is robust if metrics are added later. All four metrics are always
    preserved (reorder only, never drop).
  - **AI summary swapped** for a short, role-framed line (one per role, authored
    as mock copy). Falls back to `base.aiSummary` if a role has none.
- The function is pure and deterministic: same `(base, role)` → same output;
  it does not mutate `base` (returns a new object; metric array is a reordered
  copy).

Widgets are **not modified**. `HomeScreen` computes
`const data = deriveRoleData(DATA.platform, activeView.role)` and passes it down
exactly as today. Because tailoring is reorder+reframe over shared data, the
existing widget tests remain valid.

### 3. Generation flow

- `generateLayout` core is unchanged (its tests stay green).
- The generate panel now yields a *candidate view*: `{ role, layout }` plus a
  default name = the role's label (e.g. "Ops lead"). Preview still renders before
  commit, and preview must show the **role-tailored** data (preview applies
  `deriveRoleData` for the candidate role).
- **Apply** adds a new saved view (from the candidate) and makes it active,
  rather than overwriting the single layout. Regenerating before applying
  replaces the pending candidate (no duplicate views accumulate from repeated
  regenerate clicks).

### 4. View switcher UI

A `ViewSwitcher` component: a compact dropdown pill placed to the right of the
greeting line ("Good morning, Alex"). Click-driven with an outside-click scrim,
matching the existing `AddWidgetMenu` pattern (not hover-intent).

- Trigger: pill showing the active view name + chevron.
- Menu rows: each view with a check on the active one. Non-active rows expose
  inline **rename** (pencil → inline text field, commit on Enter/blur) and
  **delete** (trash). The built-in Default row hides delete (renamable, not
  deletable). Deleting the active view falls back to the Default view.
- Footer: "+ New from…" opens the existing `GenerateHomePanel`.
- The greeting text itself is unchanged; edit-mode ("Customize your dashboard")
  copy still applies to the active view's layout.

Guard rails:
- At least one view always exists (Default cannot be deleted).
- Rename to empty string is rejected (revert to prior name).

### 5. Editing & generation interplay

- **Customize (drag/reorder/add/remove)** edits the *active view's* layout and
  persists it into that view. Same DnD machinery as today.
- The transient `previewLayout` concept is preserved but now carries the
  candidate view's `role` too, so preview reflects tailored data.
- Customize stays hidden while a generate preview is active (unchanged rule).

## Files

- `src/features/home/dashboard-data.ts` — add `DashboardView`, `ViewsState`;
  keep `Layout`, `DEFAULT_LAYOUT`.
- `src/features/home/role-data.ts` — **new**: `deriveRoleData` + role priority
  and summary tables.
- `src/features/home/views-store.ts` — **new**: load/validate/seed/persist
  `ViewsState`, deterministic id minting, and pure reducers (add view, rename,
  delete, set active, update active layout). Keeping this out of the component
  keeps `HomeScreen` focused and the logic unit-testable.
- `src/features/home/ViewSwitcher.tsx` — **new**: the dropdown UI.
- `src/features/home/HomeScreen.tsx` — consume the views store; render
  `ViewSwitcher`; derive tailored data; wire generate→add-view.
- `src/features/home/GenerateHomePanel.tsx` — return candidate `{ role, layout }`
  / default name; otherwise minimal change.
- `generate-layout.ts` — unchanged (roles list already exposes the 4 roles).

## Testing

- `role-data.test.ts` (**new**): per-role reordering of metric keys; summary
  swap per role; `null` passthrough returns base identity-equivalent; all four
  metrics preserved (no drop); determinism; base not mutated.
- `views-store.test.ts` (**new**): seeds a Default view; validates/dedupes
  widget ids and rejects unknown roles on load; add/rename/delete/setActive
  reducers; Default not deletable; deleting active falls back; deterministic ids;
  graceful when localStorage absent.
- `HomeScreen.test.tsx` (**extend**): switch views via the switcher; rename
  persists; delete a view; Default has no delete; generating + Apply creates a
  new active view; preview shows tailored data; existing generate-panel tests
  updated to the new apply-as-view flow.
- `generate-layout.test.ts`: unchanged, stays green.

## Verification gates

`npx tsc --noEmit`, `npx vitest run`, `npx vite build`. (`pnpm lint` is a known
broken gate per CLAUDE.md — TS7 vs typescript-eslint.)

## Risks / notes

- Existing users' single stored layout in `home-dashboard-layout-v2` is dropped
  on first load of the new build (mock data — acceptable, and stated above).
- Tailoring is intentionally honest-for-a-mock: reorder + reframe over shared
  numbers, not fabricated per-role datasets. This keeps the data DRY and avoids
  inventing metrics with no backing.
