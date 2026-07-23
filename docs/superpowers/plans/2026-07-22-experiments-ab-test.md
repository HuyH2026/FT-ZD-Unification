# Experiments A/B Test Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Experiments → A/B Test screen at `/experiments`, ported faithfully from Figma frame `747:86296`.

**Architecture:** Clone the existing Orchestrator screen pattern (`src/features/orchestrator/`): a feature folder under `src/features/experiments/` with a mock-data module, a screen surface (title + metric strip + presentational toolbar + card-row table), and small presentational sub-components (metric strip, table, status badge, traffic-split bar). Routing is a single flat route added to `src/routes.tsx`; the Experiments nav entry already exists in `nav-config.ts`.

**Tech Stack:** React 19 + Vite + TypeScript (strict), React Router v7 (`react-router`), Tailwind v4 (semantic token classes), lucide-react icons, Vitest + React Testing Library (jsdom).

## Global Constraints

- **No backend.** All data is mock/in-memory in `experiments-data.ts`.
- **Presentational toolbar.** Search / date-range / filters / view-toggle / "Create new" are inert.
- **Static table rows.** No click-through / detail view.
- **TypeScript strict** — keep all new code fully typed.
- **Imports from `react-router`**, never `react-router-dom`.
- **Path alias** `@` → `src/`.
- **Prefer semantic token classes** (`text-ink`, `text-ink-muted`, `border-surface-border`); brand/status/chart hex values are inline (matches Orchestrator).
- **Run tests** with `npx vitest run --exclude '**/.claude/**'` (sibling worktrees otherwise cause spurious failures).
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Mock data module

**Files:**
- Create: `src/features/experiments/experiments-data.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ABMetric = { key: string; label: string; value: string; sub?: string; accent?: 'green' }`
  - `type ExperimentStatus = 'not-started' | 'running' | 'completed' | 'canceled'`
  - `type Experiment = { id: string; name: string; status: ExperimentStatus; intent: string; description: string; splits: number[] }`
  - `const METRICS: ABMetric[]` (4 items)
  - `const EXPERIMENTS: Experiment[]` (5 items)

- [ ] **Step 1: Write the failing test**

Create `src/features/experiments/experiments-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { METRICS, EXPERIMENTS } from './experiments-data'

describe('experiments-data', () => {
  it('has four metrics including CSAT with a green accent', () => {
    expect(METRICS).toHaveLength(4)
    expect(METRICS.map((m) => m.label)).toEqual([
      'Total Tests',
      'Total conversations',
      'Resolutions',
      'CSAT',
    ])
    const resolutions = METRICS.find((m) => m.label === 'Resolutions')
    expect(resolutions?.value).toBe('41,312')
    expect(resolutions?.sub).toBe('80%')
    expect(METRICS.find((m) => m.label === 'CSAT')?.accent).toBe('green')
  })

  it('has five experiments with valid splits summing near 100', () => {
    expect(EXPERIMENTS).toHaveLength(5)
    expect(EXPERIMENTS.map((e) => e.name)).toContain('Abandoned Cart Recovery')
    for (const e of EXPERIMENTS) {
      expect(e.splits.length).toBeGreaterThanOrEqual(2)
      expect(e.splits.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(99)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/experiments-data.test.ts`
Expected: FAIL (cannot resolve `./experiments-data`).

- [ ] **Step 3: Write the data module**

Create `src/features/experiments/experiments-data.ts`:

