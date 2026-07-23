# Log Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/log` "Coming soon" placeholder with a full Log screen with two tabs — Audit (default) and Error — both populated with mock data and inert controls.

**Architecture:** A single feature folder `src/features/log/` following the existing `ToolsScreen` pattern: a white rounded content card with a title + local-state tab strip, each tab rendering a dedicated view component (`AuditView` / `ErrorView`) built from a toolbar + bordered-grid table. All data is mocked in `log-data.ts`; all controls are presentational. Route is wired in `routes.tsx` by adding `/log` to the `BUILT` set.

**Tech Stack:** React 19, React Router v7, TypeScript (strict), Tailwind v4, lucide-react icons, Vitest + React Testing Library.

## Global Constraints

- **Path alias:** `@` → `src/`. Do NOT add `baseUrl` to `tsconfig.json`.
- **TypeScript strict mode** — keep all new code fully typed.
- **No `Date.now()` / `new Date()` / `Math.random()`** — timestamps are hard-coded display strings; ids are literal.
- **Tokens:** use semantic classes (`text-ink`, `text-ink-muted`, `text-grey-500`, `text-grey-700`, `border-surface-border`, `bg-white`). Badge/severity tints and one-off surface tints (`#fbfbfb`, `#01567a`) inline per the CLAUDE.md one-off convention. No `font-['SF_Pro_*']` classes.
- **Icons:** `lucide-react` only.
- **Tests:** Vitest + RTL, colocated. Scope page-wide assertions with `within(getByTestId('screen-log'))`. Run tests with `--exclude '**/.claude/**'` to avoid sibling-worktree crawl.
- **Test runner:** `pnpm` is not on PATH in this worktree; use `npx --yes pnpm@latest exec vitest run ...` (or `npx vitest run`).

---

## File Structure

- Create: `src/features/log/log-data.ts` — types + mock rows + tab list.
- Create: `src/features/log/log-data.test.ts` — data sanity tests.
- Create: `src/features/log/SeverityBadge.tsx` — severity → colored badge.
- Create: `src/features/log/AuditToolbar.tsx` — inert audit toolbar.
- Create: `src/features/log/AuditTable.tsx` — audit bordered-grid table.
- Create: `src/features/log/AuditView.tsx` — audit sub-header + toolbar + table.
- Create: `src/features/log/ErrorOverview.tsx` — 4 stat cards.
- Create: `src/features/log/ErrorToolbar.tsx` — inert error toolbar.
- Create: `src/features/log/ErrorTable.tsx` — error bordered-grid table.
- Create: `src/features/log/ErrorView.tsx` — error sub-header + overview + toolbar + table.
- Create: `src/features/log/LogScreen.tsx` — tab shell.
- Create: `src/features/log/LogScreen.test.tsx` — tab-shell behavior tests.
- Create: `src/features/log/log.routes.test.tsx` — routing + nav tests.
- Modify: `src/routes.tsx` — import `LogScreen`, add `/log` to `BUILT`, add route child.

---

## Task 1: Data module (`log-data.ts`)

**Files:**
- Create: `src/features/log/log-data.ts`
- Test: `src/features/log/log-data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type LogTab = 'Audit' | 'Error'`
  - `const LOG_TABS: LogTab[]`
  - `type AuditEntry = { id: string; timestamp: string; product: string; action: string; userEmail: string }`
  - `type Severity = 'High' | 'Medium' | 'Low'`
  - `type ErrorEntry = { id: string; timestamp: string; product: string; channel: string; conversationId: string; message: string; severity: Severity }`
  - `const AUDIT_ENTRIES: AuditEntry[]`
  - `const ERROR_ENTRIES: ErrorEntry[]`

- [ ] **Step 1: Write the failing test**

