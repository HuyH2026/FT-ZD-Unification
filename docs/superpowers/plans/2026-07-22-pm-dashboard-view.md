# PM Dashboard View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Product manager" role to the Home Generate panel that produces a saved, switchable, customizable PM dashboard (KPIs, Spotlight, Lifecycle funnel, opportunity feed) with working filters and a mock Jira/PM-tool connect flow.

**Architecture:** Views become a discriminated union on a `kind` field (`'grid'` = existing two-column support dashboard; `'pm'` = the new PM layout as an ordered `PmWidgetId[]`). PM data is a standalone deterministic mock (`pm-data.ts`), never derived from `DATA.platform`. A new `PmDashboard.tsx` renders PM widgets into a span-aware grid reusing the existing react-dnd edit-mode chrome. `HomeScreen` branches on `activeView.kind`.

**Tech Stack:** React 19, TypeScript strict (pinned 5.9), Vite, Vitest + React Testing Library (jsdom), react-dnd (HTML5Backend), lucide-react, Tailwind v4.

## Global Constraints

- **Frontend-only.** No backend, no network. All PM data is an in-memory mock.
- **Determinism.** No `Date.now()` / `Math.random()`. Anchor all date math to a module constant `PM_NOW = new Date('2026-06-15T00:00:00Z').getTime()`. Ids from a module `seq` counter (existing `views-store` pattern).
- **TypeScript strict**; keep all new code fully typed. Do NOT add `baseUrl` to tsconfig. Do NOT bump TypeScript off 5.9.
- **localStorage access is guarded**: always `window.localStorage?.` inside try/catch (jsdom has no localStorage by default). Validate persisted blobs with own-key membership (`Set.has`), never the `in` operator.
- **Styling:** reuse the inline palette constants already in `HomeScreen.tsx` (`INK='#2f3130'`, `INK_SOFT='#2f3941'`, `MUTED='#8b8e89'`, `BORDER='#e2e0dd'`, `BLUE='#1f73b7'`, `GREEN='#0f8a5f'`, `AMBER='#c8792b'`, `RED='#c8402f'`, `PURPLE='#724be8'`). Do NOT introduce `font-['...']` arbitrary font-family classes. Icons from `lucide-react`.
- **Backward compatibility:** every currently-persisted view has no `kind` field; loading MUST treat a missing `kind` as `'grid'`. All existing grid/nav/org tests must stay green.
- **Test hygiene:** assert real behavior; scope DOM queries with `within(getByTestId(...))` where practical. Follow the `stubStorage` helper pattern from the existing test files.

---

## File Structure

- `src/features/home/pm-data.ts` (new) — PM types, `PM_NOW`, `PM_DATA` mock.
- `src/features/home/pm-data.test.ts` (new) — data invariants.
- `src/features/home/pm-integration.ts` (new) — mock connect store (load/validate/persist).
- `src/features/home/pm-integration.test.ts` (new) — store behavior.
- `src/features/home/generate-layout.ts` (modify) — add `'pm'` role + `PmWidgetId`/`PM_WIDGET_ID_LIST`/`DEFAULT_PM_LAYOUT`.
- `src/features/home/views-store.ts` (modify) — `kind` discriminated union + PM reducers + sanitizer branch.
- `src/features/home/views-store.test.ts` (modify) — PM round-trip, PM reducers, sanitizer, grid regression.
- `src/features/home/PmDashboard.tsx` (new) — PM widgets, `PmDraggableWidget`, span-aware grid, `PM_WIDGETS` registry.
- `src/features/home/PmDashboard.test.tsx` (new) — render + interactivity + connect flow.
- `src/features/home/GenerateHomePanel.tsx` (modify) — PM role emits a `kind:'pm'` NewView.
- `src/features/home/HomeScreen.tsx` (modify) — branch on `activeView.kind`.

Task order is dependency-ordered: data + role constants first (no deps), then the store (depends on role constants), then the PM UI (depends on data + constants), then the panel + screen wiring (depends on all).

---

### Task 1: Role constant + PM widget constants (`generate-layout.ts`) + role-data retype

**Files:**
- Modify: `src/features/home/generate-layout.ts`
- Modify: `src/features/home/role-data.ts`
- Test: `src/features/home/generate-layout.test.ts` (create if absent; otherwise append)

**Interfaces:**
- Consumes: existing `Role`, `ROLES`, `Layout`, `WidgetId` in this file.
- Produces:
  - `type Role = 'ops' | 'quality' | 'knowledge' | 'exec' | 'pm'`
  - `type GridRole = Exclude<Role, 'pm'>` (grid-only roles for `deriveRoleData`)
  - `ROLES` gains `{ key: 'pm', label: 'Product manager' }` (appended last)
  - `type PmWidgetId = 'pm-kpis' | 'pm-spotlight' | 'pm-lifecycle' | 'pm-feed'`
  - `const PM_WIDGET_ID_LIST: PmWidgetId[]`
  - `const DEFAULT_PM_LAYOUT: PmWidgetId[]`

**Why role-data.ts is edited HERE, not in Task 2:** `role-data.ts` types `METRIC_PRIORITY`/`ROLE_SUMMARY` as `Record<Role, …>`. The moment `Role` gains `'pm'` (this task), those maps fail `tsc` (missing `pm` key). To keep this task's deliverable green (`tsc` clean), the role-data retype must land in the SAME task. It is a small, mechanical edit with no new behavior.

- [ ] **Step 1: Write the failing test**

Create `src/features/home/generate-layout.test.ts` (or append if it exists):

```ts
import { describe, it, expect } from 'vitest'
import {
  ROLES, PM_WIDGET_ID_LIST, DEFAULT_PM_LAYOUT,
  type Role, type PmWidgetId,
} from './generate-layout'

describe('generate-layout — PM role & widgets', () => {
  it('includes a Product manager role keyed pm', () => {
    const pm = ROLES.find((r) => r.key === 'pm')
    expect(pm).toBeDefined()
    expect(pm!.label).toBe('Product manager')
  })

  it('keeps the four grid roles present', () => {
    for (const k of ['ops', 'quality', 'knowledge', 'exec'] as Role[]) {
      expect(ROLES.some((r) => r.key === k)).toBe(true)
    }
  })

  it('lists all four PM widget ids', () => {
    const expected: PmWidgetId[] = ['pm-kpis', 'pm-spotlight', 'pm-lifecycle', 'pm-feed']
    expect(PM_WIDGET_ID_LIST).toEqual(expected)
  })

  it('DEFAULT_PM_LAYOUT contains every PM widget once', () => {
    expect([...DEFAULT_PM_LAYOUT].sort()).toEqual([...PM_WIDGET_ID_LIST].sort())
    expect(new Set(DEFAULT_PM_LAYOUT).size).toBe(DEFAULT_PM_LAYOUT.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/home/generate-layout.test.ts`
Expected: FAIL — `PM_WIDGET_ID_LIST`/`DEFAULT_PM_LAYOUT` not exported, `pm` role missing.

- [ ] **Step 3: Implement**

In `src/features/home/generate-layout.ts`:

Change the `Role` type and add `GridRole`:

```ts
export type Role = 'ops' | 'quality' | 'knowledge' | 'exec' | 'pm'
// Grid roles reorder the shared support widgets; 'pm' renders a bespoke layout.
export type GridRole = Exclude<Role, 'pm'>
```

