# Tool Detail Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/tools/:id` Tool Detail screen, opened by clicking a row in the Tool Builder Available table, matching Figma node `753:155092`.

**Architecture:** New files under `src/features/tools/` (`ToolDetailScreen.tsx`, `ToolRequestCard.tsx`, `ToolResponseCard.tsx`) following the existing `AutomationDetailScreen` / `orchestrator/:id` pattern. `ToolsTable` gains an `onOpen(id)` prop and exports its `StateBadge`; `ToolsScreen` wires `onOpen` to `useNavigate`; `routes.tsx` gains a `tools/:id` route.

**Tech Stack:** React 19 + TypeScript, React Router v7 (`react-router`, not `-dom`), Tailwind v4 (semantic token classes), Vitest + React Testing Library, `lucide-react` icons.

## Global Constraints

- No backend, no persistence — every field/button beyond the request-tab strip and back navigation is inert (per spec "Scope & interactivity").
- Only the Params/Header/Body/Authorization/Code tab strip and the back arrow are interactive; everything else (method dropdown, Send, Duplicate, Versions, Publish, collapse chevrons, Action name/Description inputs, Key/Value inputs, Add, trash icon, "+ " new-tab button) is presentational.
- Title = clicked row's `ToolAction.name`; state badge = clicked row's real `ToolAction.state`, reusing `StateBadge` from `ToolsTable.tsx` unchanged.
- Params tab shows designed content (Key/Value row); Header/Body/Authorization/Code render a titled empty region (`data-testid="request-tab-{Tab}"`) — no fabricated data.
- Icons come from `lucide-react` only (`ArrowLeft`, `ChevronDown`, `ChevronUp`, `Plus`, `Trash2`) — no new SVG assets.
- Use semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`, `bg-ink`, `text-grey-500`, `text-grey-700`, `text-blue-700`) per CLAUDE.md; one-off tints (e.g. `#f2f4f7` disabled-Send background) stay inline, matching the existing `ToolsTable.tsx` convention.
- Tests scope screen-level assertions with `within(getByTestId('screen-tool-detail'))`, matching CLAUDE.md's testing convention.
- Every modified test file that previously rendered `ToolsTable`/`ToolsScreen` without a router must keep passing — `ToolsTable` gains a required `onOpen` prop and `ToolsScreen` gains `useNavigate`, so both need their test setup updated in the same task that changes them.

---

### Task 1: Add `onOpen` to `ToolsTable`, export `StateBadge`

**Files:**
- Modify: `src/features/tools/ToolsTable.tsx`
- Test: `src/features/tools/ToolsTable.test.tsx`

**Interfaces:**
- Produces: `ToolsTable({ onOpen }: { onOpen: (id: string) => void })` — required prop, called with the row's `ToolAction.id` when a row (outside the checkbox and `⋮` button) is clicked.
- Produces: `export function StateBadge({ state }: { state: ToolState })` — for `ToolDetailScreen` (Task 5) to import from `./ToolsTable`.
- Produces: each data row carries `data-testid="tool-row-{id}"` (e.g. `tool-row-t1`); each checkbox carries `data-testid="tool-row-checkbox"`.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/features/tools/ToolsTable.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ToolsTable } from './ToolsTable'
import { TOOL_ACTIONS } from './tools-data'

