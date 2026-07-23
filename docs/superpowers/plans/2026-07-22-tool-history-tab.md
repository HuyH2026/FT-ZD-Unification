# Tool Builder History Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tool Builder History tab's generic inert placeholder with a real static table (Run date / Name / Type / Channel / Conversation ID / Status), matching Figma node `755:167275`.

**Architecture:** Add a `ToolRun` mock data model + `TOOL_RUNS` array to `tools-data.ts`. Build a new `ToolsHistoryTable.tsx` presentational component (same grid-column structural pattern as `ToolsTable.tsx`) with two small internal components (`ChannelPill`, `RunStatusBadge`). Wire it into `ToolsScreen.tsx` so the History tab renders the real table instead of the shared placeholder.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Vitest + React Testing Library, lucide-react icons.

## Global Constraints

- No backend, no persistence — all data is static mock data in `tools-data.ts`.
- Fully presentational: no sorting, no filtering, no row click-through on the History table.
- Reuse existing tokens/patterns over inventing new ones: `RunStatusBadge`'s "Failed" color uses the existing `var(--destructive)` token (`#d4183d`); "In progress" and "Completed" reuse the exact greys/greens `StateBadge` already uses (`#9194a0`, `#048c80`).
- `ChannelPill` sources its color/icon/display-name from the existing `channelMeta()` helper in `src/lib/channel-meta.ts` — do not add new channel entries there; use only existing keys (`Slack`, `Email`, `Outbound Voice`, `Web Widget`).
- Name-column cell (avatar + title + description) reuses the same visual pattern as `ToolsTable.tsx`'s Name cell, looked up via `TOOL_ACTIONS.find(a => a.id === run.toolId)` — do not duplicate action names/descriptions into new mock strings.
- Icons: `lucide-react` only, matching project convention. No new SVG assets.
- Use semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`, `text-grey-400/500/700`) per CLAUDE.md; one-off inline hex only where no token exists (already true of `StateBadge`'s greens/greys, which this task copies verbatim).
- Tests use `within(getByTestId(...))` scoping per project convention.

---

### Task 1: Add `TOOL_RUNS` mock data model to `tools-data.ts`

**Files:**
- Modify: `src/features/tools/tools-data.ts`
- Test: `src/features/tools/tools-data.test.ts`

**Interfaces:**
- Produces: `RunStatus` type (`'In progress' | 'Completed' | 'Failed'`), `ToolRun` type (`{ id: string; toolId: string; runAt: string; type: ToolType; channel: string; conversationId: string | null; status: RunStatus }`), `TOOL_RUNS: ToolRun[]` (5 entries), `RUN_COUNT: number` (fixed design label, `113`, mirrors the existing `NAME_COUNT` pattern).
- Consumes: existing `ToolType`, `TOOL_ACTIONS` (for `toolId` cross-reference only; not imported by this file).

- [ ] **Step 1: Write the failing test**

Update the existing import line at the top of `src/features/tools/tools-data.test.ts` to:

```ts
import { TOOL_TABS, TOOL_ACTIONS, NAME_COUNT, TOOL_RUNS, RUN_COUNT } from './tools-data'
```

Then append this block at the end of the file:

```ts