Create `src/features/log/log-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { LOG_TABS, AUDIT_ENTRIES, ERROR_ENTRIES } from './log-data'

describe('log-data', () => {
  it('exposes both tabs in order', () => {
    expect(LOG_TABS).toEqual(['Audit', 'Error'])
  })

  it('has non-empty audit and error entries with unique ids', () => {
    expect(AUDIT_ENTRIES.length).toBeGreaterThan(0)
    expect(ERROR_ENTRIES.length).toBeGreaterThan(0)
    const auditIds = AUDIT_ENTRIES.map((e) => e.id)
    const errorIds = ERROR_ENTRIES.map((e) => e.id)
    expect(new Set(auditIds).size).toBe(auditIds.length)
    expect(new Set(errorIds).size).toBe(errorIds.length)
  })

  it('only uses allowed severities', () => {
    const allowed = new Set(['High', 'Medium', 'Low'])
    for (const e of ERROR_ENTRIES) expect(allowed.has(e.severity)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --yes pnpm@latest exec vitest run src/features/log/log-data.test.ts --exclude '**/.claude/**'`
Expected: FAIL — cannot resolve `./log-data`.

- [ ] **Step 3: Write the data module**

Create `src/features/log/log-data.ts`:

```ts
// Mock data for the Log screen (Audit + Error tabs). All presentational — no
// backend. Timestamps are pre-formatted display strings (no Date usage here).
export type LogTab = 'Audit' | 'Error'
export const LOG_TABS: LogTab[] = ['Audit', 'Error']

export type AuditEntry = {
  id: string
  timestamp: string
  product: string
  action: string
  userEmail: string
}

export type Severity = 'High' | 'Medium' | 'Low'

export type ErrorEntry = {
  id: string
  timestamp: string
  product: string
  channel: string
  conversationId: string
  message: string
  severity: Severity
}

export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a1', timestamp: 'Jul 21, 2026, 1:39 PM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a2', timestamp: 'Jul 21, 2026, 1:38 PM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a3', timestamp: 'Jul 21, 2026, 1:37 PM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a4', timestamp: 'Jul 21, 2026, 1:36 PM', product: 'Solve', action: 'intent-deleted', userEmail: 'Forethought User' },
  { id: 'a5', timestamp: 'Jul 21, 2026, 1:17 PM', product: 'Solve', action: 'intent-deleted', userEmail: 'Forethought User' },
  { id: 'a6', timestamp: 'Jul 21, 2026, 11:38 AM', product: 'Solve', action: 'workflow-draft-discarded', userEmail: 'Forethought User' },
  { id: 'a7', timestamp: 'Jul 21, 2026, 11:37 AM', product: 'Solve', action: 'workflow-draft-discarded', userEmail: 'Forethought User' },
  { id: 'a8', timestamp: 'Jul 21, 2026, 10:51 AM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a9', timestamp: 'Jul 21, 2026, 10:40 AM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a10', timestamp: 'Jul 21, 2026, 8:48 AM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a11', timestamp: 'Jul 20, 2026, 4:22 PM', product: 'Solve', action: 'intent-deleted', userEmail: 'Forethought User' },
  { id: 'a12', timestamp: 'Jul 20, 2026, 2:05 PM', product: 'Solve', action: 'workflow-draft-discarded', userEmail: 'Forethought User' },
]

const CONV_ID = 'e61f7ebd-2624-4c71-8225-bb3f0abc136c'

export const ERROR_ENTRIES: ErrorEntry[] = [
  { id: 'e1', timestamp: 'Jun 25, 2026, 9:41 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Context Variable name not found in decoded JWT', severity: 'Medium' },
  { id: 'e2', timestamp: 'Jun 25, 2026, 9:41 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Failed to decode JWT', severity: 'Medium' },
  { id: 'e3', timestamp: 'Jun 25, 2026, 8:55 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Context Variable name not found in decoded JWT', severity: 'Medium' },
  { id: 'e4', timestamp: 'Jun 25, 2026, 8:55 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Failed to decode JWT', severity: 'Medium' },
  { id: 'e5', timestamp: 'Jun 25, 2026, 7:12 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Upstream tool call timed out', severity: 'High' },
  { id: 'e6', timestamp: 'Jun 24, 2026, 6:03 PM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Retry succeeded after transient failure', severity: 'Low' },
  { id: 'e7', timestamp: 'Jun 24, 2026, 5:40 PM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Failed to decode JWT', severity: 'Medium' },
  { id: 'e8', timestamp: 'Jun 24, 2026, 3:18 PM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Rate limit exceeded on knowledge lookup', severity: 'High' },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --yes pnpm@latest exec vitest run src/features/log/log-data.test.ts --exclude '**/.claude/**'`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/log/log-data.ts src/features/log/log-data.test.ts
