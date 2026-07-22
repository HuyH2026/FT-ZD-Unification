# Home: switchable, role-tailored dashboard views — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Home dashboard's one-shot "Generate a Home" into saved, named, switchable views, where a chosen role tailors both which widgets appear and the emphasis of the metrics inside them.

**Architecture:** Views become first-class state persisted to a new localStorage key. A pure `deriveRoleData(base, role)` reorders health metrics + reframes the AI summary per role (same numbers, recycled from the single mock blob). A pure `views-store` module owns load/validate/seed/persist + reducers. A click-driven `ViewSwitcher` dropdown by the greeting handles select/rename/delete/new. `HomeScreen` wires it together; generation now adds a new active view.

**Tech Stack:** React 19, TypeScript (strict, pinned 5.9 — do NOT bump to TS7), Vite, Vitest + React Testing Library (jsdom), react-dnd, lucide-react. Tailwind v4.

## Global Constraints

- **TypeScript strict**; keep all new code fully typed. Do NOT add `baseUrl` to tsconfig.
- **No `Date.now()` / `Math.random()`** — unavailable/nondeterministic here. Mint ids from a module-level `seq` counter (pattern: `src/app/org-context.tsx:18,30`).
- **No backend.** All data is the existing mock `DATA.platform`. Tailoring recycles those numbers — never fabricate new per-role datasets.
- **Guard localStorage** with `window.localStorage?.` and wrap in try/catch (jsdom has no localStorage).
- **Path alias** `@` → `src/`. Home feature imports stay relative (`./…`), matching the existing files.
- **Verification gates:** `npx tsc --noEmit`, `npx vitest run`, `npx vite build`. `pnpm`/`pnpm lint` are unavailable/broken here — use `npx`. Do NOT rely on `pnpm lint`.
- **Roles are exactly** `ops | quality | knowledge | exec` (from `generate-layout.ts`). No PM/Developer.
- Use `npx vitest run <path>` to run a single test file.

---

### Task 1: `deriveRoleData` — role tailoring (pure)

**Files:**
- Create: `src/features/home/role-data.ts`
- Test: `src/features/home/role-data.test.ts`

**Interfaces:**
- Consumes: `LevelData` from `./dashboard-data`; `Role` from `./generate-layout`.
- Produces: `deriveRoleData(base: LevelData, role: Role | null): LevelData` — pure; `role === null` returns `base` unchanged (same reference); otherwise returns a new object with `metrics` reordered by a per-role key priority (unlisted keys appended in original order, all metrics preserved) and `aiSummary` swapped for a role-framed line. Never mutates `base`.

- [ ] **Step 1: Write the failing test**

Create `src/features/home/role-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { deriveRoleData } from './role-data'
import { DATA } from './dashboard-data'

const base = DATA.platform

describe('deriveRoleData', () => {
  it('returns the base object unchanged for the null (Default) role', () => {
    expect(deriveRoleData(base, null)).toBe(base)
  })

  it('orders health metrics per role (ops leads with resolution then escalations)', () => {
    const d = deriveRoleData(base, 'ops')
    expect(d.metrics.map((m) => m.key)).toEqual(['res', 'esc', 'aht', 'csat'])
  })

  it('orders health metrics per role (exec leads with CSAT)', () => {
    const d = deriveRoleData(base, 'exec')
    expect(d.metrics[0].key).toBe('csat')
  })

  it('preserves all metrics (reorder only, never drops)', () => {
    const d = deriveRoleData(base, 'quality')
    expect(new Set(d.metrics.map((m) => m.key))).toEqual(
      new Set(base.metrics.map((m) => m.key)),
    )
    expect(d.metrics.length).toBe(base.metrics.length)
  })

  it('swaps the AI summary per role', () => {
    expect(deriveRoleData(base, 'ops').aiSummary).not.toBe(base.aiSummary)
    expect(deriveRoleData(base, 'exec').aiSummary).not.toBe(
      deriveRoleData(base, 'ops').aiSummary,
    )
  })

  it('does not mutate the base data', () => {
    const before = base.metrics.map((m) => m.key)
    deriveRoleData(base, 'ops')
    expect(base.metrics.map((m) => m.key)).toEqual(before)
  })

  it('is deterministic — same input yields same output', () => {
    expect(deriveRoleData(base, 'knowledge')).toEqual(deriveRoleData(base, 'knowledge'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/home/role-data.test.ts`
Expected: FAIL — cannot resolve `./role-data`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/home/role-data.ts`:

```ts
// Deterministic, backend-free role tailoring. Given the shared platform mock and
// a role, returns a LevelData with the SAME numbers but the health metrics
// reordered and the AI summary reframed for that role. role === null (the
// built-in Default view) returns the base untouched. No LLM, no Date.now().
import type { LevelData } from './dashboard-data'
import type { Role } from './generate-layout'