describe('ToolsTable', () => {
  it('renders a row for every action with its name and type', () => {
    render(<ToolsTable onOpen={() => {}} />)
    for (const a of TOOL_ACTIONS) {
      expect(screen.getByText(a.name)).toBeInTheDocument()
    }
    expect(screen.getByText('API')).toBeInTheDocument()
    expect(screen.getByText('MCP')).toBeInTheDocument()
    expect(screen.getByText('Browser')).toBeInTheDocument()
  })

  it('shows the static Name (113) header count', () => {
    render(<ToolsTable onOpen={() => {}} />)
    expect(screen.getByText('Name (113)')).toBeInTheDocument()
  })

  it('renders the state badges', () => {
    render(<ToolsTable onOpen={() => {}} />)
    expect(screen.getAllByText('Live')).toHaveLength(2)
    expect(screen.getAllByText('Read only')).toHaveLength(2)
    expect(screen.getByText('Auto-saved')).toBeInTheDocument()
  })

  it('renders "n/a" for rows without agents', () => {
    render(<ToolsTable onOpen={() => {}} />)
    expect(screen.getAllByText('n/a')).toHaveLength(3)
  })

  it('calls onOpen with the row id when a row is clicked', () => {
    const onOpen = vi.fn()
    render(<ToolsTable onOpen={onOpen} />)
    fireEvent.click(screen.getByText('Action name 001'))
    expect(onOpen).toHaveBeenCalledWith('t1')
  })

  it('does not call onOpen when the row checkbox is clicked', () => {
    const onOpen = vi.fn()
    render(<ToolsTable onOpen={onOpen} />)
    const row = screen.getByTestId('tool-row-t1')
    fireEvent.click(within(row).getByTestId('tool-row-checkbox'))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('does not call onOpen when the row options button is clicked', () => {
    const onOpen = vi.fn()
    render(<ToolsTable onOpen={onOpen} />)
    fireEvent.click(screen.getByLabelText('Action name 001 options'))
    expect(onOpen).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx vitest run src/features/tools/ToolsTable.test.tsx`
Expected: FAIL — `onOpen` is not a recognized prop yet / rows have no `tool-row-*` testids / clicking does nothing.

- [ ] **Step 3: Implement — export `StateBadge`, add `onOpen`, scope checkbox clicks**

In `src/features/tools/ToolsTable.tsx`:

Change the `StateBadge` declaration (currently `function StateBadge(...)`) to:

```tsx
export function StateBadge({ state }: { state: ToolState }) {
```

Change `CheckboxCell` to stop the click from bubbling to the row, and to carry a testid:

```tsx
function CheckboxCell() {
  return (
    <span
      data-testid="tool-row-checkbox"
      onClick={(e) => e.stopPropagation()}
      className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-surface-border bg-white"
      aria-hidden
    />
  )
}
```

Change the `ToolsTable` export signature and the row markup:

```tsx
export function ToolsTable({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-t-[20px] border border-surface-border">
      {/* Header — unchanged */}
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
        <div aria-hidden />
      </div>

      {/* Rows */}
      {TOOL_ACTIONS.map((a) => (
        <div
          key={a.id}
          data-testid={`tool-row-${a.id}`}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(a.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(a.id)
            }
          }}
          className={`grid ${COLS} cursor-pointer border-b border-surface-border last:border-b-0`}
        >
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
          <div className="flex items-center justify-center bg-[#fbfbfb] px-2">
            <button
              type="button"
              aria-label={`${a.name} options`}
              onClick={(e) => e.stopPropagation()}
              className="text-ink-muted"
            >
              <MoreVertical size={16} aria-hidden />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/tools/ToolsTable.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolsTable.tsx src/features/tools/ToolsTable.test.tsx
git commit -m "feat: add row click-through and export StateBadge from ToolsTable"
```

---

### Task 2: Wire `ToolsTable.onOpen` through `ToolsScreen`

**Files:**
- Modify: `src/features/tools/ToolsScreen.tsx`
- Test: `src/features/tools/ToolsScreen.test.tsx`

**Interfaces:**
- Consumes: `ToolsTable({ onOpen })` from Task 1.
- Produces: `ToolsScreen` now requires a Router context in tests (uses `useNavigate`), matching `OrchestratorScreen.test.tsx`'s pattern.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `src/features/tools/ToolsScreen.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ToolsScreen } from './ToolsScreen'

function renderToolsScreen() {
  const router = createMemoryRouter([{ path: '/', element: <ToolsScreen /> }], { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('ToolsScreen', () => {
  it('renders the Tool Builder title and the Available table by default', () => {
    renderToolsScreen()
    const el = screen.getByTestId('screen-tools')
    expect(within(el).getByRole('heading', { name: 'Tool Builder' })).toBeInTheDocument()
    expect(within(el).getByText('Name (113)')).toBeInTheDocument()
    expect(within(el).getByRole('tab', { name: 'Available' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to an empty placeholder tab when clicked', async () => {
    const user = userEvent.setup()
    renderToolsScreen()
    const el = screen.getByTestId('screen-tools')
    await user.click(within(el).getByRole('tab', { name: 'History' }))
    expect(within(el).getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).queryByText('Name (113)')).toBeNull()
    expect(within(el).getByTestId('tools-tab-History')).toBeInTheDocument()
  })

  it('opens a row into the tool detail route', async () => {
    const user = userEvent.setup()
    renderToolsScreen()
    await user.click(screen.getByText('Action name 001'))
    // ToolsScreen has no /tools/:id route in this isolated router, so the
    // navigation attempt itself (no crash) confirms onOpen is wired; the
    // actual detail render is covered by tools.routes.test.tsx.
    expect(screen.queryByTestId('screen-tools')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/tools/ToolsScreen.test.tsx`
Expected: FAIL — `ToolsTable` requires `onOpen` (TypeScript) and/or the third test finds no navigation happened.

- [ ] **Step 3: Implement**

In `src/features/tools/ToolsScreen.tsx`, add the import and hook, and pass `onOpen`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Settings } from 'lucide-react'
import { TOOL_TABS, type ToolTab } from './tools-data'
import { ToolsToolbar } from './ToolsToolbar'
import { ToolsTable } from './ToolsTable'

export function ToolsScreen() {
  const [tab, setTab] = useState<ToolTab>('Available')
  const navigate = useNavigate()

  return (
    <div
      data-testid="screen-tools"
      className="h-full overflow-y-auto rounded-[26px] bg-white px-10 py-4"
    >
      {/* Title row + tabs — unchanged */}
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
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/tools/ToolsScreen.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolsScreen.tsx src/features/tools/ToolsScreen.test.tsx
git commit -m "feat: navigate to tool detail route when a row is clicked"
```

---

### Task 3: Create `ToolRequestCard`

**Files:**
- Create: `src/features/tools/ToolRequestCard.tsx`
- Test: `src/features/tools/ToolRequestCard.test.tsx`

**Interfaces:**
- Produces: `export function ToolRequestCard()` — no props, owns its own `useState<RequestTab>('Params')`. Consumed by `ToolDetailScreen` (Task 5).

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/ToolRequestCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolRequestCard } from './ToolRequestCard'

describe('ToolRequestCard', () => {
  it('shows the Params tab content by default', () => {
    render(<ToolRequestCard />)
    expect(screen.getByRole('tab', { name: 'Params' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Enter value or select CV from the list')).toBeInTheDocument()
  })

  it('switches to an empty placeholder tab when clicked', async () => {
    const user = userEvent.setup()
    render(<ToolRequestCard />)
    await user.click(screen.getByRole('tab', { name: 'Header' }))
    expect(screen.getByRole('tab', { name: 'Header' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Enter value or select CV from the list')).toBeNull()
    expect(screen.getByTestId('request-tab-Header')).toBeInTheDocument()
  })

  it('renders the action name and description panel', () => {
    render(<ToolRequestCard />)
    expect(screen.getByText('Action name and description *')).toBeInTheDocument()
    expect(screen.getByText('Provide a name for the action')).toBeInTheDocument()
    expect(
      screen.getByText('Provide information about the purpose and function of the API endpoint you are utilizing.')
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/tools/ToolRequestCard.test.tsx`
Expected: FAIL — `Cannot find module './ToolRequestCard'`

- [ ] **Step 3: Implement**

Create `src/features/tools/ToolRequestCard.tsx`:

```tsx
// Top card on the Tool Detail screen: Endpoint URL + a request tab strip
// (Params/Header/Body/Authorization/Code — the only live piece) alongside a
// static Action name/description panel. Everything else is presentational.
import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

type RequestTab = 'Params' | 'Header' | 'Body' | 'Authorization' | 'Code'
const REQUEST_TABS: RequestTab[] = ['Params', 'Header', 'Body', 'Authorization', 'Code']

export function ToolRequestCard() {
  const [tab, setTab] = useState<RequestTab>('Params')

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-6 rounded-[20px] border border-surface-border bg-white p-5">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-[14px] font-semibold text-black">Endpoint URL</div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-black"
            >
              GET
              <ChevronDown size={14} className="text-ink-muted" aria-hidden />
            </button>
            <div className="flex-1 rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
              Select method, enter endpoint then sent
            </div>
            <button
              type="button"
              className="rounded-[20px] px-4 py-2 text-[12px] font-semibold text-grey-400"
              style={{ backgroundColor: '#f2f4f7' }}
            >
              Send
            </button>
          </div>
        </div>

        <div role="tablist" className="flex items-center gap-4 border-b border-surface-border">
          {REQUEST_TABS.map((t) => {
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
                    ? '-mb-px border-b border-ink px-1 pb-2 text-[12px] text-black'
                    : 'px-1 pb-2 text-[12px] text-grey-500'
                }
              >
                {t}
              </button>
            )
          })}
        </div>

        {tab === 'Params' ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-grey-700">
              <span>Key</span>
              <span>Value</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
                Key
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
                  Enter value or select CV from the list
                </div>
                <button type="button" aria-label="Remove parameter" className="text-ink-muted">
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </div>
            <button type="button" className="flex w-fit items-center gap-1.5 px-1 py-2 text-[12px] font-semibold text-grey-400">
              <Plus size={14} aria-hidden />
              Add
            </button>
          </div>
        ) : (
          <div data-testid={`request-tab-${tab}`} className="flex h-24 items-center justify-center text-[13px] text-ink-muted">
            {tab}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-l border-surface-border pl-6">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-black">Action name and description *</span>
          <button type="button" aria-label="Collapse action panel">
            <ChevronUp size={16} className="text-ink-muted" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-black">Action name*</label>
          <div className="rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
            Provide a name for the action
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-black">Description*</label>
          <div className="rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
            Provide information about the purpose and function of the API endpoint you are utilizing.
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/tools/ToolRequestCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolRequestCard.tsx src/features/tools/ToolRequestCard.test.tsx
git commit -m "feat: add ToolRequestCard with request-tab strip"
```

---

### Task 4: Create `ToolResponseCard`

**Files:**
- Create: `src/features/tools/ToolResponseCard.tsx`
- Test: `src/features/tools/ToolResponseCard.test.tsx`

**Interfaces:**
- Produces: `export function ToolResponseCard()` — no props, fully static. Consumed by `ToolDetailScreen` (Task 5).

- [ ] **Step 1: Write the failing test**

Create `src/features/tools/ToolResponseCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToolResponseCard } from './ToolResponseCard'

describe('ToolResponseCard', () => {
  it('renders the Responses and Output Parameters panels', () => {
    render(<ToolResponseCard />)
    expect(screen.getByText('Responses')).toBeInTheDocument()
    expect(screen.getByText('Output Parameters')).toBeInTheDocument()
    expect(screen.getByText('Enter the URL and click Send to get a response')).toBeInTheDocument()
    expect(screen.getByText('Click on Response to add Output parameters')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/tools/ToolResponseCard.test.tsx`
Expected: FAIL — `Cannot find module './ToolResponseCard'`

- [ ] **Step 3: Implement**

Create `src/features/tools/ToolResponseCard.tsx`:

```tsx
// Bottom card on the Tool Detail screen: static Responses guidance text and
// an Output Parameters empty state. No live behavior — no request has been
// sent (this is a mock UI, no backend).
import { ChevronUp } from 'lucide-react'

export function ToolResponseCard() {
  return (
    <div className="grid grid-cols-2 gap-6 rounded-[20px] border border-surface-border bg-white p-5">
      <div>
        <div className="text-[14px] font-semibold text-black">Responses</div>
        <p className="mt-4 text-center text-[12px] text-blue-700">
          Select an array [] to generate a Dynamic list of CV&apos;s or select an individual entity for a single CV.
          Utilize &apos;Advanced Filter&apos; with JMESPath for precise filtering.
        </p>
        <p className="mt-3 text-center text-[12px] text-ink-muted">
          Enter the URL and click Send to get a response
        </p>
      </div>
      <div className="border-l border-surface-border pl-6">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-black">Output Parameters</span>
          <button type="button" aria-label="Collapse output parameters panel">
            <ChevronUp size={16} className="text-ink-muted" aria-hidden />
          </button>
        </div>
        <p className="mt-4 text-center text-[12px] text-ink-muted">
          Click on Response to add Output parameters
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/tools/ToolResponseCard.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/ToolResponseCard.tsx src/features/tools/ToolResponseCard.test.tsx
git commit -m "feat: add ToolResponseCard"
```

---

### Task 5: Create `ToolDetailScreen` and wire the `/tools/:id` route

**Files:**
- Create: `src/features/tools/ToolDetailScreen.tsx`
- Modify: `src/routes.tsx`
- Test: `src/features/tools/ToolDetailScreen.test.tsx`
- Modify test: `src/features/tools/tools.routes.test.tsx`

**Interfaces:**
- Consumes: `TOOL_ACTIONS` from `./tools-data` (Task-independent, already exists); `StateBadge` from `./ToolsTable` (Task 1); `ToolRequestCard` (Task 3); `ToolResponseCard` (Task 4).
- Produces: `export function ToolDetailScreen()` — reads `useParams<{ id: string }>()`, renders `data-testid="screen-tool-detail"`, or `<Navigate to="/tools" replace />` for an unknown id.

- [ ] **Step 1: Write the failing tests**

Create `src/features/tools/ToolDetailScreen.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('ToolDetailScreen', () => {
  it('renders the tool name and state badge for a valid id', () => {
    renderAt('/tools/t1')
    const el = screen.getByTestId('screen-tool-detail')
    expect(within(el).getByRole('heading', { name: 'Action name 001' })).toBeInTheDocument()
    expect(within(el).getByText('Live')).toBeInTheDocument()
  })

  it('redirects an unknown id back to /tools', () => {
    renderAt('/tools/does-not-exist')
    expect(screen.getByTestId('screen-tools')).toBeInTheDocument()
    expect(screen.queryByTestId('screen-tool-detail')).toBeNull()
  })

  it('navigates back to /tools when the back arrow is clicked', () => {
    renderAt('/tools/t1')
    fireEvent.click(screen.getByRole('button', { name: 'Back to Tool Builder' }))
    expect(screen.getByTestId('screen-tools')).toBeInTheDocument()
  })

  it('switches request tabs within the detail screen', () => {
    renderAt('/tools/t1')
    const el = screen.getByTestId('screen-tool-detail')
    fireEvent.click(within(el).getByRole('tab', { name: 'Body' }))
    expect(within(el).getByRole('tab', { name: 'Body' })).toHaveAttribute('aria-selected', 'true')
  })
})
```

Append to `src/features/tools/tools.routes.test.tsx` (inside the existing `describe('Tools routing', ...)` block, after the last `it`):

```tsx
  it('renders the Tool Detail screen at /tools/t1', () => {
    renderAt('/tools/t1')
    expect(screen.getByTestId('screen-tool-detail')).toBeInTheDocument()
  })

  it('redirects /tools/does-not-exist back to /tools', () => {
    renderAt('/tools/does-not-exist')
    expect(screen.getByTestId('screen-tools')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/tools/ToolDetailScreen.test.tsx src/features/tools/tools.routes.test.tsx`
Expected: FAIL — `Cannot find module './ToolDetailScreen'` and/or no route matches `/tools/:id`.

- [ ] **Step 3: Implement `ToolDetailScreen`**

Create `src/features/tools/ToolDetailScreen.tsx`:

```tsx
// Tool Detail screen: opened from a row in the Tool Builder Available table.
// Only the back arrow and the request-tab strip (inside ToolRequestCard) are
// live; header actions (Duplicate/Versions/Publish/chevron) and the
// "Untitled" tab strip are presentational. No backend.
import { useParams, useNavigate, Navigate } from 'react-router'
import { ArrowLeft, ChevronDown, Plus } from 'lucide-react'
import { TOOL_ACTIONS } from './tools-data'
import { StateBadge } from './ToolsTable'
import { ToolRequestCard } from './ToolRequestCard'
import { ToolResponseCard } from './ToolResponseCard'

export function ToolDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tool = TOOL_ACTIONS.find((t) => t.id === id)

  if (!tool) return <Navigate to="/tools" replace />

  return (
    <div data-testid="screen-tool-detail" className="h-full overflow-y-auto rounded-[26px] bg-white px-10 py-4">
      <div className="flex items-center gap-4">
        <button type="button" aria-label="Back to Tool Builder" onClick={() => navigate('/tools')}>
          <ArrowLeft size={18} className="text-ink" aria-hidden />
        </button>
        <h1 className="text-[22px] text-ink">{tool.name}</h1>
        <StateBadge state={tool.state} />
        <button type="button" aria-label="Tool status options" className="text-ink-muted">
          <ChevronDown size={16} aria-hidden />
        </button>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" className="text-[12px] font-semibold text-black">
            Duplicate
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-[12px] font-semibold text-black"
          >
            Versions
            <ChevronDown size={14} className="text-ink-muted" aria-hidden />
          </button>
          <button type="button" className="rounded-full bg-ink px-4 py-1.5 text-[12px] font-semibold text-white">
            Publish
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-b border-surface-border">
        <div className="-mb-px flex items-center gap-2 border-b border-ink px-3 py-2 text-[12px] text-ink">
          Untitled
        </div>
        <button type="button" aria-label="Add tab" className="px-2 py-2 text-ink-muted">
          <Plus size={14} aria-hidden />
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <ToolRequestCard />
        <ToolResponseCard />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire the route**

In `src/routes.tsx`, add the import near the other `tools` import:

```tsx
import { ToolsScreen } from '@/features/tools/ToolsScreen'
import { ToolDetailScreen } from '@/features/tools/ToolDetailScreen'
```

Add the route entry right after the existing `{ path: 'tools', element: <ToolsScreen /> },` line:

```tsx
          { path: 'tools', element: <ToolsScreen /> },
          { path: 'tools/:id', element: <ToolDetailScreen /> },
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/features/tools/ToolDetailScreen.test.tsx src/features/tools/tools.routes.test.tsx`
Expected: PASS (4 tests + 2 new routing tests)

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS, all test files (no regressions in `ToolsScreen.test.tsx`, `ToolsTable.test.tsx`, or elsewhere)

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/features/tools/ToolDetailScreen.tsx src/features/tools/ToolDetailScreen.test.tsx src/features/tools/tools.routes.test.tsx src/routes.tsx
git commit -m "feat: add Tool Detail screen and /tools/:id route"
```

---

## Final Verification

- [ ] Run `npx vitest run` — full suite passes.
- [ ] Run `npx tsc --noEmit` — no type errors.
- [ ] Manually sanity-check in the browser: `npm run dev`, navigate to `/tools`, click "Action name 003" (a Read-only, no-agents row) — confirm the detail screen shows "Action name 003" and a "Read only" badge, the Params tab shows the Key/Value row, other tabs show an empty region, and the back arrow returns to `/tools`.