git commit -m "feat(log): add Log screen mock data module"
```

---

## Task 2: SeverityBadge

**Files:**
- Create: `src/features/log/SeverityBadge.tsx`

**Interfaces:**
- Consumes: `Severity` from `./log-data`.
- Produces: `function SeverityBadge({ severity }: { severity: Severity }): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/features/log/SeverityBadge.tsx`:

```tsx
// Colored rounded-rect badge for an error severity. Colors have no exact theme
// token — inline per the CLAUDE.md one-off convention. High = red, Medium =
// amber (dark text), Low = blue.
import type { Severity } from './log-data'

const STYLES: Record<Severity, { bg: string; fg: string }> = {
  High: { bg: '#d64535', fg: '#ffffff' },
  Medium: { bg: '#e8a33d', fg: '#3d2b00' },
  Low: { bg: '#3492ef', fg: '#ffffff' },
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { bg, fg } = STYLES[severity]
  return (
    <span
      className="inline-flex rounded-[6px] px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {severity}
    </span>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS (no errors). (Behavior is covered indirectly by the ErrorTable render test in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/features/log/SeverityBadge.tsx
git commit -m "feat(log): add SeverityBadge component"
```

---

## Task 3: AuditToolbar

**Files:**
- Create: `src/features/log/AuditToolbar.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `function AuditToolbar(): JSX.Element` (all controls inert).

- [ ] **Step 1: Write the component**

Create `src/features/log/AuditToolbar.tsx`:

```tsx
// Inert toolbar for the Audit tab: search-by-user-email, a "Last 30 days" date
// dropdown, a "Filter by" dropdown, and right-aligned columns/rows icon buttons.
// Styled after ToolsToolbar. No backend.
import { Calendar, ChevronDown, Columns3, ListFilter, Menu, Search } from 'lucide-react'

export function AuditToolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-[20px] border border-surface-border bg-white px-3 py-1.5">
          <Search size={16} className="text-ink-muted" aria-hidden />
          <input
            type="text"
            placeholder="Search by user email"
            className="w-48 bg-transparent text-[12px] text-ink outline-none placeholder:text-grey-500"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <Calendar size={15} className="text-ink-muted" aria-hidden />
          Last 30 days
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <ListFilter size={15} className="text-ink-muted" aria-hidden />
          Filter by
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2 text-ink-muted">
        <button type="button" aria-label="Choose columns"><Columns3 size={18} aria-hidden /></button>
        <button type="button" aria-label="Row density"><Menu size={18} aria-hidden /></button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/log/AuditToolbar.tsx
git commit -m "feat(log): add AuditToolbar"
```

---

## Task 4: AuditTable

**Files:**
- Create: `src/features/log/AuditTable.tsx`

**Interfaces:**
- Consumes: `AUDIT_ENTRIES` from `./log-data`.
- Produces: `function AuditTable(): JSX.Element`. Rows carry `data-testid="audit-row-<id>"`.

- [ ] **Step 1: Write the component**

Create `src/features/log/AuditTable.tsx`:

```tsx
// Audit tab table. Columns: Timestamp (active desc sort) · Product · Action ·
// User email. A fixed grid template is shared by the header and every row so
// dividers line up (pattern from ToolsTable). All sort carets are inert.
import { ArrowDown, ArrowUpDown } from 'lucide-react'
import { AUDIT_ENTRIES } from './log-data'

const COLS = 'grid-cols-[minmax(220px,1fr)_minmax(140px,0.6fr)_minmax(260px,1fr)_minmax(200px,0.8fr)]'

function HeaderCell({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-1 border-r border-surface-border px-3.5 py-3 text-[12px] font-semibold text-grey-700 last:border-r-0">
      {label}
      {active ? (
        <ArrowDown size={13} className="text-ink-muted" aria-hidden />
      ) : (
        <ArrowUpDown size={13} className="text-ink-muted" aria-hidden />
      )}
    </div>
  )
}

export function AuditTable() {
  return (
    <div className="overflow-hidden rounded-t-[20px] border border-surface-border">
      <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
        <HeaderCell label="Timestamp" active />
        <HeaderCell label="Product" />
        <HeaderCell label="Action" />
        <HeaderCell label="User email" />
      </div>
      {AUDIT_ENTRIES.map((e) => (
        <div
          key={e.id}
          data-testid={`audit-row-${e.id}`}
          className={`grid ${COLS} border-b border-surface-border last:border-b-0`}
        >
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.timestamp}</div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.product}</div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.action}</div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.userEmail}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/log/AuditTable.tsx
git commit -m "feat(log): add AuditTable"
```

---

## Task 5: AuditView

**Files:**
- Create: `src/features/log/AuditView.tsx`

**Interfaces:**
- Consumes: `AuditToolbar`, `AuditTable`.
- Produces: `function AuditView(): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/features/log/AuditView.tsx`:

```tsx
// Audit tab body: sub-header (description + "Updated hourly") then the toolbar
// and table.
import { AuditToolbar } from './AuditToolbar'
import { AuditTable } from './AuditTable'

export function AuditView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-grey-700">See the history of changes made within this account.</p>
        <span className="text-[13px] text-ink-muted">Updated hourly</span>
      </div>
      <AuditToolbar />
      <AuditTable />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/log/AuditView.tsx
git commit -m "feat(log): add AuditView"
```

---

## Task 6: ErrorOverview

**Files:**
- Create: `src/features/log/ErrorOverview.tsx`

**Interfaces:**
- Consumes: `SeverityBadge`, `Severity` from `./log-data`.
- Produces: `function ErrorOverview(): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/features/log/ErrorOverview.tsx`:

```tsx
// Error tab overview: four equal bordered cards. Card 1 is "New errors" (info
// glyph); cards 2-4 are labeled by a severity badge. Values are "n/a" per the
// design — no fabricated metrics.
import { Info } from 'lucide-react'
import { SeverityBadge } from './SeverityBadge'
import type { Severity } from './log-data'

const SEVERITIES: Severity[] = ['High', 'Medium', 'Low']

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6 rounded-[16px] border border-surface-border px-5 py-4">
      {children}
      <span className="text-[40px] leading-none text-grey-400">n/a</span>
    </div>
  )
}

export function ErrorOverview() {
  return (
    <div className="flex items-stretch gap-4">
      <Card>
        <span className="flex items-center gap-1.5 text-[14px] text-grey-700">
          New errors
          <Info size={14} className="text-ink-muted" aria-hidden />
        </span>
      </Card>
      {SEVERITIES.map((s) => (
        <Card key={s}>
          <span><SeverityBadge severity={s} /></span>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/log/ErrorOverview.tsx
git commit -m "feat(log): add ErrorOverview stat cards"
```

---

## Task 7: ErrorToolbar

**Files:**
- Create: `src/features/log/ErrorToolbar.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `function ErrorToolbar(): JSX.Element` (all controls inert).

- [ ] **Step 1: Write the component**

Create `src/features/log/ErrorToolbar.tsx`:

```tsx
// Inert toolbar for the Error tab: a "Conversation ID" field selector adjoined
// to a keyword search, a "Filter by" dropdown, a "Show muted alerts" button,
// then right-aligned "Alert management" + columns/rows icon buttons.
import { Bell, BellOff, ChevronDown, Columns3, ListFilter, Menu, Search } from 'lucide-react'

export function ErrorToolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-[20px] border border-surface-border bg-white">
          <button type="button" className="flex items-center gap-1 border-r border-surface-border px-3 py-1.5 text-[12px] font-medium text-black">
            Conversation ID
            <ChevronDown size={14} className="text-ink-muted" aria-hidden />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Search size={16} className="text-ink-muted" aria-hidden />
            <input
              type="text"
              placeholder="Enter keyword"
              className="w-40 bg-transparent text-[12px] text-ink outline-none placeholder:text-grey-500"
            />
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <ListFilter size={15} className="text-ink-muted" aria-hidden />
          Filter by
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <BellOff size={15} className="text-ink-muted" aria-hidden />
          Show muted alerts
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] px-3 py-1.5 text-[12px] font-medium text-ink"
          style={{ backgroundColor: '#eaf1f4' }}
        >
          <Bell size={15} className="text-ink-muted" aria-hidden />
          Alert management
        </button>
        <div className="flex items-center gap-2 text-ink-muted">
          <button type="button" aria-label="Choose columns"><Columns3 size={18} aria-hidden /></button>
          <button type="button" aria-label="Row density"><Menu size={18} aria-hidden /></button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/log/ErrorToolbar.tsx
git commit -m "feat(log): add ErrorToolbar"
```

---

## Task 8: ErrorTable

**Files:**
- Create: `src/features/log/ErrorTable.tsx`

**Interfaces:**
- Consumes: `ERROR_ENTRIES` from `./log-data`, `SeverityBadge`.
- Produces: `function ErrorTable(): JSX.Element`. Rows carry `data-testid="error-row-<id>"`.

- [ ] **Step 1: Write the component**

Create `src/features/log/ErrorTable.tsx`:

```tsx
// Error tab table. Columns: Timestamp (active desc sort) · Product · Channel ·
// Conversation Id · Error Message · Severity. Fixed shared grid template; wide
// content scrolls horizontally. All sort carets inert.
import { ArrowDown, ArrowUpDown } from 'lucide-react'
import { ERROR_ENTRIES } from './log-data'
import { SeverityBadge } from './SeverityBadge'

const COLS = 'grid-cols-[minmax(170px,0.8fr)_minmax(100px,0.5fr)_minmax(110px,0.5fr)_minmax(320px,1.2fr)_minmax(280px,1.2fr)_minmax(110px,0.5fr)]'

function HeaderCell({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-1 border-r border-surface-border px-3.5 py-3 text-[12px] font-semibold text-grey-700 last:border-r-0">
      {label}
      {active ? (
        <ArrowDown size={13} className="text-ink-muted" aria-hidden />
      ) : (
        <ArrowUpDown size={13} className="text-ink-muted" aria-hidden />
      )}
    </div>
  )
}

export function ErrorTable() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1100px] overflow-hidden rounded-t-[20px] border border-surface-border">
        <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
          <HeaderCell label="Timestamp" active />
          <HeaderCell label="Product" />
          <HeaderCell label="Channel" />
          <HeaderCell label="Conversation Id" />
          <HeaderCell label="Error Message" />
          <HeaderCell label="Severity" />
        </div>
        {ERROR_ENTRIES.map((e) => (
          <div
            key={e.id}
            data-testid={`error-row-${e.id}`}
            className={`grid ${COLS} border-b border-surface-border last:border-b-0`}
          >
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.timestamp}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.product}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.channel}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.conversationId}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.message}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 last:border-r-0"><SeverityBadge severity={e.severity} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/log/ErrorTable.tsx
git commit -m "feat(log): add ErrorTable"
```

---

## Task 9: ErrorView

**Files:**
- Create: `src/features/log/ErrorView.tsx`

**Interfaces:**
- Consumes: `ErrorOverview`, `ErrorToolbar`, `ErrorTable`.
- Produces: `function ErrorView(): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/features/log/ErrorView.tsx`:

```tsx
// Error tab body: sub-header ("Errors overview" + "Last 24 hours" / retention
// note), the overview cards, then the toolbar and table.
import { ErrorOverview } from './ErrorOverview'
import { ErrorToolbar } from './ErrorToolbar'
import { ErrorTable } from './ErrorTable'