// Per-role ordering of the health metric tiles, by metric key. Any metric key
// not listed is appended in its original order, so adding metrics later is safe.
const METRIC_PRIORITY: Record<Role, string[]> = {
  ops: ['res', 'esc', 'aht', 'csat'],
  quality: ['esc', 'aht', 'csat', 'res'],
  knowledge: ['res', 'csat', 'esc', 'aht'],
  exec: ['csat', 'res', 'esc', 'aht'],
}

// One-line, role-framed read on agent health (mock copy).
const ROLE_SUMMARY: Record<Role, string> = {
  ops: 'Resolution is up and escalations are down — throughput is healthy. Voice handle time is the one area worth a look.',
  quality: 'Failure signals are low: escalations down 1.2% and handle time trending down. Voice flows carry the most test failures.',
  knowledge: 'Outcomes are strong and CSAT is climbing. Refund-eligibility gaps are still driving avoidable misses.',
  exec: 'Customer satisfaction and resolution are both trending up, and spend is on track against budget — no action needed.',
}

function reorderByKey<T extends { key: string }>(items: T[], order: string[]): T[] {
  const rank = new Map(order.map((k, i) => [k, i]))
  const orig = new Map(items.map((it, i) => [it.key, i]))
  return [...items].sort((a, b) => {
    const ra = rank.has(a.key) ? rank.get(a.key)! : order.length + orig.get(a.key)!
    const rb = rank.has(b.key) ? rank.get(b.key)! : order.length + orig.get(b.key)!
    return ra - rb
  })
}