```ts
// Mock data + types for the Experiments A/B Test screen. Values are exact from
// Figma frame 747:86296 (no backend).

export type ABMetric = {
  key: string
  label: string
  value: string        // "5", "55,987", "41,312", "4.1"
  sub?: string         // secondary figure beside the value ("80%")
  accent?: 'green'     // render the value in green (CSAT)
}

export type ExperimentStatus = 'not-started' | 'running' | 'completed' | 'canceled'

export type Experiment = {
  id: string
  name: string
  status: ExperimentStatus
  intent: string
  description: string
  splits: number[]     // traffic split percentages, e.g. [50, 50] or [33, 33, 33]
}

export const METRICS: ABMetric[] = [
  { key: 'tests', label: 'Total Tests', value: '5' },
  { key: 'conversations', label: 'Total conversations', value: '55,987' },
  { key: 'resolutions', label: 'Resolutions', value: '41,312', sub: '80%' },
  { key: 'csat', label: 'CSAT', value: '4.1', accent: 'green' },
]

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'e1',
    name: 'Test',
    status: 'not-started',
    intent: 'Log in troubleshooting',
    description: 'Explore which login experience leads to the highest conversion.',
    splits: [50, 50],
  },
  {
    id: 'e2',
    name: 'Abandoned Cart Recovery',
    status: 'running',
    intent: 'Call users with abandoned carts',
    description:
      'Explore which outbound calls experience leads to the highest user satisfaction.',
    splits: [33, 33, 33],
  },
  {
    id: 'e3',
    name: 'Conversation recap strategy',
    status: 'completed',
    intent: 'Update shipping address',
    description: 'Explore which login experience leads to the highest CSAT rating.',
    splits: [33, 33, 33],
  },
  {
    id: 'e4',
    name: 'Self Service Checkout',
    status: 'completed',
    intent: 'Update Billing address',
    description: 'Test emails for the highest user satisfaction.',
    splits: [50, 50],
  },
  {
    id: 'e5',
    name: 'Guided Troubleshoot Flow',
    status: 'canceled',
    intent: 'Replacement Card',
    description: 'Explore which login experience leads to the best customer retention.',
    splits: [50, 30, 20],
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/experiments-data.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/experiments/experiments-data.ts src/features/experiments/experiments-data.test.ts
git commit -m "feat(experiments): add A/B Test mock data module

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: StatusBadge component

**Files:**
- Create: `src/features/experiments/StatusBadge.tsx`
- Test: `src/features/experiments/StatusBadge.test.tsx`

**Interfaces:**
- Consumes: `ExperimentStatus` from `./experiments-data`.
- Produces: `function StatusBadge({ status }: { status: ExperimentStatus }): JSX.Element` — renders a pill with the human label ("Not started" / "Running" / "Completed" / "Canceled").

- [ ] **Step 1: Write the failing test**

Create `src/features/experiments/StatusBadge.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the human-readable label for each status', () => {
    const { rerender } = render(<StatusBadge status="not-started" />)
    expect(screen.getByText('Not started')).toBeInTheDocument()
    rerender(<StatusBadge status="running" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
    rerender(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    rerender(<StatusBadge status="canceled" />)
    expect(screen.getByText('Canceled')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/StatusBadge.test.tsx`
Expected: FAIL (cannot resolve `./StatusBadge`).

- [ ] **Step 3: Write the component**

Create `src/features/experiments/StatusBadge.tsx`:

```tsx
// A status pill for an experiment. Color + label are driven by the status.
// Brand/status colors are inline hex (no token), matching the frame.
import { type ExperimentStatus } from './experiments-data'

const CONFIG: Record<ExperimentStatus, { label: string; bg: string }> = {
  'not-started': { label: 'Not started', bg: '#9194a0' },
  running: { label: 'Running', bg: '#007f74' },
  completed: { label: 'Completed', bg: '#3489db' },
  canceled: { label: 'Canceled', bg: '#e53112' },
}

export function StatusBadge({ status }: { status: ExperimentStatus }) {
  const { label, bg } = CONFIG[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/StatusBadge.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/experiments/StatusBadge.tsx src/features/experiments/StatusBadge.test.tsx
git commit -m "feat(experiments): add StatusBadge component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: TrafficSplitBar component

**Files:**
- Create: `src/features/experiments/TrafficSplitBar.tsx`
- Test: `src/features/experiments/TrafficSplitBar.test.tsx`

**Interfaces:**
- Consumes: nothing (takes a `splits: number[]` prop).
- Produces: `function TrafficSplitBar({ splits }: { splits: number[] }): JSX.Element` — a stacked horizontal bar with a `%` label per segment.

- [ ] **Step 1: Write the failing test**

Create `src/features/experiments/TrafficSplitBar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrafficSplitBar } from './TrafficSplitBar'

describe('TrafficSplitBar', () => {
  it('renders a percentage label per split segment', () => {
    render(<TrafficSplitBar splits={[50, 30, 20]} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/TrafficSplitBar.test.tsx`
Expected: FAIL (cannot resolve `./TrafficSplitBar`).

- [ ] **Step 3: Write the component**

Create `src/features/experiments/TrafficSplitBar.tsx`:

```tsx
// A stacked horizontal bar showing an experiment's traffic split, with a %
// label beneath each segment. Segment colors cycle through the chart palette.
// Presentational.
const SEGMENT_COLORS = ['#01567a', '#e05c34', '#2f69c7']

export function TrafficSplitBar({ splits }: { splits: number[] }) {
  return (
    <div className="w-[104px]">
      <div className="flex h-3.5 w-full overflow-hidden rounded-[4px]">
        {splits.map((pct, i) => (
          <div
            key={i}
            style={{ width: `${pct}%`, backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        {splits.map((pct, i) => (
          <span key={i}>{pct}%</span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/TrafficSplitBar.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/experiments/TrafficSplitBar.tsx src/features/experiments/TrafficSplitBar.test.tsx
git commit -m "feat(experiments): add TrafficSplitBar component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: MetricStrip component

**Files:**
- Create: `src/features/experiments/MetricStrip.tsx`
- Test: `src/features/experiments/MetricStrip.test.tsx`

**Interfaces:**
- Consumes: `ABMetric` from `./experiments-data`.
- Produces: `function MetricStrip({ metrics }: { metrics: ABMetric[] }): JSX.Element` — four cards; CSAT value in green, Resolutions shows its `sub` beside the value.

- [ ] **Step 1: Write the failing test**

Create `src/features/experiments/MetricStrip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricStrip } from './MetricStrip'
import { METRICS } from './experiments-data'

describe('MetricStrip', () => {
  it('renders every metric label and value', () => {
    render(<MetricStrip metrics={METRICS} />)
    expect(screen.getByText('Total Tests')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('55,987')).toBeInTheDocument()
    expect(screen.getByText('41,312')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('4.1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/MetricStrip.test.tsx`
Expected: FAIL (cannot resolve `./MetricStrip`).

- [ ] **Step 3: Write the component**

Create `src/features/experiments/MetricStrip.tsx`:

```tsx
// The four A/B Test metric cards. Presentational. CSAT renders its value in
// green; Resolutions shows a secondary figure beside the value. Values come
// from mock data.
import { Info } from 'lucide-react'
import { type ABMetric } from './experiments-data'

const INK = '#2f3130'
const GREEN = '#2d7e55'

function Card({ metric }: { metric: ABMetric }) {
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white px-5 py-4">
      <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
        <span>{metric.label}</span>
        <Info size={13} aria-hidden />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-[30px] font-semibold leading-none"
          style={{ color: metric.accent === 'green' ? GREEN : INK }}
        >
          {metric.value}
        </span>
        {metric.sub && <span className="text-[15px] text-ink-muted">{metric.sub}</span>}
      </div>
    </div>
  )
}

export function MetricStrip({ metrics }: { metrics: ABMetric[] }) {
  return (
    <div className="flex gap-4">
      {metrics.map((m) => (
        <Card key={m.key} metric={m} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/MetricStrip.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/experiments/MetricStrip.tsx src/features/experiments/MetricStrip.test.tsx
git commit -m "feat(experiments): add MetricStrip component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: ExperimentTable component

**Files:**
- Create: `src/features/experiments/ExperimentTable.tsx`
- Test: `src/features/experiments/ExperimentTable.test.tsx`

**Interfaces:**
- Consumes: `Experiment` from `./experiments-data`; `StatusBadge` from `./StatusBadge`; `TrafficSplitBar` from `./TrafficSplitBar`.
- Produces: `function ExperimentTable({ experiments }: { experiments: Experiment[] }): JSX.Element` — column headers (Name · Status · Intent · Description · Traffic split) + one static card row per experiment.

- [ ] **Step 1: Write the failing test**

Create `src/features/experiments/ExperimentTable.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExperimentTable } from './ExperimentTable'
import { EXPERIMENTS } from './experiments-data'

describe('ExperimentTable', () => {
  it('renders column headers and a row per experiment', () => {
    render(<ExperimentTable experiments={EXPERIMENTS} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Traffic split')).toBeInTheDocument()
    expect(screen.getByText('Abandoned Cart Recovery')).toBeInTheDocument()
    expect(screen.getByText('Guided Troubleshoot Flow')).toBeInTheDocument()
    // Status badge label present
    expect(screen.getByText('Running')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/ExperimentTable.test.tsx`
Expected: FAIL (cannot resolve `./ExperimentTable`).

- [ ] **Step 3: Write the component**

Create `src/features/experiments/ExperimentTable.tsx`:

```tsx
// The experiments table. Columns: Name · Status · Intent · Description ·
// Traffic split. Rows are separated cards, matching the frame. Static — no
// click-through.
import { type Experiment } from './experiments-data'
import { StatusBadge } from './StatusBadge'
import { TrafficSplitBar } from './TrafficSplitBar'

const INK = '#2f3130'
const COLS = 'grid-cols-[1.4fr_0.8fr_1.2fr_1.8fr_0.9fr]'

export function ExperimentTable({ experiments }: { experiments: Experiment[] }) {
  return (
    <div>
      {/* Column headers */}
      <div className={`grid ${COLS} gap-4 px-5 py-3 text-[12px] font-medium text-ink-muted`}>
        <span>Name</span>
        <span>Status</span>
        <span>Intent</span>
        <span>Description</span>
        <span>Traffic split</span>
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-3">
        {experiments.map((e) => (
          <div
            key={e.id}
            className={`grid ${COLS} items-center gap-4 rounded-2xl border border-surface-border bg-white px-5 py-4`}
          >
            <div className="text-[14px] font-medium" style={{ color: INK }}>{e.name}</div>
            <div><StatusBadge status={e.status} /></div>
            <div className="text-[13px]" style={{ color: INK }}>{e.intent}</div>
            <div className="text-[13px] text-ink-muted">{e.description}</div>
            <div><TrafficSplitBar splits={e.splits} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/ExperimentTable.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/experiments/ExperimentTable.tsx src/features/experiments/ExperimentTable.test.tsx
git commit -m "feat(experiments): add ExperimentTable component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: ExperimentsScreen surface

**Files:**
- Create: `src/features/experiments/ExperimentsScreen.tsx`
- Test: `src/features/experiments/ExperimentsScreen.test.tsx`

**Interfaces:**
- Consumes: `METRICS`, `EXPERIMENTS` from `./experiments-data`; `MetricStrip`; `ExperimentTable`.
- Produces: `function ExperimentsScreen(): JSX.Element` — the full surface with `data-testid="screen-experiments"`.

- [ ] **Step 1: Write the failing test**

Create `src/features/experiments/ExperimentsScreen.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ExperimentsScreen } from './ExperimentsScreen'

function renderScreen() {
  const router = createMemoryRouter([{ path: '/', element: <ExperimentsScreen /> }], { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('ExperimentsScreen', () => {
  it('renders the title, metrics, toolbar, and experiment rows', () => {
    renderScreen()
    const screenEl = screen.getByTestId('screen-experiments')
    expect(within(screenEl).getByRole('heading', { name: 'A/B test' })).toBeInTheDocument()
    expect(within(screenEl).getByText('Total Tests')).toBeInTheDocument()
    expect(within(screenEl).getByPlaceholderText('Search')).toBeInTheDocument()
    expect(within(screenEl).getByRole('button', { name: 'Create new' })).toBeInTheDocument()
    expect(within(screenEl).getByText('Abandoned Cart Recovery')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/ExperimentsScreen.test.tsx`
Expected: FAIL (cannot resolve `./ExperimentsScreen`).

- [ ] **Step 3: Write the component**

Create `src/features/experiments/ExperimentsScreen.tsx`:

```tsx
// Experiments → A/B Test surface: title, a 4-card metric strip, a presentational
// toolbar (search / date-range / filters / view-toggle / Create new), and the
// experiments table. Every toolbar control is inert. No backend.
import { Search, Calendar, ChevronDown, LayoutGrid, Table2 } from 'lucide-react'
import { METRICS, EXPERIMENTS } from './experiments-data'
import { MetricStrip } from './MetricStrip'
import { ExperimentTable } from './ExperimentTable'

export function ExperimentsScreen() {
  return (
    <div data-testid="screen-experiments" className="h-full overflow-y-auto rounded-[26px] bg-white px-8 py-6">
      <h1 className="text-[22px] font-semibold text-ink">A/B test</h1>

      <div className="mt-6">
        <MetricStrip metrics={METRICS} />
      </div>

      {/* Toolbar — presentational */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-surface-border px-3 py-2">
          <Search size={15} className="text-ink-muted" aria-hidden />
          <input
            type="text"
            placeholder="Search"
            className="w-40 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
        <button type="button" className="flex items-center gap-2 rounded-full border border-surface-border px-3 py-2 text-[14px] text-ink">
          <Calendar size={15} className="text-ink-muted" aria-hidden />
          Jan 1, 2025 – Dec 31, 2025
          <ChevronDown size={15} className="text-ink-muted" aria-hidden />
        </button>
        <button type="button" className="rounded-full border border-surface-border px-3 py-2 text-[14px] text-ink">
          All filters
        </button>
        <div className="flex items-center gap-1 rounded-full border border-surface-border p-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
            <Table2 size={15} className="text-ink" aria-hidden />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full">
            <LayoutGrid size={15} className="text-ink-muted" aria-hidden />
          </span>
        </div>
        <div className="ml-auto">
          <button type="button" className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white">
            Create new
          </button>
        </div>
      </div>

      <div className="mt-6">
        <ExperimentTable experiments={EXPERIMENTS} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/ExperimentsScreen.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/experiments/ExperimentsScreen.tsx src/features/experiments/ExperimentsScreen.test.tsx
git commit -m "feat(experiments): add ExperimentsScreen surface

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Wire up routing

**Files:**
- Modify: `src/routes.tsx` (add import, add `/experiments` to `BUILT`, add route)
- Test: `src/features/experiments/experiments.routes.test.tsx`

**Interfaces:**
- Consumes: `ExperimentsScreen` from `@/features/experiments/ExperimentsScreen`; `routes` from `@/routes`; `findNavItemByPath` from `@/app/nav-config`.
- Produces: nothing consumed downstream.

- [ ] **Step 1: Write the failing test**

Create `src/features/experiments/experiments.routes.test.tsx`:

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

describe('Experiments routing', () => {
  it('renders the Experiments screen at /experiments', () => {
    renderAt('/experiments')
    expect(screen.getByTestId('screen-experiments')).toBeInTheDocument()
  })

  it('does not render the placeholder at /experiments', () => {
    renderAt('/experiments')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('resolves /experiments to the Experiments nav item', () => {
    expect(findNavItemByPath('/experiments')?.label).toBe('Experiments')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/experiments.routes.test.tsx`
Expected: FAIL — `/experiments` currently renders the `PlaceholderScreen` ("Coming soon"), so `screen-experiments` is absent and the placeholder assertion fails.

- [ ] **Step 3: Add the import**

In `src/routes.tsx`, add after the `ToolDetailScreen` import (line 19):

```tsx
import { ExperimentsScreen } from '@/features/experiments/ExperimentsScreen'
```

- [ ] **Step 4: Add `/experiments` to the BUILT set**

In `src/routes.tsx`, change the `BUILT` constant:

```tsx
const BUILT = new Set(['/', '/insights', '/organization', '/ai-agents', '/orchestrator', '/tools', '/experiments'])
```

- [ ] **Step 5: Add the route**

In `src/routes.tsx`, add this route alongside the other built routes (e.g. after the `tools/:id` route, before the `opportunity/:id` route):

```tsx
          { path: 'experiments', element: <ExperimentsScreen /> },
```

- [ ] **Step 6: Run the routing test to verify it passes**

Run: `npx vitest run --exclude '**/.claude/**' src/features/experiments/experiments.routes.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/routes.tsx src/features/experiments/experiments.routes.test.tsx
git commit -m "feat(experiments): route /experiments to the A/B Test screen

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run --exclude '**/.claude/**'`
Expected: all tests pass (previous 426 + the new experiments tests, 0 failures).

- [ ] **Step 3: Build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Final commit (only if any incidental changes remain)**

```bash
git status
# If clean, nothing to do. Otherwise stage and commit any stragglers.
```

---

## Self-Review Notes

- **Spec coverage:** routing (Task 7), `experiments-data.ts` (Task 1), `ExperimentsScreen` (Task 6), `MetricStrip` (Task 4), `ExperimentTable` (Task 5), `StatusBadge` (Task 2), `TrafficSplitBar` (Task 3), tests (each task + Task 8) — every spec file/section maps to a task.
- **Type consistency:** `ABMetric`, `ExperimentStatus`, `Experiment`, `METRICS`, `EXPERIMENTS` defined in Task 1 and consumed by name in Tasks 2–6. Component prop shapes match across tasks.
- **No placeholders:** all steps show real code and exact commands.
- **View-toggle note:** the frame's toolbar includes a table/grid view toggle (inert). It's added in Task 6 using lucide `Table2` / `LayoutGrid`; purely presentational per the Global Constraints.