export function ErrorView() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[20px] text-ink">
          Errors overview <span className="text-grey-500">Last 24 hours</span>
        </h2>
        <span className="text-[13px] text-ink-muted">Error logs are stored for 30 days.</span>
      </div>
      <ErrorOverview />
      <div className="flex flex-col gap-4">
        <ErrorToolbar />
        <ErrorTable />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/log/ErrorView.tsx
git commit -m "feat(log): add ErrorView"
```

---

## Task 10: LogScreen shell + behavior tests

**Files:**
- Create: `src/features/log/LogScreen.tsx`
- Test: `src/features/log/LogScreen.test.tsx`

**Interfaces:**
- Consumes: `LOG_TABS`, `LogTab` from `./log-data`; `AuditView`, `ErrorView`.
- Produces: `function LogScreen(): JSX.Element`. Root has `data-testid="screen-log"`.

- [ ] **Step 1: Write the failing test**

Create `src/features/log/LogScreen.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogScreen } from './LogScreen'

describe('LogScreen', () => {
  it('renders the Log title and the Audit tab by default', () => {
    render(<LogScreen />)
    const el = screen.getByTestId('screen-log')
    expect(within(el).getByRole('heading', { name: 'Log' })).toBeInTheDocument()
    expect(within(el).getByRole('tab', { name: 'Audit' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).getByText('See the history of changes made within this account.')).toBeInTheDocument()
    expect(within(el).getByText('User email')).toBeInTheDocument()
  })

  it('switches to the Error tab and shows the error table', async () => {
    const user = userEvent.setup()
    render(<LogScreen />)
    const el = screen.getByTestId('screen-log')
    await user.click(within(el).getByRole('tab', { name: 'Error' }))
    expect(within(el).getByRole('tab', { name: 'Error' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).queryByText('User email')).toBeNull()
    expect(within(el).getByText('Errors overview')).toBeInTheDocument()
    expect(within(el).getByText('Error Message')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --yes pnpm@latest exec vitest run src/features/log/LogScreen.test.tsx --exclude '**/.claude/**'`
Expected: FAIL — cannot resolve `./LogScreen`.

- [ ] **Step 3: Write the component**

Create `src/features/log/LogScreen.tsx`:

```tsx
// Log surface: title + a tab strip (Audit / Error) and the active tab body. Tab
// switching is the only live interaction (local state), mirroring ToolsScreen.
// No backend.
import { useState } from 'react'
import { LOG_TABS, type LogTab } from './log-data'
import { AuditView } from './AuditView'
import { ErrorView } from './ErrorView'

export function LogScreen() {
  const [tab, setTab] = useState<LogTab>('Audit')

  return (
    <div
      data-testid="screen-log"
      className="h-full overflow-y-auto rounded-[26px] bg-white px-10 py-4"
    >
      <div className="flex items-center gap-6">
        <h1 className="text-[22px] text-ink">Log</h1>
        <div className="h-7 w-px bg-surface-border" aria-hidden />
        <div className="flex items-center gap-2" role="tablist">
          {LOG_TABS.map((t) => {
            const active = t === tab
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className={
                  active
                    ? '-mb-px border-b border-[#01567a] px-4 pb-2.5 pt-3 text-[22px] text-ink'
                    : 'px-4 pb-2.5 pt-3 text-[22px] text-grey-500'
                }
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">{tab === 'Audit' ? <AuditView /> : <ErrorView />}</div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --yes pnpm@latest exec vitest run src/features/log/LogScreen.test.tsx --exclude '**/.claude/**'`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/log/LogScreen.tsx src/features/log/LogScreen.test.tsx
git commit -m "feat(log): add LogScreen tab shell"
```

---

## Task 11: Wire the route

**Files:**
- Modify: `src/routes.tsx`
- Test: `src/features/log/log.routes.test.tsx`

**Interfaces:**
- Consumes: `LogScreen`; the existing `routes` table and `BUILT` set.
- Produces: a live `/log` route rendering `screen-log`.

- [ ] **Step 1: Write the failing test**

Create `src/features/log/log.routes.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { findNavItemByPath } from '@/app/nav-config'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('Log routing', () => {
  it('renders the Log screen at /log', () => {
    renderAt('/log')
    expect(screen.getByTestId('screen-log')).toBeInTheDocument()
  })

  it('does not render the placeholder at /log', () => {
    renderAt('/log')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('resolves /log to the Log nav item', () => {
    expect(findNavItemByPath('/log')?.label).toBe('Log')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx --yes pnpm@latest exec vitest run src/features/log/log.routes.test.tsx --exclude '**/.claude/**'`
Expected: FAIL — `/log` renders the PlaceholderScreen ("Coming soon"), so `screen-log` is not found.

- [ ] **Step 3: Modify `src/routes.tsx`**

Add the import alongside the other feature-screen imports (after the `ToolDetailScreen` import on line 19):

```tsx
import { LogScreen } from '@/features/log/LogScreen'
```

Add `/log` to the `BUILT` set (line 23):

```tsx
const BUILT = new Set(['/', '/insights', '/organization', '/ai-agents', '/orchestrator', '/tools', '/log'])
```

Add the route child alongside the other top-level children (after the `tools/:id` route on line 62):

```tsx
          { path: 'log', element: <LogScreen /> },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx --yes pnpm@latest exec vitest run src/features/log/log.routes.test.tsx --exclude '**/.claude/**'`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/routes.tsx src/features/log/log.routes.test.tsx
git commit -m "feat(log): wire /log route to LogScreen"
```

---

## Task 12: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Typecheck the whole project**

Run: `npx --yes pnpm@latest exec tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 2: Run the full test suite**

Run: `npx --yes pnpm@latest exec vitest run --exclude '**/.claude/**'`
Expected: PASS — all prior tests (415) plus the new Log tests (log-data: 3, LogScreen: 2, log.routes: 3).

- [ ] **Step 3: Build**

Run: `npx --yes pnpm@latest exec vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit any remaining changes**

If nothing is uncommitted, skip. Otherwise:

```bash
git add -A
git commit -m "chore(log): verification pass"
```

---

## Self-Review Notes

- **Spec coverage:** routing (Task 11), `log-data.ts` types + rows (Task 1), `LogScreen` shell (Task 10), Audit toolbar/table/view (Tasks 3–5), Error overview/toolbar/table/view (Tasks 6–9), `SeverityBadge` (Task 2), tests (Tasks 1, 10, 11), styling/tokens (Global Constraints). All spec sections mapped.
- **Type consistency:** `LogTab`, `AuditEntry`, `Severity`, `ErrorEntry` defined in Task 1 and consumed with identical names in Tasks 2, 4, 6, 8, 10. `SeverityBadge` prop `severity` consistent across Tasks 2, 6, 8. testids (`screen-log`, `audit-row-<id>`, `error-row-<id>`) consistent between components and tests.
- **No placeholders:** every code step shows complete code; no TBD/TODO.