export function deriveRoleData(base: LevelData, role: Role | null): LevelData {
  if (role === null) return base
  return {
    ...base,
    metrics: reorderByKey(base.metrics, METRIC_PRIORITY[role]),
    aiSummary: ROLE_SUMMARY[role] ?? base.aiSummary,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/home/role-data.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/role-data.ts src/features/home/role-data.test.ts
git commit -m "feat(home): add deriveRoleData role tailoring"
```

---

### Task 2: `views-store` — views state, persistence, reducers (pure)

**Files:**
- Modify: `src/features/home/dashboard-data.ts` (add `WIDGET_ID_LIST` export)
- Create: `src/features/home/views-store.ts`
- Test: `src/features/home/views-store.test.ts`

**Interfaces:**
- Consumes: `Layout`, `WidgetId`, `DEFAULT_LAYOUT`, and new `WIDGET_ID_LIST` from `./dashboard-data`; `Role` from `./generate-layout`.
- Produces:
  - `type DashboardView = { id: string; name: string; role: Role | null; layout: Layout; builtIn?: boolean }`
  - `type ViewsState = { views: DashboardView[]; activeId: string }`
  - `type NewView = { name: string; role: Role | null; layout: Layout }`
  - `seedViewsState(): ViewsState`
  - `loadViewsState(): ViewsState`
  - `persistViewsState(state: ViewsState): void`
  - `getActiveView(state: ViewsState): DashboardView`
  - `addView(state, view: NewView): ViewsState` (mints id, appends, sets active)
  - `renameView(state, id, name): ViewsState` (empty/whitespace name → unchanged)
  - `deleteView(state, id): ViewsState` (built-in → unchanged; deleting active → falls back to built-in else first)
  - `setActiveView(state, id): ViewsState` (unknown id → unchanged)
  - `updateActiveLayout(state, layout): ViewsState`

- [ ] **Step 1: Add `WIDGET_ID_LIST` to `dashboard-data.ts`**

In `src/features/home/dashboard-data.ts`, immediately AFTER the `Layout`/`ColumnKey` type block (after the line `export type ColumnKey = keyof Layout`, currently line 115), add:

```ts

// Runtime list of every widget id (mirrors the WidgetId union). Used to validate
// persisted layouts/views. Keep in sync with WidgetId and the WIDGETS registry.
export const WIDGET_ID_LIST: WidgetId[] = [
  'health', 'qa', 'gaps', 'approvals', 'notifications',
  'cost', 'activity', 'intents', 'policies', 'knowledge',
]
```

- [ ] **Step 2: Write the failing test**

Create `src/features/home/views-store.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  seedViewsState, getActiveView, addView, renameView, deleteView,
  setActiveView, updateActiveLayout, type ViewsState,
} from './views-store'
import { DEFAULT_LAYOUT } from './dashboard-data'

const gen = { name: 'Ops lead', role: 'ops' as const, layout: { left: ['health'], right: ['approvals'] } }

describe('views-store', () => {
  it('seeds a single built-in Default view, active', () => {
    const s = seedViewsState()
    expect(s.views).toHaveLength(1)
    expect(s.views[0].name).toBe('Default')
    expect(s.views[0].role).toBeNull()
    expect(s.views[0].builtIn).toBe(true)
    expect(s.activeId).toBe(s.views[0].id)
    expect(s.views[0].layout).toEqual(DEFAULT_LAYOUT)
  })

  it('getActiveView returns the active view', () => {
    const s = seedViewsState()
    expect(getActiveView(s)).toBe(s.views[0])
  })

  it('addView appends a new view and makes it active with a unique id', () => {
    const s = addView(seedViewsState(), gen)
    expect(s.views).toHaveLength(2)
    expect(s.views[1].name).toBe('Ops lead')
    expect(s.views[1].role).toBe('ops')
    expect(s.activeId).toBe(s.views[1].id)
    expect(s.views[1].id).not.toBe(s.views[0].id)
  })

  it('renameView renames; rejects empty/whitespace names', () => {
    const s = addView(seedViewsState(), gen)
    const id = s.views[1].id
    expect(getActiveView(renameView(s, id, 'My Ops')).name).toBe('My Ops')
    expect(renameView(s, id, '   ')).toBe(s) // unchanged
  })

  it('deleteView removes a view; refuses to delete the built-in Default', () => {
    const s = addView(seedViewsState(), gen)
    const builtInId = s.views[0].id
    const genId = s.views[1].id
    expect(deleteView(s, builtInId)).toBe(s) // built-in protected
    const after = deleteView(s, genId)
    expect(after.views).toHaveLength(1)
    expect(after.views[0].id).toBe(builtInId)
  })

  it('deleting the active view falls back to the built-in view', () => {
    let s: ViewsState = addView(seedViewsState(), gen)
    const builtInId = s.views[0].id
    const genId = s.views[1].id // active
    s = deleteView(s, genId)
    expect(s.activeId).toBe(builtInId)
  })

  it('setActiveView switches active; ignores unknown ids', () => {
    const s = addView(seedViewsState(), gen)
    const builtInId = s.views[0].id
    expect(setActiveView(s, builtInId).activeId).toBe(builtInId)
    expect(setActiveView(s, 'nope')).toBe(s)
  })

  it('updateActiveLayout replaces only the active view layout', () => {
    const s = addView(seedViewsState(), gen)
    const next = updateActiveLayout(s, { left: ['cost'], right: [] })
    expect(getActiveView(next).layout).toEqual({ left: ['cost'], right: [] })
    expect(next.views[0].layout).toEqual(s.views[0].layout) // Default untouched
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/features/home/views-store.test.ts`
Expected: FAIL — cannot resolve `./views-store`.

- [ ] **Step 4: Write the implementation**

Create `src/features/home/views-store.ts`:

```ts
// Backend-free store for the Home dashboard's saved views. Owns load/validate/
// seed/persist plus pure reducers. Kept out of the component so the logic is
// unit-testable and HomeScreen stays focused. Ids are minted from a module seq
// counter (no Date.now()/Math.random(), which are unavailable here) — same
// pattern as src/app/org-context.tsx.
import { DEFAULT_LAYOUT, WIDGET_ID_LIST, type Layout, type WidgetId } from './dashboard-data'
import type { Role } from './generate-layout'

export type DashboardView = {
  id: string
  name: string
  role: Role | null
  layout: Layout
  builtIn?: boolean // the Default view: renamable but NOT deletable
}
export type ViewsState = { views: DashboardView[]; activeId: string }
export type NewView = { name: string; role: Role | null; layout: Layout }

const STORAGE_KEY = 'home-dashboard-views-v1'
const WIDGET_IDS = new Set<string>(WIDGET_ID_LIST)
const ROLE_KEYS = new Set<string>(['ops', 'quality', 'knowledge', 'exec'])

let seq = 0
function mintId(): string {
  return `view-${++seq}`
}

export function seedViewsState(): ViewsState {
  const id = mintId()
  return {
    views: [{ id, name: 'Default', role: null, layout: DEFAULT_LAYOUT, builtIn: true }],
    activeId: id,
  }
}

// --- Load / validate / persist ----------------------------------------------
// Own-key membership (WIDGET_IDS.has), never the `in` operator, so a crafted
// blob can't resolve inherited prototype keys to a non-widget and crash render.
function validLayoutArr(arr: unknown): arr is WidgetId[] {
  return Array.isArray(arr) && arr.every((x) => typeof x === 'string' && WIDGET_IDS.has(x))
}

function sanitizeLayout(layout: unknown): Layout | null {
  if (typeof layout !== 'object' || layout === null) return null
  const { left, right } = layout as { left?: unknown; right?: unknown }
  if (!validLayoutArr(left) || !validLayoutArr(right)) return null
  const seen = new Set<WidgetId>()
  const dedupe = (a: WidgetId[]) => a.filter((id) => !seen.has(id) && seen.add(id))
  return { left: dedupe(left), right: dedupe(right) }
}

function sanitizeView(v: unknown): DashboardView | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  const layout = sanitizeLayout(o.layout)
  if (!layout) return null
  const role =
    o.role === null || (typeof o.role === 'string' && ROLE_KEYS.has(o.role))
      ? (o.role as Role | null)
      : null
  return { id: o.id, name: o.name, role, layout, ...(o.builtIn === true ? { builtIn: true } : {}) }
}

export function loadViewsState(): ViewsState {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return seedViewsState()
    const parsed = JSON.parse(raw) as { views?: unknown; activeId?: unknown }
    if (!Array.isArray(parsed.views)) return seedViewsState()
    const views = parsed.views
      .map(sanitizeView)
      .filter((v): v is DashboardView => v !== null)
    if (views.length === 0) return seedViewsState()
    const activeId =
      typeof parsed.activeId === 'string' && views.some((v) => v.id === parsed.activeId)
        ? parsed.activeId
        : views[0].id
    return { views, activeId }
  } catch {
    return seedViewsState()
  }
}

export function persistViewsState(state: ViewsState): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

// --- Pure reducers -----------------------------------------------------------
export function getActiveView(state: ViewsState): DashboardView {
  return state.views.find((v) => v.id === state.activeId) ?? state.views[0]
}

export function addView(state: ViewsState, view: NewView): ViewsState {
  const id = mintId()
  return {
    views: [...state.views, { id, name: view.name, role: view.role, layout: view.layout }],
    activeId: id,
  }
}

export function renameView(state: ViewsState, id: string, name: string): ViewsState {
  const trimmed = name.trim()
  if (trimmed === '') return state
  return { ...state, views: state.views.map((v) => (v.id === id ? { ...v, name: trimmed } : v)) }
}

export function deleteView(state: ViewsState, id: string): ViewsState {
  const target = state.views.find((v) => v.id === id)
  if (!target || target.builtIn) return state
  const views = state.views.filter((v) => v.id !== id)
  if (views.length === 0) return state
  const activeId =
    state.activeId === id ? (views.find((v) => v.builtIn)?.id ?? views[0].id) : state.activeId
  return { views, activeId }
}

export function setActiveView(state: ViewsState, id: string): ViewsState {
  if (!state.views.some((v) => v.id === id)) return state
  return { ...state, activeId: id }
}

export function updateActiveLayout(state: ViewsState, layout: Layout): ViewsState {
  return {
    ...state,
    views: state.views.map((v) => (v.id === state.activeId ? { ...v, layout } : v)),
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/features/home/views-store.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/home/dashboard-data.ts src/features/home/views-store.ts src/features/home/views-store.test.ts
git commit -m "feat(home): add views-store (persisted named views + reducers)"
```

---

### Task 3: `ViewSwitcher` dropdown

**Files:**
- Create: `src/features/home/ViewSwitcher.tsx`
- Test: `src/features/home/ViewSwitcher.test.tsx`

**Interfaces:**
- Consumes: `DashboardView` from `./views-store`.
- Produces: `ViewSwitcher` component with props:
  ```ts
  {
    views: DashboardView[]
    activeId: string
    onSelect: (id: string) => void
    onRename: (id: string, name: string) => void
    onDelete: (id: string) => void
    onNew: () => void
  }
  ```
  Renders a click-driven dropdown (outside-click scrim, like `AddWidgetMenu`). Trigger shows the active view's name. Menu rows show a check on the active view; each row has an inline rename field (pencil → text input, commit on Enter/blur) and a delete button hidden when `view.builtIn`. Footer button "New from…" calls `onNew`. Root has `data-testid="view-switcher"`.

- [ ] **Step 1: Write the failing test**

Create `src/features/home/ViewSwitcher.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewSwitcher } from './ViewSwitcher'
import type { DashboardView } from './views-store'

const views: DashboardView[] = [
  { id: 'v1', name: 'Default', role: null, layout: { left: [], right: [] }, builtIn: true },
  { id: 'v2', name: 'Ops lead', role: 'ops', layout: { left: [], right: [] } },
]

function setup(overrides: Partial<React.ComponentProps<typeof ViewSwitcher>> = {}) {
  const props = {
    views, activeId: 'v1',
    onSelect: vi.fn(), onRename: vi.fn(), onDelete: vi.fn(), onNew: vi.fn(),
    ...overrides,
  }
  render(<ViewSwitcher {...props} />)
  return props
}

describe('ViewSwitcher', () => {
  it('shows the active view name on the trigger', () => {
    setup({ activeId: 'v2' })
    expect(screen.getByTestId('view-switcher')).toHaveTextContent('Ops lead')
  })

  it('opens the menu and selects a view', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /default/i }))
    await user.click(screen.getByRole('button', { name: /^Ops lead$/ }))
    expect(props.onSelect).toHaveBeenCalledWith('v2')
  })

  it('hides delete for the built-in view but shows it for others', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /default/i }))
    expect(screen.queryByRole('button', { name: /delete default/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete ops lead/i })).toBeInTheDocument()
  })

  it('renames a view (commit on Enter)', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /default/i }))
    await user.click(screen.getByRole('button', { name: /rename ops lead/i }))
    const field = screen.getByDisplayValue('Ops lead')
    await user.clear(field)
    await user.type(field, 'My Ops{Enter}')
    expect(props.onRename).toHaveBeenCalledWith('v2', 'My Ops')
  })

  it('fires onNew from the footer', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /default/i }))
    await user.click(screen.getByRole('button', { name: /new from/i }))
    expect(props.onNew).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/home/ViewSwitcher.test.tsx`
Expected: FAIL — cannot resolve `./ViewSwitcher`.

- [ ] **Step 3: Write the implementation**

Create `src/features/home/ViewSwitcher.tsx`:

```tsx
import { useState } from 'react'
import { Check, ChevronDown, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { DashboardView } from './views-store'

// Local palette to match the HomeScreen widget cards.
const INK = '#2f3130'
const MUTED = '#8b8e89'
const BORDER = '#e2e0dd'
const PURPLE = '#724be8'

export function ViewSwitcher({
  views, activeId, onSelect, onRename, onDelete, onNew,
}: {
  views: DashboardView[]
  activeId: string
  onSelect: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const active = views.find((v) => v.id === activeId) ?? views[0]

  const startRename = (v: DashboardView) => {
    setEditingId(v.id)
    setDraft(v.name)
  }
  const commitRename = () => {
    if (editingId) onRename(editingId, draft)
    setEditingId(null)
  }

  return (
    <div className="relative" data-testid="view-switcher">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-full border border-solid bg-white px-3 outline-none"
        style={{ borderColor: BORDER }}
      >
        <span className="text-[13px] font-semibold" style={{ color: INK }}>{active?.name}</span>
        <ChevronDown size={14} color={MUTED} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => { setOpen(false); setEditingId(null) }} />
          <div
            className="absolute left-0 top-[38px] z-[61] w-64 rounded-xl border border-solid bg-white py-1.5 shadow-[0px_16px_24px_0px_rgba(10,13,14,0.16)]"
            style={{ borderColor: BORDER }}
          >
            {views.map((v) => {
              const isActive = v.id === activeId
              if (editingId === v.id) {
                return (
                  <div key={v.id} className="px-2 py-1.5">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={commitRename}
                      aria-label={`Rename ${v.name}`}
                      className="w-full rounded-md border px-2 py-1 text-[13px] outline-none"
                      style={{ borderColor: PURPLE, color: INK }}
                    />
                  </div>
                )
              }
              return (
                <div key={v.id} className="group flex items-center gap-1 pr-2 hover:bg-[#f5f5f4]">
                  <button
                    onClick={() => { onSelect(v.id); setOpen(false) }}
                    className="flex flex-1 items-center gap-2 px-3 py-2 text-left outline-none"
                  >
                    <Check size={14} color={isActive ? INK : 'transparent'} />
                    <span className="text-[13px] font-normal" style={{ color: INK }}>{v.name}</span>
                  </button>
                  <button
                    onClick={() => startRename(v)}
                    aria-label={`Rename ${v.name}`}
                    className="flex size-6 items-center justify-center rounded outline-none hover:bg-[#ecebe9]"
                  >
                    <Pencil size={13} color={MUTED} />
                  </button>
                  {!v.builtIn && (
                    <button
                      onClick={() => onDelete(v.id)}
                      aria-label={`Delete ${v.name}`}
                      className="flex size-6 items-center justify-center rounded outline-none hover:bg-[#ecebe9]"
                    >
                      <Trash2 size={13} color={MUTED} />
                    </button>
                  )}
                </div>
              )
            })}
            <div className="my-1 border-t" style={{ borderColor: BORDER }} />
            <button
              onClick={() => { onNew(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left outline-none hover:bg-[#f5f5f4]"
            >
              <span className="flex size-4 items-center justify-center">
                <Plus size={14} color={PURPLE} />
              </span>
              <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: PURPLE }}>
                <Sparkles size={12} color={PURPLE} /> New from…
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/home/ViewSwitcher.test.tsx`
Expected: PASS (5 tests).

Note: the rename test types then presses Enter; `onBlur` also commits — `onRename` may be called more than once but always with the final value, and the test uses `toHaveBeenCalledWith` (not `toHaveBeenCalledTimes`), so it passes.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/ViewSwitcher.tsx src/features/home/ViewSwitcher.test.tsx
git commit -m "feat(home): add ViewSwitcher dropdown"
```

---

### Task 4: Wire views + tailoring into HomeScreen; generate adds a view

**Files:**
- Modify: `src/features/home/GenerateHomePanel.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/features/home/HomeScreen.test.tsx` (extend)

**Interfaces:**
- Consumes: everything from Tasks 1–3 (`deriveRoleData`, all `views-store` exports, `ViewSwitcher`).
- Produces: `GenerateHomePanel`'s `onGenerate` now takes a `NewView` (`{ name, role, layout }`) instead of a bare `Layout`. `HomeScreen` renders the switcher, derives tailored data, and turns generate→Apply into `addView`.

- [ ] **Step 1: Write the failing tests (extend HomeScreen.test.tsx)**

Add these tests inside `src/features/home/HomeScreen.test.tsx`. Put them in a new `describe` block at the end of the file (before the final closing lines). They assume the existing test imports (`render`, `screen`, `within`, `userEvent`) — reuse whatever the file already imports; if `within` is not imported, add it to the existing `@testing-library/react` import.

```tsx
describe('HomeScreen — dashboard views', () => {
  it('shows the view switcher with the Default view', () => {
    render(<HomeScreen />)
    const switcher = screen.getByTestId('view-switcher')
    expect(switcher).toHaveTextContent('Default')
  })

  it('generating and applying creates a new active view named for the role', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /ops lead/i }))
    await user.click(within(panel).getByRole('button', { name: /resolution & health/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    // The new view is active and appears in the switcher.
    expect(screen.getByTestId('view-switcher')).toHaveTextContent('Ops lead')
  })

  it('switches back to the Default view from the switcher', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    // Create + apply an Ops view first.
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /ops lead/i }))
    await user.click(within(panel).getByRole('button', { name: /resolution & health/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    // Open switcher and pick Default.
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /ops lead/i }))
    await user.click(screen.getByRole('button', { name: /^Default$/ }))
    expect(screen.getByTestId('view-switcher')).toHaveTextContent('Default')
  })

  it('the built-in Default view has no delete control', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /default/i }))
    expect(screen.queryByRole('button', { name: /delete default/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/home/HomeScreen.test.tsx`
Expected: FAIL — no `view-switcher` testid yet.

- [ ] **Step 3: Update `GenerateHomePanel.tsx` to emit a `NewView`**

In `src/features/home/GenerateHomePanel.tsx`:

Change the import block at the top (currently lines 3-6) to also pull `NewView`:

```tsx
import type { Layout } from './dashboard-data'
import type { NewView } from './views-store'
import {
  generateLayout, ROLES, FOCUS_AREAS, type Role, type FocusArea,
} from './generate-layout'
```

Change the `onGenerate` prop type (currently `onGenerate: (layout: Layout) => void`) to:

```tsx
  onGenerate: (view: NewView) => void
```

The `Layout` import is now unused in this file — remove the `import type { Layout } ...` line if TypeScript/`tsc` flags it as unused (it will under strict settings only via lint, not tsc; safe to remove regardless).

Replace `handleGenerate` (currently lines 33-36):

```tsx
  const handleGenerate = () => {
    if (!role || focuses.length === 0) return
    const label = ROLES.find((r) => r.key === role)?.label ?? 'Generated'
    onGenerate({ name: label, role, layout: generateLayout({ role, focuses, prompt }) })
  }
```

- [ ] **Step 4: Update `HomeScreen.tsx` — imports**

In `src/features/home/HomeScreen.tsx`, replace the dashboard-data import block (currently lines 11-15):

```tsx
import {
  type LevelData, type HealthState, type HealthMetric, type ChannelKey, type BrandKey,
  type WidgetId, type ColumnKey, type Layout,
  DATA, DEFAULT_LAYOUT,
} from './dashboard-data'
import { computeHealthView, CHANNEL_ORDER, CHANNEL_LABEL } from './health-aggregate'
import { GenerateHomePanel } from './GenerateHomePanel'
```

with:

```tsx
import {
  type LevelData, type HealthState, type HealthMetric, type ChannelKey, type BrandKey,
  type WidgetId, type ColumnKey, type Layout,
  DATA, DEFAULT_LAYOUT,
} from './dashboard-data'
import { computeHealthView, CHANNEL_ORDER, CHANNEL_LABEL } from './health-aggregate'
import { GenerateHomePanel } from './GenerateHomePanel'
import { deriveRoleData } from './role-data'
import { ViewSwitcher } from './ViewSwitcher'
import {
  type ViewsState, type NewView,
  loadViewsState, persistViewsState, getActiveView,
  addView, renameView, deleteView, setActiveView, updateActiveLayout,
} from './views-store'
```

- [ ] **Step 5: Remove the old single-layout persistence helpers**

In `HomeScreen.tsx`, DELETE the following now-unused block (currently lines 770-794): the `STORAGE_KEY` const, the `WIDGET_IDS` const, and the entire `loadLayout()` function. (They are replaced by `views-store`.) Leave `WIDGETS` and everything else in that region intact.

- [ ] **Step 6: Replace the `HomeScreen` root component body**

In `HomeScreen.tsx`, replace the entire `export function HomeScreen() { … }` (currently lines 894-1035) with:

```tsx
// --- Root -------------------------------------------------------------------
export function HomeScreen() {
  // Home is always the platform-level view; the org-level toggle was removed.
  const [editing, setEditing] = useState(false)
  const [viewsState, setViewsState] = useState<ViewsState>(() => loadViewsState())
  const [showGenerate, setShowGenerate] = useState(false)
  // The pending generated view awaiting Apply/Discard (null when not previewing).
  const [previewView, setPreviewView] = useState<NewView | null>(null)

  const activeView = getActiveView(viewsState)
  // Preview overrides the active view (layout + role) until applied/discarded.
  const activeRole = previewView ? previewView.role : activeView.role
  const activeLayout = previewView ? previewView.layout : activeView.layout
  const data = useMemo(() => deriveRoleData(DATA.platform, activeRole), [activeRole])

  const applyPreview = () => {
    if (previewView) setViewsState((prev) => addView(prev, previewView))
    setPreviewView(null)
    setShowGenerate(false)
  }
  const discardPreview = () => {
    setPreviewView(null)
    setShowGenerate(false)
  }

  useEffect(() => {
    persistViewsState(viewsState)
  }, [viewsState])

  const used = [...activeLayout.left, ...activeLayout.right]
  const available = (Object.keys(WIDGETS) as WidgetId[]).filter((id) => !used.includes(id))

  const moveWidget = (from: DragItem, toColumn: ColumnKey, toIndex: number) => {
    setViewsState((prev) => {
      const cur = getActiveView(prev).layout
      const next: Layout = { left: [...cur.left], right: [...cur.right] }
      const srcArr = next[from.column]
      const realIdx = srcArr.indexOf(from.id)
      if (realIdx === -1) return prev
      srcArr.splice(realIdx, 1)
      const destArr = next[toColumn]
      const clamped = Math.max(0, Math.min(toIndex, destArr.length))
      destArr.splice(clamped, 0, from.id)
      return updateActiveLayout(prev, next)
    })
  }

  const removeWidget = (column: ColumnKey, index: number) => {
    setViewsState((prev) => {
      const cur = getActiveView(prev).layout
      const next: Layout = { left: [...cur.left], right: [...cur.right] }
      next[column].splice(index, 1)
      return updateActiveLayout(prev, next)
    })
  }

  const addWidget = (id: WidgetId) => {
    setViewsState((prev) => {
      const cur = getActiveView(prev).layout
      const target: ColumnKey = cur.left.length <= cur.right.length ? 'left' : 'right'
      const next: Layout = { left: [...cur.left], right: [...cur.right] }
      next[target].push(id)
      return updateActiveLayout(prev, next)
    })
  }

  const resetLayout = () => setViewsState((prev) => updateActiveLayout(prev, DEFAULT_LAYOUT))

  const renderColumn = (column: ColumnKey) => (
    <div className="flex flex-col gap-4">
      {activeLayout[column].map((id, index) => (
        <DraggableWidget key={id} id={id} column={column} index={index} editing={editing} onMove={moveWidget} onRemove={removeWidget}>
          {WIDGETS[id].render(data)}
        </DraggableWidget>
      ))}
      {editing && <ColumnDropZone column={column} count={activeLayout[column].length} onMove={moveWidget} />}
    </div>
  )

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full gap-2">
      <div data-testid="screen-home" className="h-full flex-1 overflow-y-auto rounded-[26px] bg-white">
        <div className="min-w-[900px] px-10 pt-8 pb-10">
          {/* Greeting header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-[26px] font-normal leading-8 tracking-[0.35px]" style={{ color: INK_SOFT }}>
                  {editing ? 'Customize your dashboard' : 'Good morning, Alex'}
                </p>
                {!editing && !previewView && (
                  <ViewSwitcher
                    views={viewsState.views}
                    activeId={viewsState.activeId}
                    onSelect={(id) => setViewsState((p) => setActiveView(p, id))}
                    onRename={(id, name) => setViewsState((p) => renameView(p, id, name))}
                    onDelete={(id) => setViewsState((p) => deleteView(p, id))}
                    onNew={() => setShowGenerate(true)}
                  />
                )}
              </div>
              <p className="mt-1 text-[14px] font-normal tracking-[-0.154px]" style={{ color: MUTED }}>
                {editing ? 'Drag widgets to reorder, remove them, or add new ones.' : "Here's what your agents need from you today."}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {editing ? (
                <>
                  <AddWidgetMenu available={available} onAdd={addWidget} />
                  <button onClick={resetLayout} className="flex h-9 items-center rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }}>
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Reset</span>
                  </button>
                  <button onClick={() => setEditing(false)} className="flex h-9 items-center gap-1.5 rounded-full px-4 outline-none" style={{ backgroundColor: INK }}>
                    <Check size={15} color="#fff" />
                    <span className="text-[13px] font-semibold text-white">Done</span>
                  </button>
                </>
              ) : (
                <>
                  {previewView && (
                    <span className="flex h-9 items-center gap-1.5 rounded-full px-3" style={{ backgroundColor: `${PURPLE}12` }}>
                      <Sparkles size={13} color={PURPLE} />
                      <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>Preview</span>
                    </span>
                  )}
                  <button onClick={() => setShowGenerate(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Generate a new Home">
                    <Sparkles size={14} color={PURPLE} />
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Generate</span>
                  </button>
                  {!previewView && (
                    <button onClick={() => setEditing(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Customize dashboard">
                      <Pencil size={14} color={INK} />
                      <span className="text-[13px] font-semibold" style={{ color: INK }}>Customize</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Two-column customizable grid */}
          <div className="grid grid-cols-[1fr_360px] items-start gap-4">
            {renderColumn('left')}
            {renderColumn('right')}
          </div>
        </div>
      </div>
      {showGenerate && (
        <GenerateHomePanel
          hasPreview={previewView !== null}
          onGenerate={setPreviewView}
          onApply={applyPreview}
          onDiscard={discardPreview}
          onClose={discardPreview}
        />
      )}
      </div>
    </DndProvider>
  )
}
```

- [ ] **Step 7: Run the full home test suite**

Run: `npx vitest run src/features/home/`
Expected: PASS — the 4 new view tests, the existing generate/apply/discard/customize tests, and all widget tests.

If an existing generate test fails because it referenced the old single-layout apply behavior, verify the new behavior is correct (Apply now adds a view) and update that test's assertion to match — do NOT weaken a test to hide a real regression.

- [ ] **Step 8: Run the full suite + typecheck + build**

Run:
```bash
npx vitest run && npx tsc --noEmit && npx vite build
```
Expected: all tests pass, no type errors, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/features/home/HomeScreen.tsx src/features/home/GenerateHomePanel.tsx src/features/home/HomeScreen.test.tsx
git commit -m "feat(home): switchable role-tailored dashboard views"
```

---

## Self-Review

**Spec coverage:**
- Views as first-class state (§1) → Task 2 (`views-store`) + Task 4 (HomeScreen state).
- Persistence to `home-dashboard-views-v1`, validation rigor, seeding, deterministic ids, no migration → Task 2.
- `deriveRoleData` reorder + reframe, null passthrough (§2) → Task 1.
- Generation adds a view, preview shows tailored data (§3) → Task 4 (`applyPreview` → `addView`; `activeRole`/`activeLayout` use `previewView`).
- Switcher dropdown with rename/delete/new, Default protected (§4) → Task 3 + Task 4 wiring.
- Editing edits active view's layout (§5) → Task 4 (`updateActiveLayout` in move/remove/add/reset).
- Testing coverage (§Testing) → each task's test step.

**Placeholder scan:** No TBD/TODO; every code step shows complete code. Edits give exact anchors and full replacement blocks.

**Type consistency:** `NewView` = `{ name; role: Role | null; layout: Layout }` defined in Task 2, consumed by `GenerateHomePanel.onGenerate` and `setPreviewView` in Task 4. `getActiveView`, `addView`, `renameView`, `deleteView`, `setActiveView`, `updateActiveLayout` names match across Tasks 2 and 4. `deriveRoleData(base, role)` signature consistent Tasks 1 and 4. `ViewSwitcher` prop names match Tasks 3 and 4. `DragItem`/`ColumnKey`/`Layout` reused from existing HomeScreen scope (defined earlier in the file, above the root component — untouched by the Task 4 edits).
