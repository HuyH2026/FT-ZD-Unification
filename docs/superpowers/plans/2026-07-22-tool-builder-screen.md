# Tool Builder Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Coming soon" placeholder at `/tools` with the Tool Builder screen from Figma — a title + tab strip (Available / Recommended / Authentication / History) over a mock tool-actions table.

**Architecture:** A new flat feature under `src/features/tools/`, mirroring `src/features/orchestrator/`. `ToolsScreen` owns the active-tab `useState` (the only live state) and composes presentational children: `ToolsToolbar` and `ToolsTable`. Mock data + types live in `tools-data.ts`. Routing moves `/tools` out of the derived placeholder set into an explicit route, exactly as `/orchestrator` is handled.

**Tech Stack:** React 19, TypeScript (strict), React Router v7, Tailwind v4, lucide-react, Vitest + React Testing Library (jsdom).

## Global Constraints

- **No backend / no persistence.** All data is mocked in `tools-data.ts`.
- **Only tab switching is live.** Search, "Filter by", "Import action", "Create new…", the gear icon, checkboxes, sort carets, and `⋮` menus are all inert (presentational).
- **Nav label stays "Tools"** — do NOT modify `NAV_ITEMS`. Only the screen *title* reads "Tool Builder".
- **Tokens over raw hex** (per CLAUDE.md): use `text-ink`, `text-ink-muted`, `border-surface-border`, and exposed Garden palette classes (`green-500`, `grey-500`, `beige-100`) where a token matches. One-off tints (avatar blue `#3492ef` / slate `#acbdd5`, header `#fbfbfb`) may stay inline.
- **Import from `react-router`** (not `react-router-dom`).
- **Path alias `@` → `src/`.** Do not add `baseUrl` to tsconfig.
- **Gates:** `npx tsc --noEmit` and `npx vitest run` must pass. `pnpm lint` is known-broken (TS7 vs typescript-eslint) — do not rely on it.

---

### Task 1: Mock data model (`tools-data.ts`)

**Files:**
- Create: `src/features/tools/tools-data.ts`
- Test: `src/features/tools/tools-data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ToolTab = 'Available' | 'Recommended' | 'Authentication' | 'History'`
  - `const TOOL_TABS: ToolTab[]`
  - `type ToolType = 'API' | 'Imported' | 'MCP' | 'Browser'`
  - `type ToolState = 'Live' | 'Read only' | 'Auto-saved'`
  - `type ToolAction = { id: string; name: string; description: string; type: ToolType; iconTint: 'blue' | 'slate'; agents: { label: string; extra: number } | null; conversations: number; state: ToolState; lastModified: string }`
  - `const TOOL_ACTIONS: ToolAction[]` (5 rows)
  - `const NAME_COUNT = 113` (static header count)

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/tools-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { TOOL_TABS, TOOL_ACTIONS, NAME_COUNT } from './tools-data'