Append to `ROLES` (keep existing four in order, add pm last):

```ts
export const ROLES: { key: Role; label: string }[] = [
  { key: 'ops', label: 'Ops lead' },
  { key: 'quality', label: 'Quality lead' },
  { key: 'knowledge', label: 'Knowledge manager' },
  { key: 'exec', label: 'Executive' },
  { key: 'pm', label: 'Product manager' },
]
```

`ROLE_BASELINE` is typed `Record<Role, FocusArea[]>` — adding `'pm'` to `Role` will now require a `pm` entry. Retype it to `Record<GridRole, FocusArea[]>` (PM never uses focus scoring):

```ts
const ROLE_BASELINE: Record<GridRole, FocusArea[]> = {
  ops: ['resolution', 'actions'],
  quality: ['quality', 'resolution'],
  knowledge: ['knowledge', 'actions'],
  exec: ['resolution', 'cost'],
}
```

`generateLayout` takes `role: Role`. Its only use of `role` is `ROLE_BASELINE[input.role]`, reached only when `focuses.length === 0`. Guard it so a `pm` role (which shouldn't reach here, but keep total) doesn't index a missing key:

```ts
export function generateLayout(input: {
  role: Role
  focuses: FocusArea[]
  prompt?: string
}): Layout {
  const baseline = input.role === 'pm' ? [] : ROLE_BASELINE[input.role]
  const effective = input.focuses.length > 0 ? input.focuses : baseline
  // ...rest unchanged
```

Add PM widget constants at the end of the file (import `WidgetId` already present):

```ts
// --- PM dashboard widgets (bespoke layout, ordered list not two columns) -----
export type PmWidgetId = 'pm-kpis' | 'pm-spotlight' | 'pm-lifecycle' | 'pm-feed'
export const PM_WIDGET_ID_LIST: PmWidgetId[] = ['pm-kpis', 'pm-spotlight', 'pm-lifecycle', 'pm-feed']
export const DEFAULT_PM_LAYOUT: PmWidgetId[] = ['pm-kpis', 'pm-spotlight', 'pm-lifecycle', 'pm-feed']
```

- [ ] **Step 4: Retype `role-data.ts` against `GridRole` (same task — keeps `tsc` green)**

In `src/features/home/role-data.ts`, change the imports and the two `Record<Role, …>` maps to `GridRole`, and make `deriveRoleData` total for `'pm'`/`null`:

```ts
import type { LevelData } from './dashboard-data'
import type { Role, GridRole } from './generate-layout'

const METRIC_PRIORITY: Record<GridRole, string[]> = {
  ops: ['res', 'esc', 'aht', 'csat'],
  quality: ['esc', 'aht', 'csat', 'res'],
  knowledge: ['res', 'csat', 'esc', 'aht'],
  exec: ['csat', 'res', 'esc', 'aht'],
}

const ROLE_SUMMARY: Record<GridRole, string> = {
  ops: 'Resolution is up and escalations are down — throughput is healthy. Voice handle time is the one area worth a look.',
  quality: 'Failure signals are low: escalations down 1.2% and handle time trending down. Voice flows carry the most test failures.',
  knowledge: 'Outcomes are strong and CSAT is climbing. Refund-eligibility gaps are still driving avoidable misses.',
  exec: 'Customer satisfaction and resolution are both trending up, and spend is on track against budget — no action needed.',
}
```

Change the guard in `deriveRoleData` so `null` OR `'pm'` returns base (PM never reorders support metrics):

```ts
export function deriveRoleData(base: LevelData, role: Role | null): LevelData {
  if (role === null || role === 'pm') return base
  return {
    ...base,
    metrics: reorderByKey(base.metrics, METRIC_PRIORITY[role]),
    aiSummary: ROLE_SUMMARY[role] ?? base.aiSummary,
  }
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/features/home/generate-layout.test.ts src/features/home/role-data.test.ts && npx tsc --noEmit`
Expected: PASS (new generate-layout tests + existing role-data tests), **0 type errors** — the branch is green.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/generate-layout.ts src/features/home/role-data.ts src/features/home/generate-layout.test.ts
git commit -m "feat: add Product manager role and PM widget constants"
```

---

### Task 2: PM data mock (`pm-data.ts`)

**Files:**
- Create: `src/features/home/pm-data.ts`
- Create: `src/features/home/pm-data.test.ts`

**Interfaces:**
- Consumes: `LifecycleStageKey`, `SpotlightFilter`, `OppType` (defined here). (Role typing was handled in Task 1.)
- Produces (exact exported shapes):

```ts
export const PM_NOW: number
export type PmTrend = 'up' | 'down'
export type LifecycleStageKey = 'detected' | 'planned' | 'in-dev' | 'shipped'
export type SpotlightFilter = 'trending' | 'at-risk' | 'asking'
export type OppType = 'request' | 'bug'
export type PmKpi = { key: string; label: string; value: string; caption: string; delta: string; deltaGood: boolean; up: boolean }
export type SpotlightItem = { id: string; rank: number; title: string; meta: string; stage: LifecycleStageKey; trendPct: string; trendGood: boolean; up: boolean; filters: SpotlightFilter[] }
export type LifecycleStage = { key: LifecycleStageKey; label: string; amount: string; amountValue: number; recCount: number }
export type Opportunity = { id: string; type: OppType; title: string; description: string; quote: string; impact: number; revenue: string; revenueState: 'asking' | 'at-risk'; volumeTrend: number[]; volumePct: string; volumeGood: boolean; volumeUp: boolean; customers: number; plans: string[]; stage: LifecycleStageKey; firstSeen: number; firstSeenLabel: string }
export type PmData = { kpis: PmKpi[]; spotlight: SpotlightItem[]; lifecycle: LifecycleStage[]; opportunities: Opportunity[] }
export const PM_DATA: PmData
export const LIFECYCLE_LABEL: Record<LifecycleStageKey, string>
export const SPOTLIGHT_TABS: { key: SpotlightFilter; label: string }[]
```

- [ ] **Step 1: Write the failing test**

Create `src/features/home/pm-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PM_DATA, PM_NOW, type LifecycleStageKey } from './pm-data'