describe('tools-data (history)', () => {
  it('defines five history runs, one per existing tool action', () => {
    expect(TOOL_RUNS).toHaveLength(5)
    expect(TOOL_RUNS.map((r) => r.toolId)).toEqual(['t1', 't2', 't3', 't4', 't5'])
  })

  it('every run references a real TOOL_ACTIONS id', () => {
    const actionIds = new Set(TOOL_ACTIONS.map((a) => a.id))
    for (const run of TOOL_RUNS) {
      expect(actionIds.has(run.toolId)).toBe(true)
    }
  })

  it('covers all three run statuses', () => {
    const statuses = TOOL_RUNS.map((r) => r.status)
    expect(statuses).toContain('In progress')
    expect(statuses).toContain('Completed')
    expect(statuses).toContain('Failed')
  })

  it('has a mix of null and real conversation ids', () => {
    expect(TOOL_RUNS.some((r) => r.conversationId === null)).toBe(true)
    expect(TOOL_RUNS.some((r) => typeof r.conversationId === 'string')).toBe(true)
  })

  it('uses a static Run header count of 113', () => {
    expect(RUN_COUNT).toBe(113)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/tools-data.test.ts`
Expected: FAIL — `TOOL_RUNS`/`RUN_COUNT` are not exported yet (`tools-data.ts` has no such exports), so the import itself or the assertions fail.

- [ ] **Step 3: Add the data model**

Append to `src/features/tools/tools-data.ts` (after the existing `TOOL_ACTIONS` array, at the end of the file):

```ts

export type RunStatus = 'In progress' | 'Completed' | 'Failed'

export type ToolRun = {
  id: string
  toolId: string        // cross-references a TOOL_ACTIONS id for name/description/avatar
  runAt: string          // "Jul 20, 2026 3:12 PM"
  type: ToolType
  channel: string        // a key of CHANNEL_META, e.g. "Slack"
  conversationId: string | null
  status: RunStatus
}

// The "Run (113)" header count is a fixed design label, like NAME_COUNT.
export const RUN_COUNT = 113

export const TOOL_RUNS: ToolRun[] = [
  { id: 'r1', toolId: 't1', runAt: 'Jul 20, 2026 3:12 PM', type: 'API', channel: 'Slack', conversationId: 'a1b2c3d4-1111-4a5b-9c3d-000000000001', status: 'In progress' },
  { id: 'r2', toolId: 't2', runAt: 'Jul 19, 2026 11:45 AM', type: 'Imported', channel: 'Outbound Voice', conversationId: 'a1b2c3d4-2222-4a5b-9c3d-000000000002', status: 'Completed' },
  { id: 'r3', toolId: 't3', runAt: 'Jul 18, 2026 9:02 AM', type: 'MCP', channel: 'Email', conversationId: null, status: 'Failed' },
  { id: 'r4', toolId: 't4', runAt: 'Jul 17, 2026 4:30 PM', type: 'Browser', channel: 'Web Widget', conversationId: 'a1b2c3d4-4444-4a5b-9c3d-000000000004', status: 'Completed' },
  { id: 'r5', toolId: 't5', runAt: 'Jul 16, 2026 8:15 AM', type: 'API', channel: 'Slack', conversationId: null, status: 'In progress' },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/tools-data.test.ts`
Expected: PASS (all tests in the file, old and new).

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/tools-data.ts src/features/tools/tools-data.test.ts
git commit -m "feat: add TOOL_RUNS mock data for Tool Builder History tab"
```

---

### Task 2: Build `ToolsHistoryTable` component

**Files:**
- Create: `src/features/tools/ToolsHistoryTable.tsx`
- Test: `src/features/tools/ToolsHistoryTable.test.tsx`

**Interfaces:**
- Consumes: `TOOL_RUNS`, `RUN_COUNT` from `./tools-data` (Task 1); `TOOL_ACTIONS` from `./tools-data`; `channelMeta` from `@/lib/channel-meta`.
- Produces: `export function ToolsHistoryTable(): JSX.Element` — no props, `data-testid="tools-history-table"` on its root element. Consumed by `ToolsScreen.tsx` in Task 3.

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/ToolsHistoryTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ToolsHistoryTable } from './ToolsHistoryTable'
import { TOOL_ACTIONS } from './tools-data'

describe('ToolsHistoryTable', () => {
  it('renders a row for every run, showing the linked action name', () => {
    render(<ToolsHistoryTable />)
    const table = screen.getByTestId('tools-history-table')
    expect(within(table).getByText(TOOL_ACTIONS[0].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[1].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[2].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[3].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[4].name)).toBeInTheDocument()
  })

  it('shows the static Run (113) header count', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getByText('Run (113)')).toBeInTheDocument()
  })

  it('renders all three status badges with the expected counts', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getAllByText('In progress')).toHaveLength(2)
    expect(screen.getAllByText('Completed')).toHaveLength(2)
    expect(screen.getAllByText('Failed')).toHaveLength(1)
  })

  it('renders channel pill labels', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getAllByText('Slack')).toHaveLength(2)
    expect(screen.getByText('Outbound Voice')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Widget')).toBeInTheDocument()
  })

  it('renders "n/a" for runs with a null conversation id', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getAllByText('n/a')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/ToolsHistoryTable.test.tsx`
Expected: FAIL — `./ToolsHistoryTable` does not exist yet.

- [ ] **Step 3: Implement the component**

Create `src/features/tools/ToolsHistoryTable.tsx`:

```tsx
// The History tab's run log. Columns: Run date · Name (looked up from
// TOOL_ACTIONS by toolId, same avatar/title/description cell as ToolsTable)
// · Type · Channel · Conversation ID · Status. Fully presentational — no
// sorting, filtering, or row click-through. Mirrors ToolsTable's fixed
// grid-template-columns approach so header and rows align.
import { ArrowDown, Bolt } from 'lucide-react'
import { channelMeta } from '@/lib/channel-meta'
import { TOOL_ACTIONS, TOOL_RUNS, RUN_COUNT, type RunStatus } from './tools-data'

const COLS = 'grid-cols-[150px_minmax(280px,1.4fr)_100px_160px_220px_120px]'

function RunStatusBadge({ status }: { status: RunStatus }) {
  // Colors reuse StateBadge's existing greys/greens; "Failed" uses the
  // project's --destructive token (no inline hex needed).
  if (status === 'Completed') {
    return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#048c80' }}>Completed</span>
  }
  if (status === 'Failed') {
    return <span className="rounded-xl bg-destructive px-2 py-0.5 text-[11px] font-semibold text-white">Failed</span>
  }
  return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#9194a0' }}>In progress</span>
}

function ChannelPill({ label }: { label: string }) {
  const { display, color, Icon } = channelMeta(label)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-2 py-1">
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <Icon size={9} className="text-white" aria-hidden />
      </span>
      <span className="text-[11px] font-medium text-grey-700">{display}</span>
    </span>
  )
}

function HeaderCell({ label, sortable = true }: { label: string; sortable?: boolean }) {
  return (
    <div className="flex items-center gap-1 border-r border-surface-border px-3.5 py-3 text-[12px] font-semibold text-grey-700 last:border-r-0">
      {label}
      {sortable && <ArrowDown size={13} className="text-ink-muted" aria-hidden />}
    </div>
  )
}

// Avatar mirrors ToolsTable's Avatar exactly (blue for API/live-ish rows,
// slate for imported), duplicated locally since ToolsTable doesn't export it.
function Avatar({ tint }: { tint: 'blue' | 'slate' }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: tint === 'blue' ? '#3492ef' : '#acbdd5' }}
    >
      <Bolt size={15} className="text-white" aria-hidden />
    </span>
  )
}