describe('tools-data', () => {
  it('defines the four tabs in Figma order', () => {
    expect(TOOL_TABS).toEqual(['Available', 'Recommended', 'Authentication', 'History'])
  })

  it('defines the five Figma action rows in order', () => {
    expect(TOOL_ACTIONS.map((a) => a.name)).toEqual([
      'Action name 001', 'Action name 002', 'Action name 003',
      'Action name 004', 'Action name 005',
    ])
  })

  it('matches the Figma-exact type/state/conversations per row', () => {
    expect(TOOL_ACTIONS[0]).toMatchObject({ type: 'API', state: 'Live', conversations: 100, iconTint: 'blue' })
    expect(TOOL_ACTIONS[1]).toMatchObject({ type: 'Imported', state: 'Read only', conversations: 40, iconTint: 'slate' })
    expect(TOOL_ACTIONS[2]).toMatchObject({ type: 'Imported', state: 'Read only', conversations: 1000, iconTint: 'slate' })
    expect(TOOL_ACTIONS[3]).toMatchObject({ type: 'MCP', state: 'Live', conversations: 950, iconTint: 'blue' })
    expect(TOOL_ACTIONS[4]).toMatchObject({ type: 'Browser', state: 'Auto-saved', conversations: 200, iconTint: 'blue' })
  })

  it('gives only the first two rows an agents chip', () => {
    expect(TOOL_ACTIONS[0].agents).toMatchObject({ label: 'Agent name', extra: 5 })
    expect(TOOL_ACTIONS[1].agents).toMatchObject({ label: 'Agent name', extra: 5 })
    expect(TOOL_ACTIONS[2].agents).toBeNull()
    expect(TOOL_ACTIONS[3].agents).toBeNull()
    expect(TOOL_ACTIONS[4].agents).toBeNull()
  })

  it('uses a static Name header count of 113', () => {
    expect(NAME_COUNT).toBe(113)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/tools-data.test.ts`
Expected: FAIL — cannot resolve `./tools-data`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/tools/tools-data.ts`:

```ts
// Mock data + types for the Tool Builder screen. Values are illustrative
// (no backend) and match the Figma frame (node 747:86563) exactly.

export type ToolTab = 'Available' | 'Recommended' | 'Authentication' | 'History'
export const TOOL_TABS: ToolTab[] = ['Available', 'Recommended', 'Authentication', 'History']

export type ToolType = 'API' | 'Imported' | 'MCP' | 'Browser'
export type ToolState = 'Live' | 'Read only' | 'Auto-saved'

export type ToolAction = {
  id: string
  name: string                 // "Action name 001"
  description: string          // "Placeholder for action description"
  type: ToolType
  iconTint: 'blue' | 'slate'   // #3492ef vs #acbdd5 avatar
  agents: { label: string; extra: number } | null  // "Agent name +5" | null → "n/a"
  conversations: number        // 100, 40, 1000, 950, 200
  state: ToolState
  lastModified: string         // "Feb 13, 2024, 12:43 PM"
}

// The "Name (113)" header count is a fixed design label, not TOOL_ACTIONS.length.
export const NAME_COUNT = 113

const DESC = 'Placeholder for action description'
const MODIFIED = 'Feb 13, 2024, 12:43 PM'
const AGENTS = { label: 'Agent name', extra: 5 }

export const TOOL_ACTIONS: ToolAction[] = [
  { id: 't1', name: 'Action name 001', description: DESC, type: 'API', iconTint: 'blue', agents: AGENTS, conversations: 100, state: 'Live', lastModified: MODIFIED },
  { id: 't2', name: 'Action name 002', description: DESC, type: 'Imported', iconTint: 'slate', agents: AGENTS, conversations: 40, state: 'Read only', lastModified: MODIFIED },
  { id: 't3', name: 'Action name 003', description: DESC, type: 'Imported', iconTint: 'slate', agents: null, conversations: 1000, state: 'Read only', lastModified: MODIFIED },
  { id: 't4', name: 'Action name 004', description: DESC, type: 'MCP', iconTint: 'blue', agents: null, conversations: 950, state: 'Live', lastModified: MODIFIED },
  { id: 't5', name: 'Action name 005', description: DESC, type: 'Browser', iconTint: 'blue', agents: null, conversations: 200, state: 'Auto-saved', lastModified: MODIFIED },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/tools-data.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/tools-data.ts src/features/tools/tools-data.test.ts
git commit -m "feat: add Tool Builder mock data model"
```

---

### Task 2: Tool Builder table (`ToolsTable.tsx`)

**Files:**
- Create: `src/features/tools/ToolsTable.tsx`
- Test: `src/features/tools/ToolsTable.test.tsx`

**Interfaces:**
- Consumes: `TOOL_ACTIONS`, `NAME_COUNT`, `type ToolAction`, `type ToolState` from `./tools-data`.
- Produces: `export function ToolsTable(): JSX.Element` — renders all `TOOL_ACTIONS` rows. No props (reads the mock directly, like `TopicsTable`).

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/ToolsTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ToolsTable } from './ToolsTable'
import { TOOL_ACTIONS } from './tools-data'

describe('ToolsTable', () => {
  it('renders a row for every action with its name and type', () => {
    render(<ToolsTable />)
    for (const a of TOOL_ACTIONS) {
      expect(screen.getByText(a.name)).toBeInTheDocument()
    }
    // Type "API" appears once (row 001).
    expect(screen.getByText('API')).toBeInTheDocument()
    expect(screen.getByText('MCP')).toBeInTheDocument()
    expect(screen.getByText('Browser')).toBeInTheDocument()
  })

  it('shows the static Name (113) header count', () => {
    render(<ToolsTable />)
    expect(screen.getByText('Name (113)')).toBeInTheDocument()
  })

  it('renders the state badges', () => {
    render(<ToolsTable />)
    expect(screen.getAllByText('Live')).toHaveLength(2)
    expect(screen.getAllByText('Read only')).toHaveLength(2)
    expect(screen.getByText('Auto-saved')).toBeInTheDocument()
  })

  it('renders "n/a" for rows without agents', () => {
    render(<ToolsTable />)
    // Rows 003, 004, 005 have no agents.
    expect(screen.getAllByText('n/a')).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/ToolsTable.test.tsx`
Expected: FAIL — cannot resolve `./ToolsTable`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/tools/ToolsTable.tsx`:

```tsx
// The Available-tab table. Columns: Name (checkbox + avatar + title/description)
// · Type · Agents in use · Revealed # of conversations · State · Last modified ·
// row actions. Everything is presentational — checkboxes, sort carets, and the
// ⋮ menu are inert. A fixed grid template is shared by the header and every row
// so the vertical dividers line up (pattern from insights TopicsTable).
import { ArrowDown, Bolt, Info, MoreVertical, User } from 'lucide-react'
import { TOOL_ACTIONS, NAME_COUNT, type ToolAction, type ToolState } from './tools-data'

const COLS =
  'grid-cols-[minmax(280px,1.4fr)_100px_150px_200px_120px_160px_56px]'

// State badge styling per Figma: Live = green fill, Read only = bordered
// neutral, Auto-saved = grey fill.
function StateBadge({ state }: { state: ToolState }) {
  if (state === 'Live') {
    // #048c80 has no theme token — inline per the CLAUDE.md one-off convention.
    return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#048c80' }}>Live</span>
  }
  if (state === 'Auto-saved') {
    // #9194a0 has no exact token — inline per the CLAUDE.md one-off convention.
    return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#9194a0' }}>Auto-saved</span>
  }
  return (
    <span className="rounded-xl border border-surface-border px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
      Read only
    </span>
  )
}

// Slate-tinted pill naming the agents in use, with a "+N" suffix.
function AgentsChip({ agents }: { agents: ToolAction['agents'] }) {
  if (!agents) return <span className="text-[13px] text-grey-400">n/a</span>
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[12px] font-medium text-grey-700"
      style={{ backgroundColor: '#f2f4f7' }}  // slate-100, no token
    >
      <User size={13} aria-hidden />
      {agents.label} +{agents.extra}
    </span>
  )
}

// Round avatar; blue for API/live-ish rows, slate for imported (from Figma).
function Avatar({ tint }: { tint: ToolAction['iconTint'] }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: tint === 'blue' ? '#3492ef' : '#acbdd5' }}
    >
      <Bolt size={15} className="text-white" aria-hidden />
    </span>
  )
}

// Static, inert checkbox (presentational).
function CheckboxCell() {
  return <span className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-surface-border bg-white" aria-hidden />
}

function HeaderCell({ label, sortable = true, info = false }: { label: string; sortable?: boolean; info?: boolean }) {
  return (
    <div className="flex items-center gap-1 border-r border-surface-border px-3.5 py-3 text-[12px] font-semibold text-grey-700 last:border-r-0">
      {label}
      {info && <Info size={13} className="text-ink-muted" aria-hidden />}
      {sortable && <ArrowDown size={13} className="text-ink-muted" aria-hidden />}
    </div>
  )
}

export function ToolsTable() {
  return (
    <div className="overflow-hidden rounded-t-[20px] border border-surface-border">
      {/* Header */}
      <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
        <div className="flex items-center gap-2 border-r border-surface-border px-3.5 py-3">
          <CheckboxCell />
          <span className="flex items-center gap-1 text-[12px] font-semibold text-grey-700">
            Name ({NAME_COUNT})
            <ArrowDown size={13} className="text-ink-muted" aria-hidden />
          </span>
        </div>
        <HeaderCell label="Type" />
        <HeaderCell label="Agents in use" sortable={false} />
        <HeaderCell label="Revealed # of conversations" />
        <HeaderCell label="State" info />
        <HeaderCell label="Last modified" />
        <div className="border-l border-surface-border" aria-hidden />
      </div>

      {/* Rows */}
      {TOOL_ACTIONS.map((a) => (
        <div key={a.id} className={`grid ${COLS} border-b border-surface-border last:border-b-0`}>
          <div className="flex items-center gap-3 border-r border-surface-border px-3.5 py-3">
            <CheckboxCell />
            <Avatar tint={a.iconTint} />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-black">{a.name}</div>
              <div className="truncate text-[12px] text-grey-700">{a.description}</div>
            </div>
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
            {a.type}
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 last:border-r-0">
            <AgentsChip agents={a.agents} />
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
            {a.conversations.toLocaleString('en-US')}
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 last:border-r-0">
            <StateBadge state={a.state} />
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
            {a.lastModified}
          </div>
          <div className="flex items-center justify-center border-l border-surface-border bg-[#fbfbfb] px-2">
            <button type="button" aria-label={`${a.name} options`} className="text-ink-muted">
              <MoreVertical size={16} aria-hidden />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/ToolsTable.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolsTable.tsx src/features/tools/ToolsTable.test.tsx
git commit -m "feat: Tool Builder actions table"
```

---

### Task 3: Toolbar (`ToolsToolbar.tsx`)

**Files:**
- Create: `src/features/tools/ToolsToolbar.tsx`
- Test: `src/features/tools/ToolsToolbar.test.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `export function ToolsToolbar(): JSX.Element` — presentational toolbar. No props.

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/ToolsToolbar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToolsToolbar } from './ToolsToolbar'

describe('ToolsToolbar', () => {
  it('renders the search placeholder and action buttons', () => {
    render(<ToolsToolbar />)
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter by' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import action' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create new...' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/ToolsToolbar.test.tsx`
Expected: FAIL — cannot resolve `./ToolsToolbar`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/tools/ToolsToolbar.tsx`:

```tsx
// Presentational toolbar for the Available tab: search, "Filter by", and the
// right-aligned "Import action" (outline) + "Create new..." (dark fill) buttons.
// Every control is inert (no backend).
import { ChevronDown, ListFilter, Search } from 'lucide-react'

export function ToolsToolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-[20px] border border-surface-border bg-white px-3 py-1.5">
          <Search size={16} className="text-ink-muted" aria-hidden />
          <input
            type="text"
            placeholder="Search"
            className="w-32 bg-transparent text-[12px] text-ink outline-none placeholder:text-grey-500"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <ListFilter size={15} className="text-ink-muted" aria-hidden />
          Filter by
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-grey-500 px-3 py-1.5 text-[11px] font-semibold text-ink"
        >
          Import action
        </button>
        <button
          type="button"
          className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white"
        >
          Create new...
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/ToolsToolbar.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolsToolbar.tsx src/features/tools/ToolsToolbar.test.tsx
git commit -m "feat: Tool Builder presentational toolbar"
```

---

### Task 4: Screen shell + tabs (`ToolsScreen.tsx`)

**Files:**
- Create: `src/features/tools/ToolsScreen.tsx`
- Test: `src/features/tools/ToolsScreen.test.tsx`

**Interfaces:**
- Consumes: `TOOL_TABS`, `type ToolTab` from `./tools-data`; `ToolsToolbar` from `./ToolsToolbar`; `ToolsTable` from `./ToolsTable`.
- Produces: `export function ToolsScreen(): JSX.Element` — `data-testid="screen-tools"`. Owns `useState<ToolTab>` defaulting to `'Available'`.

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/ToolsScreen.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolsScreen } from './ToolsScreen'

describe('ToolsScreen', () => {
  it('renders the Tool Builder title and the Available table by default', () => {
    render(<ToolsScreen />)
    const el = screen.getByTestId('screen-tools')
    expect(within(el).getByRole('heading', { name: 'Tool Builder' })).toBeInTheDocument()
    // Available tab is active and shows the table header.
    expect(within(el).getByText('Name (113)')).toBeInTheDocument()
    expect(within(el).getByRole('tab', { name: 'Available' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to an empty placeholder tab when clicked', async () => {
    const user = userEvent.setup()
    render(<ToolsScreen />)
    const el = screen.getByTestId('screen-tools')
    await user.click(within(el).getByRole('tab', { name: 'History' }))
    expect(within(el).getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
    // Table header is gone; the Available table no longer renders.
    expect(within(el).queryByText('Name (113)')).toBeNull()
    // Empty region is labelled.
    expect(within(el).getByText('History')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/ToolsScreen.test.tsx`
Expected: FAIL — cannot resolve `./ToolsScreen`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/tools/ToolsScreen.tsx`:

```tsx
// Tool Builder surface: title + inert gear, a tab strip (Available /
// Recommended / Authentication / History), and the active tab body. Tab
// switching is the only live interaction (local state); the Available tab shows
// the toolbar + table, the other three show titled empty regions (no fabricated
// data). No backend.
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { TOOL_TABS, type ToolTab } from './tools-data'
import { ToolsToolbar } from './ToolsToolbar'
import { ToolsTable } from './ToolsTable'

export function ToolsScreen() {
  const [tab, setTab] = useState<ToolTab>('Available')

  return (
    <div
      data-testid="screen-tools"
      className="h-full overflow-y-auto rounded-[26px] bg-white px-10 py-4"
    >
      {/* Title row + tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-[22px] text-ink">Tool Builder</h1>
          <div className="h-7 w-px bg-surface-border" aria-hidden />
          <div className="flex items-center gap-2" role="tablist">
            {TOOL_TABS.map((t) => {
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
        <button type="button" aria-label="Tool settings" className="text-ink-muted">
          <Settings size={20} aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div className="mt-6">
        {tab === 'Available' ? (
          <div className="flex flex-col gap-4">
            <ToolsToolbar />
            <ToolsTable />
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
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/ToolsScreen.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolsScreen.tsx src/features/tools/ToolsScreen.test.tsx
git commit -m "feat: assemble ToolsScreen with tab strip and body swap"
```

---

### Task 5: Wire `/tools` route

**Files:**
- Modify: `src/routes.tsx`
- Test: `src/features/tools/tools.routes.test.tsx`

**Interfaces:**
- Consumes: `ToolsScreen` from `@/features/tools/ToolsScreen`; existing `routes`, `findNavItemByPath`.
- Produces: `/tools` renders `ToolsScreen` (testid `screen-tools`) instead of the placeholder.

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/tools.routes.test.tsx`:

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

describe('Tools routing', () => {
  it('renders the Tool Builder screen at /tools', () => {
    renderAt('/tools')
    expect(screen.getByTestId('screen-tools')).toBeInTheDocument()
  })

  it('does not render the placeholder at /tools', () => {
    renderAt('/tools')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('resolves /tools to the Tools nav item', () => {
    expect(findNavItemByPath('/tools')?.label).toBe('Tools')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/tools/tools.routes.test.tsx`
Expected: FAIL — `/tools` still renders the placeholder, so `getByTestId('screen-tools')` throws.

- [ ] **Step 3: Wire the route**

In `src/routes.tsx`:

1. Add the import alongside the other feature-screen imports (near the `OrchestratorScreen` import):

```tsx
import { ToolsScreen } from '@/features/tools/ToolsScreen'
```

2. Add `'/tools'` to the `BUILT` set:

```tsx
const BUILT = new Set(['/', '/insights', '/organization', '/ai-agents', '/orchestrator', '/tools'])
```

3. Add the explicit route in the AppLayout `children`, right after the `orchestrator` route:

```tsx
          { path: 'orchestrator', element: <OrchestratorScreen /> },
          { path: 'tools', element: <ToolsScreen /> },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/tools/tools.routes.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/routes.tsx src/features/tools/tools.routes.test.tsx
git commit -m "feat: wire /tools route to ToolsScreen"
```

---

### Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all tests pass, including the new `src/features/tools/*` tests and the existing suite (nav-config still lists "Tools", placeholder routes still derived for the remaining unbuilt items).

- [ ] **Step 3: Build (optional sanity)**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Record completion**

Update `.superpowers/sdd/progress.md` (or the feature progress ledger) noting the Tool Builder screen is complete with final commit SHAs.

---

## Self-Review

**Spec coverage:**
- Title "Tool Builder" + gear → Task 4. ✅
- Tab strip, 4 tabs, only-tab-switching-live → Task 4 (state) + Task 4 test. ✅
- Available table (all columns, badges, agents chip, n/a, static 113 count) → Task 2. ✅
- Toolbar (search, filter, import, create) inert → Task 3. ✅
- Other tabs = titled empty regions, no fabricated data → Task 4. ✅
- Data model + 5 exact rows → Task 1. ✅
- Routing: `/tools` in BUILT + explicit route, nav label unchanged → Task 5. ✅
- Tests mirror orchestrator (data shape, table, tab switch, routing) → Tasks 1–5. ✅

**Placeholder scan:** No TBD/TODO; all steps contain full code. ✅

**Type consistency:** `ToolAction`, `ToolTab`, `ToolType`, `ToolState`, `TOOL_ACTIONS`, `TOOL_TABS`, `NAME_COUNT` are defined in Task 1 and consumed with the same names/shapes in Tasks 2 and 4. `ToolsTable`/`ToolsToolbar`/`ToolsScreen` are exported no-arg components as declared. ✅