describe('pm-data', () => {
  it('has five KPI cards including ARR at risk and ARR asking', () => {
    expect(PM_DATA.kpis).toHaveLength(5)
    const labels = PM_DATA.kpis.map((k) => k.label)
    expect(labels).toContain('ARR at risk')
    expect(labels).toContain('ARR asking')
  })

  it('lifecycle has the four stages in Detected→Shipped order', () => {
    const keys = PM_DATA.lifecycle.map((s) => s.key)
    expect(keys).toEqual(['detected', 'planned', 'in-dev', 'shipped'] as LifecycleStageKey[])
    expect(PM_DATA.lifecycle.every((s) => s.amountValue > 0 && s.recCount > 0)).toBe(true)
  })

  it('every spotlight item declares at least one filter tab and a valid stage', () => {
    const stages = new Set<LifecycleStageKey>(['detected', 'planned', 'in-dev', 'shipped'])
    expect(PM_DATA.spotlight.length).toBeGreaterThan(0)
    for (const item of PM_DATA.spotlight) {
      expect(item.filters.length).toBeGreaterThan(0)
      expect(stages.has(item.stage)).toBe(true)
    }
  })

  it('each spotlight tab has at least one item', () => {
    for (const tab of ['trending', 'at-risk', 'asking'] as const) {
      expect(PM_DATA.spotlight.some((i) => i.filters.includes(tab))).toBe(true)
    }
  })

  it('opportunities are well-formed with impact 0-100 and firstSeen before PM_NOW', () => {
    expect(PM_DATA.opportunities.length).toBeGreaterThan(0)
    for (const o of PM_DATA.opportunities) {
      expect(o.impact).toBeGreaterThanOrEqual(0)
      expect(o.impact).toBeLessThanOrEqual(100)
      expect(o.firstSeen).toBeLessThanOrEqual(PM_NOW)
      expect(['request', 'bug']).toContain(o.type)
      expect(['asking', 'at-risk']).toContain(o.revenueState)
      expect(o.volumeTrend.length).toBeGreaterThan(0)
    }
  })

  it('includes the SAML SSO opportunity from the design', () => {
    const saml = PM_DATA.opportunities.find((o) => o.title.includes('SAML SSO'))
    expect(saml).toBeDefined()
    expect(saml!.impact).toBe(88)
    expect(saml!.revenue).toBe('$610K')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/home/pm-data.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `pm-data.ts`**

Create `src/features/home/pm-data.ts` with values transcribed from the Figma (node 200:5520):

```ts
// Standalone deterministic mock for the PM dashboard view. NOT derived from
// DATA.platform — the PM view surfaces product-signal-from-support (revenue at
// risk, opportunity, calculated priority, delivery lifecycle). No backend, no
// Date.now(): PM_NOW anchors all date math so filtering is deterministic.

// Anchor "now" for date-range filtering (matches the Figma's ~mid-June window).
export const PM_NOW = new Date('2026-06-15T00:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000

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
  filters: SpotlightFilter[]
}
export type LifecycleStage = {
  key: LifecycleStageKey; label: string; amount: string; amountValue: number; recCount: number
}
export type Opportunity = {
  id: string; type: OppType; title: string; description: string; quote: string
  impact: number
  revenue: string; revenueState: 'asking' | 'at-risk'
  volumeTrend: number[]; volumePct: string; volumeGood: boolean; volumeUp: boolean
  customers: number; plans: string[]; stage: LifecycleStageKey
  firstSeen: number; firstSeenLabel: string
}
export type PmData = {
  kpis: PmKpi[]
  spotlight: SpotlightItem[]
  lifecycle: LifecycleStage[]
  opportunities: Opportunity[]
}

export const LIFECYCLE_LABEL: Record<LifecycleStageKey, string> = {
  detected: 'Detected',
  planned: 'Planned',
  'in-dev': 'In dev',
  shipped: 'Shipped',
}

export const SPOTLIGHT_TABS: { key: SpotlightFilter; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'at-risk', label: 'At risk' },
  { key: 'asking', label: 'Asking' },
]

export const PM_DATA: PmData = {
  kpis: [
    { key: 'synth', label: 'Conversations synthesized', value: '3,184', caption: 'last 30d · 47 rec.', delta: '5%', deltaGood: true, up: true },
    { key: 'spiking', label: 'Spiking now', value: '7', caption: '2 new this week', delta: '30%', deltaGood: false, up: true },
    { key: 'at-risk', label: 'ARR at risk', value: '$1.36M', caption: 'churn risks, bugs & gaps', delta: '15%', deltaGood: false, up: true },
    { key: 'asking', label: 'ARR asking', value: '$912K', caption: 'opportunity & request', delta: '12%', deltaGood: true, up: true },
    { key: 'realized', label: 'Realized impact', value: '$408K', caption: 'shipped', delta: '32%', deltaGood: true, up: true },
  ],
  spotlight: [
    { id: 's1', rank: 1, title: 'Android 15 app crashes on launch after update', meta: '206 conversations · churn risk $120K', stage: 'in-dev', trendPct: '140%', trendGood: false, up: true, filters: ['trending', 'at-risk'] },
    { id: 's2', rank: 2, title: 'Bulk CSV export times out past ~10k rows', meta: '91 conversations · churn risk $190K', stage: 'planned', trendPct: '38%', trendGood: false, up: true, filters: ['trending', 'at-risk'] },
    { id: 's3', rank: 3, title: 'SCIM auto-provisioning for user lifecycle', meta: '64 conversations · opportunity $610K', stage: 'planned', trendPct: '23%', trendGood: true, up: true, filters: ['trending', 'asking'] },
  ],
  lifecycle: [
    { key: 'detected', label: 'Detected', amount: '$232K', amountValue: 232, recCount: 26 },
    { key: 'planned', label: 'Planned', amount: '$1.08M', amountValue: 1080, recCount: 14 },
    { key: 'in-dev', label: 'In dev', amount: '$846K', amountValue: 846, recCount: 7 },
    { key: 'shipped', label: 'Shipped', amount: '$408K', amountValue: 408, recCount: 3 },
  ],
  opportunities: [
    {
      id: 'o1', type: 'request',
      title: 'SAML SSO drops users on silent token refresh',
      description: 'When a session token expires and the app silently attempts to refresh it, the SAML SSO flow fails.',
      quote: 'Every 60 minutes our whole org gets kicked back to login.',
      impact: 88, revenue: '$610K', revenueState: 'asking',
      volumeTrend: [40, 44, 48, 55, 60, 72, 85, 96, 108, 120], volumePct: '70%', volumeGood: true, volumeUp: false,
      customers: 130, plans: ['Annual plan', 'Pro • Enterprise'], stage: 'in-dev',
      firstSeen: PM_NOW - 3 * DAY, firstSeenLabel: 'First seen Jun 12',
    },
    {
      id: 'o2', type: 'bug',
      title: 'SCIM auto-provisioning for user lifecycle',
      description: 'Users are automatically provisioned and deprovisioned via SCIM, keeping accounts in sync with the identity provider throughout the user lifecycle.',
      quote: "We can't roll you out org-wide until provisioning is automated.",
      impact: 78, revenue: '$455K', revenueState: 'at-risk',
      volumeTrend: [120, 110, 100, 92, 80, 66, 52, 40, 30, 22], volumePct: '80%', volumeGood: false, volumeUp: true,
      customers: 75, plans: ['Annual plan', 'Pro • Enterprise'], stage: 'detected',
      firstSeen: PM_NOW - 3 * DAY, firstSeenLabel: 'First seen Jun 12',
    },
    {
      id: 'o3', type: 'request',
      title: 'Bulk CSV export times out past ~10k rows',
      description: 'Large exports exceed the request timeout, forcing customers to split files manually or abandon the export.',
      quote: 'We schedule weekly exports and half of them silently fail now.',
      impact: 64, revenue: '$190K', revenueState: 'at-risk',
      volumeTrend: [10, 14, 18, 22, 30, 38, 47, 58, 70, 91], volumePct: '38%', volumeGood: false, volumeUp: true,
      customers: 44, plans: ['Monthly plan', 'Growth'], stage: 'planned',
      firstSeen: PM_NOW - 40 * DAY, firstSeenLabel: 'First seen May 6',
    },
  ],
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run src/features/home/pm-data.test.ts && npx tsc --noEmit`
Expected: PASS, 0 type errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/pm-data.ts src/features/home/pm-data.test.ts
git commit -m "feat: add PM dashboard mock data"
```

---

### Task 3: PM integration (connect) store (`pm-integration.ts`)

**Files:**
- Create: `src/features/home/pm-integration.ts`
- Create: `src/features/home/pm-integration.test.ts`

**Interfaces:**
- Produces:

```ts
export type PmTool = 'jira' | 'linear' | 'asana'
export type PmIntegration = { connected: boolean; tool: PmTool | null }
export const PM_TOOLS: { key: PmTool; label: string }[]
export const PM_TOOL_LABEL: Record<PmTool, string>
export function loadPmIntegration(): PmIntegration
export function persistPmIntegration(state: PmIntegration): void
```

- [ ] **Step 1: Write the failing test**

Create `src/features/home/pm-integration.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadPmIntegration, persistPmIntegration, type PmIntegration } from './pm-integration'

const KEY = 'home-pm-integration-v1'

function stubStorage(stored?: string) {
  const map = new Map<string, string>(stored ? [[KEY, stored]] : [])
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: map.size,
  })
}

describe('pm-integration', () => {
  beforeEach(() => stubStorage())

  it('defaults to disconnected when nothing stored', () => {
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })

  it('round-trips a connected state', () => {
    const s: PmIntegration = { connected: true, tool: 'jira' }
    persistPmIntegration(s)
    expect(loadPmIntegration()).toEqual(s)
  })

  it('sanitizes an unknown tool to disconnected', () => {
    stubStorage(JSON.stringify({ connected: true, tool: 'bogus' }))
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })

  it('treats connected:true with null tool as disconnected', () => {
    stubStorage(JSON.stringify({ connected: true, tool: null }))
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })

  it('falls back to default on malformed JSON', () => {
    stubStorage('{bad json')
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/home/pm-integration.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/home/pm-integration.ts`:

```ts
// Backend-free store for the PM dashboard's mock "connect a PM tool" flow.
// Persists which tool is connected so the opportunity cards can offer
// "Add to {Tool}". No real API — purely presentational connect state.
// Same load/validate/persist/guard pattern as views-store.ts.

export type PmTool = 'jira' | 'linear' | 'asana'
export type PmIntegration = { connected: boolean; tool: PmTool | null }

export const PM_TOOLS: { key: PmTool; label: string }[] = [
  { key: 'jira', label: 'Jira' },
  { key: 'linear', label: 'Linear' },
  { key: 'asana', label: 'Asana' },
]
export const PM_TOOL_LABEL: Record<PmTool, string> = {
  jira: 'Jira', linear: 'Linear', asana: 'Asana',
}

const STORAGE_KEY = 'home-pm-integration-v1'
const TOOL_KEYS = new Set<string>(['jira', 'linear', 'asana'])
const DISCONNECTED: PmIntegration = { connected: false, tool: null }

export function loadPmIntegration(): PmIntegration {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return { ...DISCONNECTED }
    const parsed = JSON.parse(raw) as { connected?: unknown; tool?: unknown }
    // Only a known tool string counts as connected — own-key membership, not `in`.
    if (parsed.connected === true && typeof parsed.tool === 'string' && TOOL_KEYS.has(parsed.tool)) {
      return { connected: true, tool: parsed.tool as PmTool }
    }
    return { ...DISCONNECTED }
  } catch {
    return { ...DISCONNECTED }
  }
}

export function persistPmIntegration(state: PmIntegration): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/home/pm-integration.test.ts && npx tsc --noEmit`
Expected: PASS, 0 type errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/pm-integration.ts src/features/home/pm-integration.test.ts
git commit -m "feat: add mock PM-tool connect store"
```

---

### Task 4: Views store — `kind` discriminated union + PM reducers

**Files:**
- Modify: `src/features/home/views-store.ts`
- Modify: `src/features/home/views-store.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_LAYOUT`, `WIDGET_ID_LIST`, `Layout`, `WidgetId` (dashboard-data); `Role`, `PmWidgetId`, `PM_WIDGET_ID_LIST`, `DEFAULT_PM_LAYOUT` (generate-layout).
- Produces (new/changed shapes):

```ts
export type GridView = { id: string; name: string; kind: 'grid'; role: Role | null; layout: Layout; builtIn?: boolean }
export type PmView = { id: string; name: string; kind: 'pm'; role: 'pm'; pmLayout: PmWidgetId[]; builtIn?: boolean }
export type DashboardView = GridView | PmView
export type ViewsState = { views: DashboardView[]; activeId: string }
export type NewGridView = { name: string; kind?: 'grid'; role: Role | null; layout: Layout }
export type NewPmView = { name: string; kind: 'pm'; role: 'pm'; pmLayout: PmWidgetId[] }
export type NewView = NewGridView | NewPmView
// existing fns keep signatures; add:
export function movePmWidget(state: ViewsState, fromIndex: number, toIndex: number): ViewsState
export function removePmWidget(state: ViewsState, id: PmWidgetId): ViewsState
export function addPmWidget(state: ViewsState, id: PmWidgetId): ViewsState
export function resetPmLayout(state: ViewsState): ViewsState
```

**Design notes for the implementer:**
- The `Default` seed view is `kind: 'grid'`.
- `addView` branches on `view.kind === 'pm'`.
- `sanitizeView`: a loaded view with `kind === 'pm'` (and a valid `pmLayout`) becomes a `PmView`; anything else (including missing `kind`) becomes a `GridView` (backward compat). A PM view with an empty/invalid `pmLayout` after sanitize falls back to `DEFAULT_PM_LAYOUT` (so it never renders empty) — this differs from grid, where an empty layout makes the whole view invalid. Rationale: a grid view with no widgets is meaningless, but a PM view's identity is the `kind`, not its widget set.
- The grid PM reducers must be no-ops when the active view is not a PM view (guard on `kind`), and vice-versa for `updateActiveLayout` (guard grid). Keep existing grid reducers working by having them operate only on grid views — but to avoid churning existing passing tests, leave `updateActiveLayout` as-is (it spreads `...v` and sets `layout`; on a PM view it would add a bogus `layout`, but grid reducers are only ever called on grid views by HomeScreen). To be safe and explicit, guard `updateActiveLayout` to only replace when the active view is grid.

- [ ] **Step 1: Write the failing tests (append to `views-store.test.ts`)**

Add these imports to the top import block: `movePmWidget, removePmWidget, addPmWidget, resetPmLayout`. Add `DEFAULT_PM_LAYOUT` from `./generate-layout`. Then append a new describe block:

```ts
import { DEFAULT_PM_LAYOUT } from './generate-layout'

const genPm: NewView = { name: 'Product manager', kind: 'pm', role: 'pm', pmLayout: [...DEFAULT_PM_LAYOUT] }

describe('views-store — PM views', () => {
  it('addView creates a pm-kind view carrying pmLayout', () => {
    const s = addView(seedViewsState(), genPm)
    const v = s.views[1]
    expect(v.kind).toBe('pm')
    expect(s.activeId).toBe(v.id)
    if (v.kind === 'pm') {
      expect(v.pmLayout).toEqual(DEFAULT_PM_LAYOUT)
      expect(v.role).toBe('pm')
    }
  })

  it('the seeded Default view is grid-kind', () => {
    expect(seedViewsState().views[0].kind).toBe('grid')
  })

  it('movePmWidget reorders the active pm layout', () => {
    let s = addView(seedViewsState(), genPm)
    s = setActiveView(s, s.views[1].id)
    const moved = movePmWidget(s, 0, 2) // pm-kpis moves toward the end
    const v = moved.views[1]
    if (v.kind === 'pm') {
      expect(v.pmLayout[0]).not.toBe('pm-kpis')
      expect(new Set(v.pmLayout).size).toBe(v.pmLayout.length)
      expect(v.pmLayout).toContain('pm-kpis')
    } else {
      throw new Error('expected pm view')
    }
  })

  it('removePmWidget drops a widget and addPmWidget appends it back', () => {
    let s = addView(seedViewsState(), genPm)
    s = removePmWidget(s, 'pm-lifecycle')
    let v = s.views[1]
    if (v.kind === 'pm') expect(v.pmLayout).not.toContain('pm-lifecycle')
    s = addPmWidget(s, 'pm-lifecycle')
    v = s.views[1]
    if (v.kind === 'pm') {
      expect(v.pmLayout).toContain('pm-lifecycle')
      expect(new Set(v.pmLayout).size).toBe(v.pmLayout.length) // no dupes
    }
  })

  it('addPmWidget is a no-op for an already-present widget', () => {
    const s = addView(seedViewsState(), genPm)
    const before = (s.views[1] as { pmLayout: string[] }).pmLayout.length
    const after = addPmWidget(s, 'pm-kpis')
    expect((after.views[1] as { pmLayout: string[] }).pmLayout.length).toBe(before)
  })

  it('resetPmLayout restores the default pm layout', () => {
    let s = addView(seedViewsState(), genPm)
    s = removePmWidget(s, 'pm-feed')
    s = resetPmLayout(s)
    const v = s.views[1]
    if (v.kind === 'pm') expect(v.pmLayout).toEqual(DEFAULT_PM_LAYOUT)
  })

  it('pm reducers are no-ops when the active view is a grid view', () => {
    const s = seedViewsState() // active = grid Default
    expect(removePmWidget(s, 'pm-kpis')).toBe(s)
    expect(addPmWidget(s, 'pm-kpis')).toBe(s)
    expect(movePmWidget(s, 0, 1)).toBe(s)
    expect(resetPmLayout(s)).toBe(s)
  })

  it('persists and reloads a pm view (round-trip)', () => {
    // Uses the load-from-localStorage stub from the sibling describe block.
    const map = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(), key: () => null, length: 0,
    })
    const s = addView(seedViewsState(), genPm)
    persistViewsState(s)
    const loaded = loadViewsState()
    const pm = loaded.views.find((v) => v.kind === 'pm')
    expect(pm).toBeDefined()
    if (pm && pm.kind === 'pm') expect(pm.pmLayout).toEqual(DEFAULT_PM_LAYOUT)
    vi.unstubAllGlobals()
  })

  it('sanitizes a legacy view with no kind to grid', () => {
    const map = new Map<string, string>([[STORAGE_KEY, JSON.stringify({
      views: [{ id: 'view-1', name: 'Default', role: null, layout: { left: ['health'], right: [] }, builtIn: true }],
      activeId: 'view-1',
    })]])
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 1,
    })
    const s = loadViewsState()
    expect(s.views[0].kind).toBe('grid')
    vi.unstubAllGlobals()
  })

  it('a pm view with an invalid pmLayout falls back to the default pm layout', () => {
    const map = new Map<string, string>([[STORAGE_KEY, JSON.stringify({
      views: [{ id: 'view-1', name: 'PM', kind: 'pm', role: 'pm', pmLayout: ['bogus', 'pm-kpis', 'pm-kpis'] }],
      activeId: 'view-1',
    })]])
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 1,
    })
    const s = loadViewsState()
    const v = s.views[0]
    expect(v.kind).toBe('pm')
    if (v.kind === 'pm') {
      // 'bogus' dropped, dupe collapsed → but since result would be just ['pm-kpis'],
      // that's a valid non-empty pm layout, so it is kept as-is (deduped, sanitized).
      expect(v.pmLayout).toEqual(['pm-kpis'])
    }
    vi.unstubAllGlobals()
  })
})
```

Note: the last test documents that a *partially* valid pmLayout is kept (deduped, invalid dropped), while a *fully* invalid/empty one falls back to `DEFAULT_PM_LAYOUT`. Implement `sanitizePmLayout` accordingly (below).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/home/views-store.test.ts`
Expected: FAIL — new exports missing.

- [ ] **Step 3: Implement `views-store.ts`**

Replace the type block and add PM handling. Full new file content for the changed regions:

Imports:

```ts
import { DEFAULT_LAYOUT, WIDGET_ID_LIST, type Layout, type WidgetId } from './dashboard-data'
import { DEFAULT_PM_LAYOUT, PM_WIDGET_ID_LIST, type Role, type PmWidgetId } from './generate-layout'
```

Types (replace the existing `DashboardView`/`ViewsState`/`NewView`):

```ts
export type GridView = {
  id: string; name: string; kind: 'grid'
  role: Role | null; layout: Layout
  builtIn?: boolean // the Default view: renamable but NOT deletable
}
export type PmView = {
  id: string; name: string; kind: 'pm'
  role: 'pm'; pmLayout: PmWidgetId[]
  builtIn?: boolean
}
export type DashboardView = GridView | PmView
export type ViewsState = { views: DashboardView[]; activeId: string }

export type NewGridView = { name: string; kind?: 'grid'; role: Role | null; layout: Layout }
export type NewPmView = { name: string; kind: 'pm'; role: 'pm'; pmLayout: PmWidgetId[] }
export type NewView = NewGridView | NewPmView
```

Constants (add PM id set):

```ts
const PM_WIDGET_IDS = new Set<string>(PM_WIDGET_ID_LIST)
const ROLE_KEYS = new Set<string>(['ops', 'quality', 'knowledge', 'exec', 'pm'])
```

`seedViewsState` (add `kind: 'grid'`):

```ts
export function seedViewsState(): ViewsState {
  const id = mintId()
  return {
    views: [{ id, name: 'Default', kind: 'grid', role: null, layout: DEFAULT_LAYOUT, builtIn: true }],
    activeId: id,
  }
}
```

Add a PM-layout sanitizer near `sanitizeLayout`:

```ts
function sanitizePmLayout(arr: unknown): PmWidgetId[] {
  if (!Array.isArray(arr)) return [...DEFAULT_PM_LAYOUT]
  const seen = new Set<PmWidgetId>()
  const cleaned = arr.filter((x): x is PmWidgetId =>
    typeof x === 'string' && PM_WIDGET_IDS.has(x) && !seen.has(x as PmWidgetId) && seen.add(x as PmWidgetId) !== undefined,
  )
  return cleaned.length > 0 ? cleaned : [...DEFAULT_PM_LAYOUT]
}
```

(If the `.add() !== undefined` trick reads awkwardly to the implementer, use an explicit loop — the requirement is: keep only known ids, dedupe preserving first occurrence, fall back to `DEFAULT_PM_LAYOUT` when the result is empty.)

`sanitizeView` — branch on kind:

```ts
function sanitizeView(v: unknown): DashboardView | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  const builtIn = o.builtIn === true ? { builtIn: true as const } : {}

  if (o.kind === 'pm') {
    return { id: o.id, name: o.name, kind: 'pm', role: 'pm', pmLayout: sanitizePmLayout(o.pmLayout), ...builtIn }
  }
  // Default/legacy → grid
  const layout = sanitizeLayout(o.layout)
  if (!layout) return null
  const role =
    o.role === null || (typeof o.role === 'string' && ROLE_KEYS.has(o.role) && o.role !== 'pm')
      ? (o.role as Role | null)
      : null
  return { id: o.id, name: o.name, kind: 'grid', role, layout, ...builtIn }
}
```

`addView` — branch on kind:

```ts
export function addView(state: ViewsState, view: NewView): ViewsState {
  const id = mintId()
  const created: DashboardView =
    view.kind === 'pm'
      ? { id, name: view.name, kind: 'pm', role: 'pm', pmLayout: [...view.pmLayout] }
      : { id, name: view.name, kind: 'grid', role: view.role, layout: view.layout }
  return { views: [...state.views, created], activeId: id }
}
```

`updateActiveLayout` — guard to grid only:

```ts
export function updateActiveLayout(state: ViewsState, layout: Layout): ViewsState {
  return {
    ...state,
    views: state.views.map((v) =>
      v.id === state.activeId && v.kind === 'grid' ? { ...v, layout } : v,
    ),
  }
}
```

Add PM reducers at the end:

```ts
// --- PM view reducers (operate on the active view only when it is a pm view) --
function mapActivePm(state: ViewsState, fn: (pm: PmView) => PmView): ViewsState {
  const active = getActiveView(state)
  if (active.kind !== 'pm') return state
  return { ...state, views: state.views.map((v) => (v.id === state.activeId && v.kind === 'pm' ? fn(v) : v)) }
}

export function movePmWidget(state: ViewsState, fromIndex: number, toIndex: number): ViewsState {
  return mapActivePm(state, (pm) => {
    const next = [...pm.pmLayout]
    if (fromIndex < 0 || fromIndex >= next.length) return pm
    const [moved] = next.splice(fromIndex, 1)
    const clamped = Math.max(0, Math.min(toIndex, next.length))
    next.splice(clamped, 0, moved)
    return { ...pm, pmLayout: next }
  })
}

export function removePmWidget(state: ViewsState, id: PmWidgetId): ViewsState {
  return mapActivePm(state, (pm) => ({ ...pm, pmLayout: pm.pmLayout.filter((w) => w !== id) }))
}

export function addPmWidget(state: ViewsState, id: PmWidgetId): ViewsState {
  return mapActivePm(state, (pm) => (pm.pmLayout.includes(id) ? pm : { ...pm, pmLayout: [...pm.pmLayout, id] }))
}

export function resetPmLayout(state: ViewsState): ViewsState {
  return mapActivePm(state, (pm) => ({ ...pm, pmLayout: [...DEFAULT_PM_LAYOUT] }))
}
```

Note: `mapActivePm` returns the SAME `state` reference when the active view isn't PM (satisfies the `.toBe(s)` no-op assertions).

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run src/features/home/views-store.test.ts && npx tsc --noEmit`
Expected: PASS (all existing grid tests + new PM tests), 0 type errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/views-store.ts src/features/home/views-store.test.ts
git commit -m "feat: views-store discriminated union with PM views and reducers"
```

---

### Task 5: PM dashboard UI (`PmDashboard.tsx`)

**Files:**
- Create: `src/features/home/PmDashboard.tsx`
- Create: `src/features/home/PmDashboard.test.tsx`

**Interfaces:**
- Consumes: `PM_DATA`, `PM_NOW`, `SPOTLIGHT_TABS`, `LIFECYCLE_LABEL`, types (pm-data); `PmWidgetId`, `PM_WIDGET_ID_LIST` (generate-layout); `PmIntegration`, `PmTool`, `PM_TOOLS`, `PM_TOOL_LABEL`, `loadPmIntegration`, `persistPmIntegration` (pm-integration).
- Produces:

```ts
export function PmDashboard(props: {
  pmLayout: PmWidgetId[]
  editing: boolean
  onMove: (fromIndex: number, toIndex: number) => void
  onRemove: (id: PmWidgetId) => void
}): JSX.Element
// The DnD provider is supplied by HomeScreen (already wraps the tree).
```

**Component structure (single file):**
- Local palette constants (copy from HomeScreen: INK, INK_SOFT, MUTED, BORDER, BLUE, GREEN, AMBER, RED, PURPLE).
- Small building blocks: `PmCard` (rounded-2xl white card w/ border), section label style matching Figma ("Spotlight", "Lifecycle").
- Widget components:
  - `PmKpis` — a `flex flex-wrap gap` row of 5 stat cards. Each: label (top), big value, caption + delta chip (arrow up/down; color green when `deltaGood` else red).
  - `PmSpotlight` — header "Spotlight" + tab pills from `SPOTLIGHT_TABS` (local `useState<SpotlightFilter>('trending')`, active pill filled). Rows filtered by `item.filters.includes(tab)`, each with rank, title, meta, a `StageBadge`, and trend %.
  - `PmLifecycle` — header "Lifecycle" + 4 columns; each column a proportional bar (height from `amountValue / maxAmount`), amount + rec count label, stage label under it.
  - `PmFeed` — header with "Connect PM tool" button (or "Connected: {Tool}") + list/grid toggle; a filter bar (search input, date-range preset dropdown, "All filters" popover); then opportunity cards filtered by (search AND date AND type/stage). Manages `useState` for search, datePreset (30/60/90), filters (Set of type + stage), viewMode (list/grid), integration state (from `loadPmIntegration`, updated via `persistPmIntegration`), an in-memory `addedIds: Set<string>`, and a connect-picker open flag.
  - `OpportunityCard` — Impact donut (a simple conic-gradient or SVG ring showing `impact`), REQUEST/BUG tag, title, description, quote block, stage badge, revenue + state chip, volume trend mini-sparkline (reuse the existing `Sparkline`? No — keep PmDashboard self-contained; render a tiny inline bar row or omit the chart and show the % + arrow), customers, plan badges, first-seen, and the action button whose label depends on integration + added state.
  - `StageBadge` — colored pill per `LifecycleStageKey` (detected=slate, planned=purple, in-dev=teal/green, shipped=ink) with `LIFECYCLE_LABEL`.
- `PmDraggableWidget` — mirrors `DraggableWidget` but for a flat list: drag item `{ id, index }`, hover computes insert index and calls `onMove(fromIndex, toIndex)`; shows Drag handle + Remove ✕ when `editing`.
- `PM_WIDGETS: Record<PmWidgetId, { title: string; span: 'full' | 'half'; render: () => ReactNode }>`.
- `PmDashboard` renders `pmLayout` into a `grid grid-cols-2 gap-4` where `full` items get `col-span-2`. Uses `data-testid="screen-pm"` on the root. When `editing`, also render an "Add widget" affordance for missing PM widgets (parent passes `onMove/onRemove`; add is handled by parent too — see Task 6 — so expose it via a prop OR render add menu here reading `PM_WIDGET_ID_LIST` minus present).

To keep the parent wiring uniform with the grid path, **add an `onAdd` and `onReset` prop** to `PmDashboard`:

```ts
export function PmDashboard(props: {
  pmLayout: PmWidgetId[]
  editing: boolean
  onMove: (fromIndex: number, toIndex: number) => void
  onRemove: (id: PmWidgetId) => void
}): JSX.Element
```

The Add-widget / Reset controls live in `HomeScreen`'s header (Task 6), not inside `PmDashboard` — `PmDashboard` only renders the widgets + drag/remove chrome. This mirrors how the grid path keeps AddWidgetMenu/Reset in the header.

**Impact donut implementation (deterministic, no chart lib):** render an SVG ring:

```tsx
function ImpactDonut({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r
  const dash = (value / 100) * c
  const color = value >= 80 ? GREEN : value >= 60 ? BLUE : AMBER
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-label={`Impact ${value}`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#efeeec" strokeWidth="8" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
      <text x="36" y="41" textAnchor="middle" fontSize="18" fontWeight="600" fill={INK}>{value}</text>
    </svg>
  )
}
```

- [ ] **Step 1: Write the failing test**

Create `src/features/home/PmDashboard.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { PmDashboard } from './PmDashboard'
import { DEFAULT_PM_LAYOUT } from './generate-layout'

function renderPm(editing = false) {
  const onMove = vi.fn()
  const onRemove = vi.fn()
  render(
    <DndProvider backend={HTML5Backend}>
      <PmDashboard pmLayout={[...DEFAULT_PM_LAYOUT]} editing={editing} onMove={onMove} onRemove={onRemove} />
    </DndProvider>,
  )
  return { onMove, onRemove }
}

function stubStorage() {
  const map = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(), key: () => null, length: 0,
  })
}

describe('PmDashboard', () => {
  beforeEach(() => stubStorage())
  afterEach(() => vi.unstubAllGlobals())

  it('renders the KPI cards including ARR at risk and ARR asking', () => {
    renderPm()
    const surface = within(screen.getByTestId('screen-pm'))
    expect(surface.getByText('ARR at risk')).toBeInTheDocument()
    expect(surface.getByText('$1.36M')).toBeInTheDocument()
    expect(surface.getByText('ARR asking')).toBeInTheDocument()
  })

  it('renders the lifecycle stages', () => {
    renderPm()
    const surface = within(screen.getByTestId('screen-pm'))
    for (const label of ['Detected', 'Planned', 'In dev', 'Shipped']) {
      expect(surface.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('filters spotlight items when the At risk tab is selected', async () => {
    const user = userEvent.setup()
    renderPm()
    const spotlight = screen.getByTestId('pm-spotlight')
    // SCIM (asking-only) shows under Trending initially.
    expect(within(spotlight).getByText(/SCIM auto-provisioning/i)).toBeInTheDocument()
    await user.click(within(spotlight).getByRole('button', { name: /^At risk$/i }))
    // At risk tab excludes the asking-only SCIM item.
    expect(within(spotlight).queryByText(/SCIM auto-provisioning/i)).not.toBeInTheDocument()
    expect(within(spotlight).getByText(/Android 15 app crashes/i)).toBeInTheDocument()
  })

  it('filters the feed by search text', async () => {
    const user = userEvent.setup()
    renderPm()
    const feed = screen.getByTestId('pm-feed')
    expect(within(feed).getByText(/SAML SSO drops users/i)).toBeInTheDocument()
    await user.type(within(feed).getByPlaceholderText(/search/i), 'SCIM')
    expect(within(feed).queryByText(/SAML SSO drops users/i)).not.toBeInTheDocument()
    expect(within(feed).getByText(/SCIM auto-provisioning/i)).toBeInTheDocument()
  })

  it('connect flow: connecting Jira flips the card action to Add to Jira then Added', async () => {
    const user = userEvent.setup()
    renderPm()
    const feed = screen.getByTestId('pm-feed')
    // Before connect: the action prompts to connect.
    await user.click(within(feed).getByRole('button', { name: /connect pm tool/i }))
    await user.click(screen.getByRole('button', { name: /^Jira$/i }))
    // After connect, each opportunity offers "Add to Jira".
    const addButtons = within(feed).getAllByRole('button', { name: /add to jira/i })
    expect(addButtons.length).toBeGreaterThan(0)
    await user.click(addButtons[0])
    expect(within(feed).getAllByRole('button', { name: /added/i }).length).toBeGreaterThan(0)
  })

  it('shows remove controls in edit mode and calls onRemove', async () => {
    const user = userEvent.setup()
    const { onRemove } = renderPm(true)
    // Each widget has a Remove control in edit mode.
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    expect(removeButtons.length).toBeGreaterThan(0)
    await user.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/home/PmDashboard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `PmDashboard.tsx`**

Build the component per the structure above. Key requirements the tests pin:
- Root element has `data-testid="screen-pm"`.
- The spotlight widget root (or its card) has `data-testid="pm-spotlight"`; feed has `data-testid="pm-feed"`.
- Spotlight tabs are `<button>`s labeled exactly `Trending` / `At risk` / `Asking`; selecting one filters rows by `filters.includes(key)`.
- Feed search is an `<input>` with placeholder containing "Search"; filters opportunities by title+description substring (case-insensitive).
- "Connect PM tool" `<button>` opens a picker of `PM_TOOLS` (`<button>`s labeled `Jira`/`Linear`/`Asana`); selecting sets integration state + `persistPmIntegration`.
- When connected, each opportunity's action button reads `Add to {Tool}`; clicking adds the id to an in-memory `Set` and the button then reads `Added ✓` (label matched by `/added/i`).
- In `editing`, each `PmDraggableWidget` shows a Remove control with an accessible name matching `/remove/i` (use `title="Remove widget"` + `aria-label`), and a Drag handle. Removing calls `props.onRemove(id)`.
- Span-aware grid: `grid grid-cols-2 gap-4`; `full`-span widgets use `col-span-2`. `pm-kpis` and `pm-feed` are `full`; `pm-spotlight` and `pm-lifecycle` are `half`.

Date preset default = "Last 30 days"; dropdown offers 30/60/90; filter compares `firstSeen >= PM_NOW - days*DAY`. "All filters" popover uses the outside-click scrim pattern from `AddWidgetMenu` (a fixed inset-0 click-catcher). "View in Jira"/"Generate fix" buttons render but are no-ops.

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run src/features/home/PmDashboard.test.tsx && npx tsc --noEmit`
Expected: PASS, 0 type errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/PmDashboard.tsx src/features/home/PmDashboard.test.tsx
git commit -m "feat: PM dashboard UI (KPIs, spotlight, lifecycle, feed, connect flow)"
```

---

### Task 6: Wire PM into the Generate panel + HomeScreen

**Files:**
- Modify: `src/features/home/GenerateHomePanel.tsx`
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/features/home/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces: no new exports; behavioral wiring.

**GenerateHomePanel changes:**
- When `role === 'pm'`, generation ignores focus areas: `canGenerate = role !== null && (role === 'pm' || focuses.length > 0)`.
- `handleGenerate` emits a PM NewView when `role === 'pm'`:

```ts
const handleGenerate = () => {
  if (!role) return
  if (role === 'pm') {
    onGenerate({ name: 'Product manager', kind: 'pm', role: 'pm', pmLayout: [...DEFAULT_PM_LAYOUT] })
    return
  }
  if (focuses.length === 0) return
  const label = ROLES.find((r) => r.key === role)?.label ?? 'Generated'
  onGenerate({ name: label, kind: 'grid', role, layout: generateLayout({ role, focuses, prompt }) })
}
```

Import `DEFAULT_PM_LAYOUT` from `./generate-layout`. When `role === 'pm'`, optionally hide/disable the focus-area section (show a short note "The PM dashboard uses a fixed starter layout"). Keep it simple: render the focus chips but they're ignored for pm; the note is a nicety, not required by tests.

**HomeScreen changes:**
- After computing `activeView`, branch rendering:
  - Compute `activeKind = previewView ? (previewView.kind ?? 'grid') : activeView.kind`.
  - For the PM path, the active view carries `pmLayout`; the preview PM view also carries `pmLayout`. Derive `activePmLayout = previewView?.kind === 'pm' ? previewView.pmLayout : (activeView.kind === 'pm' ? activeView.pmLayout : DEFAULT_PM_LAYOUT)`.
- Grid-only computations (`used`, `available`, `data`) must not run against a PM view. Guard: only compute `data`/grid layout when `activeKind === 'grid'`. Since `deriveRoleData` is now total (returns base for pm), `data` is harmless, but the two-column render must be replaced by `<PmDashboard/>` when PM.
- Header controls:
  - Keep ViewSwitcher / Generate / Customize as-is.
  - In edit mode: the grid path shows `AddWidgetMenu` (grid available) + Reset + Done. The PM path shows a PM add menu (missing PM widgets) + Reset (calls `resetPmLayout`) + Done. Implement a tiny `PmAddWidgetMenu` inline in HomeScreen (mirror `AddWidgetMenu`, listing `PM_WIDGET_ID_LIST` minus present, labels from a local title map) OR reuse a generic menu. Simplest: inline a menu that lists missing PM widget titles.
- PM edit handlers wired to the store:

```ts
const movePm = (fromIndex: number, toIndex: number) =>
  setViewsState((prev) => movePmWidget(prev, fromIndex, toIndex))
const removePm = (id: PmWidgetId) =>
  setViewsState((prev) => removePmWidget(prev, id))
const addPm = (id: PmWidgetId) =>
  setViewsState((prev) => addPmWidget(prev, id))
const resetPm = () => setViewsState((prev) => resetPmLayout(prev))
```

- Body render:

```tsx
{activeKind === 'pm' ? (
  <PmDashboard
    pmLayout={activePmLayout}
    editing={editing}
    onMove={movePm}
    onRemove={removePm}
  />
) : (
  <div className="grid grid-cols-[1fr_360px] items-start gap-4">
    {renderColumn('left')}
    {renderColumn('right')}
  </div>
)}
```

- The greeting title: keep "Good morning, Alex" for both kinds (or, nicety: when PM active and not editing, still fine). No test requires a different greeting.
- The PM add menu + Reset must appear only when `editing && activeKind === 'pm'`; the grid AddWidgetMenu only when `editing && activeKind === 'grid'`.

**HomeScreen.test.tsx additions (append to the `HomeScreen — dashboard views` describe):**

```tsx
it('generating with the Product manager role creates a PM view that renders the PM dashboard', async () => {
  const user = userEvent.setup()
  render(<HomeScreen />)
  await user.click(screen.getByRole('button', { name: /generate/i }))
  const panel = screen.getByTestId('generate-home-panel')
  await user.click(within(panel).getByRole('button', { name: /product manager/i }))
  // PM needs no focus area — generate is enabled immediately.
  await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
  await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
  // The PM dashboard surface is now shown, and the switcher names it.
  expect(screen.getByTestId('screen-pm')).toBeInTheDocument()
  expect(screen.getByTestId('view-switcher')).toHaveTextContent('Product manager')
  expect(within(screen.getByTestId('screen-pm')).getByText('ARR at risk')).toBeInTheDocument()
})

it('switching from a PM view back to Default restores the grid dashboard', async () => {
  const user = userEvent.setup()
  render(<HomeScreen />)
  await user.click(screen.getByRole('button', { name: /generate/i }))
  const panel = screen.getByTestId('generate-home-panel')
  await user.click(within(panel).getByRole('button', { name: /product manager/i }))
  await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
  await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
  expect(screen.getByTestId('screen-pm')).toBeInTheDocument()
  // Switch back to Default.
  await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /product manager/i }))
  await user.click(screen.getByRole('button', { name: /^Default$/ }))
  expect(screen.queryByTestId('screen-pm')).not.toBeInTheDocument()
  expect(screen.getByText('Overall agent health')).toBeInTheDocument()
})
```

- [ ] **Step 1: Write the failing tests**

Add the two tests above to `HomeScreen.test.tsx`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/home/HomeScreen.test.tsx`
Expected: FAIL — PM role button not present / `screen-pm` not rendered.

- [ ] **Step 3: Implement the panel + screen wiring**

Apply the GenerateHomePanel and HomeScreen changes described above. Import in HomeScreen:

```ts
import { PmDashboard } from './PmDashboard'
import {
  movePmWidget, removePmWidget, addPmWidget, resetPmLayout,
} from './views-store'
import { DEFAULT_PM_LAYOUT, PM_WIDGET_ID_LIST, type PmWidgetId } from './generate-layout'
```

Add a local PM widget title map for the add menu:

```ts
const PM_WIDGET_TITLE: Record<PmWidgetId, string> = {
  'pm-kpis': 'KPI summary',
  'pm-spotlight': 'Spotlight',
  'pm-lifecycle': 'Lifecycle',
  'pm-feed': 'Opportunity feed',
}
```

- [ ] **Step 4: Run the full suite + typecheck + build**

Run: `npx vitest run && npx tsc --noEmit`
Expected: ALL tests pass (existing + new), 0 type errors.

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/GenerateHomePanel.tsx src/features/home/HomeScreen.tsx src/features/home/HomeScreen.test.tsx
git commit -m "feat: wire PM role through Generate panel and HomeScreen"
```

---

## Self-Review

**Spec coverage:**
- PM role in Generate panel → Task 1 (role) + Task 6 (panel). ✓
- ARR at risk / ARR asking / Impact / Lifecycle → Task 2 data + Task 5 UI. ✓
- Connect to Jira/PM tool (mock + state) → Task 3 store + Task 5 flow. ✓
- Customizable (drag/remove/add) → Task 4 reducers + Task 5 DnD + Task 6 wiring. ✓
- Everything interactive (spotlight tabs, search, date, filters, list/grid) → Task 5. ✓
- Saved/switchable/renamable via existing ViewSwitcher → Task 4 union keeps ViewSwitcher working (it reads `name`/`builtIn` only). ✓
- Backward compat (legacy no-`kind` views) → Task 4 sanitizer. ✓

**Placeholder scan:** none — every code step has concrete code; the date-picker deviation and the "Added not persisted" are explicit scope decisions from the spec.

**Type consistency:** `PmWidgetId`, `DEFAULT_PM_LAYOUT`, `PM_WIDGET_ID_LIST` defined once in `generate-layout.ts` and imported everywhere. `NewView` is a union; `addView`/panel/HomeScreen all construct the correct arm. `DashboardView` union guarded by `kind` in every reducer. `Role` includes `'pm'`; `GridRole` excludes it and is used by `role-data.ts` and `ROLE_BASELINE`.

**Every task leaves the tree green:** Task 1 changes `Role` AND retypes `role-data.ts` in the same task, so `tsc` is clean at every task boundary. No task depends on a later task to compile.

## Execution Handoff

Recommended: **Subagent-Driven** (fresh subagent per task, review between tasks), in an **isolated worktree** off `main`.