export function ToolsHistoryTable() {
  return (
    <div data-testid="tools-history-table" className="overflow-hidden rounded-t-[20px] border border-surface-border">
      <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
        <HeaderCell label={`Run (${RUN_COUNT})`} />
        <HeaderCell label="Name" />
        <HeaderCell label="Type" />
        <HeaderCell label="Channel" sortable={false} />
        <HeaderCell label="Conversation ID" sortable={false} />
        <HeaderCell label="Status" />
      </div>

      {TOOL_RUNS.map((run) => {
        const action = TOOL_ACTIONS.find((a) => a.id === run.toolId)
        if (!action) return null
        return (
          <div key={run.id} className={`grid ${COLS} border-b border-surface-border last:border-b-0`}>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
              {run.runAt}
            </div>
            <div className="flex items-center gap-3 border-r border-surface-border px-3.5 py-3 last:border-r-0">
              <Avatar tint={action.iconTint} />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-black">{action.name}</div>
                <div className="truncate text-[12px] text-grey-700">{action.description}</div>
              </div>
            </div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
              {run.type}
            </div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3 last:border-r-0">
              <ChannelPill label={run.channel} />
            </div>
            <div className={`flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] last:border-r-0 ${run.conversationId ? 'text-black' : 'text-grey-400'}`}>
              {run.conversationId ?? 'n/a'}
            </div>
            <div className="flex items-center px-3.5 py-3">
              <RunStatusBadge status={run.status} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/ToolsHistoryTable.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolsHistoryTable.tsx src/features/tools/ToolsHistoryTable.test.tsx
git commit -m "feat: add ToolsHistoryTable for the Tool Builder History tab"
```

---

### Task 3: Wire `ToolsHistoryTable` into `ToolsScreen`

**Files:**
- Modify: `src/features/tools/ToolsScreen.tsx`
- Test: `src/features/tools/ToolsScreen.test.tsx`

**Interfaces:**
- Consumes: `ToolsHistoryTable` from `./ToolsHistoryTable` (Task 2).

- [ ] **Step 1: Write the failing test**

In `src/features/tools/ToolsScreen.test.tsx`, replace the existing `'switches to an empty placeholder tab when clicked'` test with two tests — one for History (now real), one keeping placeholder coverage for the still-inert tabs:

```tsx
  it('switches to the History tab and renders the real history table', async () => {
    const user = userEvent.setup()
    renderToolsScreen()
    const el = screen.getByTestId('screen-tools')
    await user.click(within(el).getByRole('tab', { name: 'History' }))
    expect(within(el).getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).queryByText('Name (113)')).toBeNull()
    expect(within(el).getByTestId('tools-history-table')).toBeInTheDocument()
  })

  it('switches to an empty placeholder tab for Recommended', async () => {
    const user = userEvent.setup()
    renderToolsScreen()
    const el = screen.getByTestId('screen-tools')
    await user.click(within(el).getByRole('tab', { name: 'Recommended' }))
    expect(within(el).getByRole('tab', { name: 'Recommended' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).queryByText('Name (113)')).toBeNull()
    expect(within(el).getByTestId('tools-tab-Recommended')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/ToolsScreen.test.tsx`
Expected: FAIL — the History-tab test fails because `ToolsScreen` still renders the generic `tools-tab-History` placeholder, not `tools-history-table`.

- [ ] **Step 3: Wire the component in**

In `src/features/tools/ToolsScreen.tsx`, add the import:

```tsx
import { ToolsHistoryTable } from './ToolsHistoryTable'
```

Then change the body render logic from:

```tsx
      <div className="mt-6">
        {tab === 'Available' ? (
          <div className="flex flex-col gap-4">
            <ToolsToolbar />
            <ToolsTable onOpen={(id) => navigate(`/tools/${id}`)} />
          </div>
        ) : (
          <div
            data-testid={`tools-tab-${tab}`}
            className="flex h-64 items-center justify-center text-[14px] text-ink-muted"
          >
            {tab}
          </div>
        )}
      </div>
```

to:

```tsx
      <div className="mt-6">
        {tab === 'Available' ? (
          <div className="flex flex-col gap-4">
            <ToolsToolbar />
            <ToolsTable onOpen={(id) => navigate(`/tools/${id}`)} />
          </div>
        ) : tab === 'History' ? (
          <ToolsHistoryTable />
        ) : (
          <div
            data-testid={`tools-tab-${tab}`}
            className="flex h-64 items-center justify-center text-[14px] text-ink-muted"
          >
            {tab}
          </div>
        )}
      </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/ToolsScreen.test.tsx`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run --exclude '**/.claude/**'`
Expected: all tests pass (baseline 415 + this plan's new tests).

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/tools/ToolsScreen.tsx src/features/tools/ToolsScreen.test.tsx
git commit -m "feat: render ToolsHistoryTable on the Tool Builder History tab"
```
