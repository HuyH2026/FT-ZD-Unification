# Orchestrator Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Coming soon" placeholder at `/orchestrator` with a real screen: a 4-card metric strip, a presentational toolbar, and a table of automations with live On/Off toggles.

**Architecture:** A flat feature screen under `src/features/orchestrator/` (no nested routes). `OrchestratorScreen` owns the automations' toggle state and composes four presentational children: `MetricStrip`, `NodeChips`, `SuccessBar`, and `AutomationTable`. Mock data lives in `orchestrator-data.ts`. Routing moves `/orchestrator` out of the derived placeholder set into an explicit route.

**Tech Stack:** React 19, TypeScript (strict), React Router v7, Tailwind v4 (semantic tokens), lucide-react icons, Vitest + React Testing Library (jsdom).

## Global Constraints

- TypeScript strict mode; keep all new code fully typed. (TS pinned to 5.9 — do not bump.)
- Do NOT add `baseUrl` to `tsconfig.json`; the `@/*` alias resolves without it.
- All imports from `react-router` (never `react-router-dom`).
- Semantic token classes (`text-ink`, `text-ink-muted`, `bg-app-backdrop`, `border-surface-border`) over raw hex where a token exists. Per-row brand/accent colors may be inline constants (follow `AgentsTable.tsx`: `INK = '#2f3130'`, `GREEN = '#0f8a5f'`).
- Icons: lucide-react everywhere (nav rail excepted — not touched here).
- No backend. Search, date-range, "All filters", "Simulations", "New automation" are inert. Only row On/Off toggles carry state.
- Gates: `pnpm typecheck`, `pnpm test` (or `npx tsc --noEmit`, `npx vitest run`). `pnpm lint` is known-broken (TS7 parser gap) — do not treat its failure as a regression.
- Verify each screen/view exposes its `data-testid` (`screen-orchestrator`).

---

### Task 1: Data model + mock data

**Files:**
- Create: `src/features/orchestrator/orchestrator-data.ts`
- Test: `src/features/orchestrator/orchestrator-data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type OrchMetric = { key: string; label: string; value: string; sub?: string; delta?: string; trend?: 'up'; sentiment?: boolean }`
  - `type NodeKind = 'sentiment' | 'event' | 'csat'`
  - `type Automation = { id: string; name: string; updatedLabel: string; primaryNode: string; primaryNodeKind: NodeKind; extraNodes: number; description: string; runs: number; successRate: number | null; on: boolean }`
  - `export const METRICS: OrchMetric[]` (length 4)
  - `export const AUTOMATIONS: Automation[]` (length 3)

- [ ] **Step 1: Write the failing test**

```ts
// src/features/orchestrator/orchestrator-data.test.ts
import { describe, it, expect } from 'vitest'
import { METRICS, AUTOMATIONS } from './orchestrator-data'

describe('orchestrator-data', () => {
  it('defines exactly four metric cards in order', () => {
    expect(METRICS.map((m) => m.key)).toEqual([
      'runs', 'success', 'triggered', 'sentiment',
    ])
  })

  it('matches the Figma-exact headline metric values', () => {
    expect(METRICS.find((m) => m.key === 'runs')!.value).toBe('32,128')
    expect(METRICS.find((m) => m.key === 'success')!.value).toBe('98%')
    expect(METRICS.find((m) => m.key === 'triggered')!).toMatchObject({ value: '20,109', sub: '80%' })
    expect(METRICS.find((m) => m.key === 'sentiment')!).toMatchObject({ value: '69%', sentiment: true })
  })

  it('marks Success rate with an upward delta', () => {
    const success = METRICS.find((m) => m.key === 'success')!
    expect(success).toMatchObject({ delta: '10%', trend: 'up' })
  })

  it('defines the three Figma automations in order', () => {
    expect(AUTOMATIONS.map((a) => a.name)).toEqual([
      'Call users with issues', 'Refund request', 'Send discount code',
    ])
  })

  it('gives Refund request a null success rate and off state', () => {
    const refund = AUTOMATIONS.find((a) => a.name === 'Refund request')!
    expect(refund.successRate).toBeNull()
    expect(refund.on).toBe(false)
  })

  it('authors each automation with a positive run count and primary node', () => {
    for (const a of AUTOMATIONS) {
      expect(a.runs).toBeGreaterThan(0)
      expect(a.primaryNode.length).toBeGreaterThan(0)
      expect(a.extraNodes).toBeGreaterThanOrEqual(0)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/orchestrator-data.test.ts`
Expected: FAIL — cannot resolve `./orchestrator-data`.

- [ ] **Step 3: Write the data module**

```ts
// src/features/orchestrator/orchestrator-data.ts
// Mock data + types for the Orchestrator screen. Values are illustrative
// (no backend) and match the Figma frame exactly.

export type OrchMetric = {
  key: string
  label: string
  value: string          // "32,128", "98%", "20,109", "69%"
  sub?: string           // secondary figure beside the value ("80%")
  delta?: string         // pill delta ("10%")
  trend?: 'up'           // ↗ (only upward appears in the frame)
  sentiment?: boolean    // true → green smiley before the value
}

// Drives the NodeChips icon color.
export type NodeKind = 'sentiment' | 'event' | 'csat'

export type Automation = {
  id: string
  name: string
  updatedLabel: string        // "Last updated: Jan 4, 2024 9:25 AM by Brandon Mango"
  primaryNode: string         // "Sentiment Detection"
  primaryNodeKind: NodeKind
  extraNodes: number          // the "+4"
  description: string
  runs: number                // 200
  successRate: number | null  // 99 → bar; null → "n/a"
  on: boolean
}

export const METRICS: OrchMetric[] = [
  { key: 'runs', label: 'Total runs', value: '32,128' },
  { key: 'success', label: 'Success rate', value: '98%', delta: '10%', trend: 'up' },
  { key: 'triggered', label: 'Conversations triggered', value: '20,109', sub: '80%' },
  { key: 'sentiment', label: 'Positive sentiment', value: '69%', sentiment: true },
]

const UPDATED = 'Last updated: Jan 4, 2024 9:25 AM by Brandon Mango'

export const AUTOMATIONS: Automation[] = [
  {
    id: 'a1',
    name: 'Call users with issues',
    updatedLabel: UPDATED,
    primaryNode: 'Sentiment Detection',
    primaryNodeKind: 'sentiment',
    extraNodes: 4,
    description:
      'When a customer is having issues, trigger a follow-up call to offer assistance. After the call, update Hubspot with the call results.',
    runs: 200,
    successRate: 99,
    on: true,
  },
  {
    id: 'a2',
    name: 'Refund request',
    updatedLabel: UPDATED,
    primaryNode: 'Event Fired',
    primaryNodeKind: 'event',
    extraNodes: 1,
    description:
      'When a customer requests a refund, trigger human in the loop to get permission before providing the refund.',
    runs: 200,
    successRate: null,
    on: false,
  },
  {
    id: 'a3',
    name: 'Send discount code',
    updatedLabel: UPDATED,
    primaryNode: 'CSAT Submission',
    primaryNodeKind: 'csat',
    extraNodes: 2,
    description:
      'When a customer has interacted with support and provides a low feedback score, email them a discount code.',
    runs: 200,
    successRate: 99,
    on: true,
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/orchestrator-data.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/orchestrator-data.ts src/features/orchestrator/orchestrator-data.test.ts
git commit -m "feat: add Orchestrator mock data model"
```

---

### Task 2: MetricStrip

**Files:**
- Create: `src/features/orchestrator/MetricStrip.tsx`
- Test: `src/features/orchestrator/MetricStrip.test.tsx`

**Interfaces:**
- Consumes: `METRICS`, `type OrchMetric` from `./orchestrator-data`.
- Produces: `export function MetricStrip({ metrics }: { metrics: OrchMetric[] }): JSX.Element` — renders one card per metric.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/orchestrator/MetricStrip.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricStrip } from './MetricStrip'
import { METRICS } from './orchestrator-data'

describe('MetricStrip', () => {
  it('renders every metric card label and value', () => {
    render(<MetricStrip metrics={METRICS} />)
    for (const m of METRICS) {
      expect(screen.getByText(m.label)).toBeInTheDocument()
      expect(screen.getByText(m.value)).toBeInTheDocument()
    }
  })

  it('renders the success-rate delta pill', () => {
    render(<MetricStrip metrics={METRICS} />)
    expect(screen.getByText('10%')).toBeInTheDocument()
  })

  it('renders the conversations-triggered secondary figure', () => {
    render(<MetricStrip metrics={METRICS} />)
    expect(screen.getByText('80%')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/MetricStrip.test.tsx`
Expected: FAIL — cannot resolve `./MetricStrip`.

- [ ] **Step 3: Write the component**

```tsx
// src/features/orchestrator/MetricStrip.tsx
// The four Orchestrator metric cards. Presentational. The Success rate card
// shows an upward delta pill; Conversations triggered shows a secondary figure;
// Positive sentiment prefixes a green smiley. All values come from mock data.
import { Info, TrendingUp, Smile } from 'lucide-react'
import { type OrchMetric } from './orchestrator-data'

const INK = '#2f3130'
const GREEN = '#0f8a5f'

function Card({ metric }: { metric: OrchMetric }) {
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white px-5 py-4">
      <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
        <span>{metric.label}</span>
        <Info size={13} aria-hidden />
        {metric.delta && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px]"
            style={{ backgroundColor: '#e4f3ec', color: GREEN }}
          >
            {metric.delta}
            {metric.trend === 'up' && <TrendingUp size={12} aria-hidden />}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {metric.sentiment && <Smile size={26} aria-hidden style={{ color: GREEN }} />}
        <span className="text-[30px] font-semibold leading-none" style={{ color: INK }}>
          {metric.value}
        </span>
        {metric.sub && <span className="text-[15px] text-ink-muted">{metric.sub}</span>}
      </div>
    </div>
  )
}

export function MetricStrip({ metrics }: { metrics: OrchMetric[] }) {
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

Run: `npx vitest run src/features/orchestrator/MetricStrip.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/MetricStrip.tsx src/features/orchestrator/MetricStrip.test.tsx
git commit -m "feat: Orchestrator MetricStrip"
```

---

### Task 3: NodeChips + SuccessBar

Two small presentational cells used by the table. Grouped: both are pure display helpers with no state, and a reviewer would gate them together.

**Files:**
- Create: `src/features/orchestrator/NodeChips.tsx`
- Create: `src/features/orchestrator/SuccessBar.tsx`
- Test: `src/features/orchestrator/NodeChips.test.tsx`
- Test: `src/features/orchestrator/SuccessBar.test.tsx`

**Interfaces:**
- Consumes: `type NodeKind` from `./orchestrator-data`.
- Produces:
  - `export function NodeChips({ label, kind, extra }: { label: string; kind: NodeKind; extra: number }): JSX.Element`
  - `export function SuccessBar({ rate }: { rate: number | null }): JSX.Element` — renders a two-segment bar with `{rate}%` / `{100-rate}%` labels, or the muted text `n/a` when `rate === null`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/features/orchestrator/NodeChips.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NodeChips } from './NodeChips'

describe('NodeChips', () => {
  it('renders the node label and the extra-count suffix', () => {
    render(<NodeChips label="Sentiment Detection" kind="sentiment" extra={4} />)
    expect(screen.getByText('Sentiment Detection')).toBeInTheDocument()
    expect(screen.getByText('+4')).toBeInTheDocument()
  })

  it('omits the suffix when there are no extra nodes', () => {
    render(<NodeChips label="Event Fired" kind="event" extra={0} />)
    expect(screen.queryByText(/^\+/)).toBeNull()
  })
})
```

```tsx
// src/features/orchestrator/SuccessBar.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SuccessBar } from './SuccessBar'

describe('SuccessBar', () => {
  it('renders the success and remainder percentages', () => {
    render(<SuccessBar rate={99} />)
    expect(screen.getByText('99%')).toBeInTheDocument()
    expect(screen.getByText('1%')).toBeInTheDocument()
  })

  it('renders n/a when the rate is null', () => {
    render(<SuccessBar rate={null} />)
    expect(screen.getByText('n/a')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/orchestrator/NodeChips.test.tsx src/features/orchestrator/SuccessBar.test.tsx`
Expected: FAIL — cannot resolve the modules.

- [ ] **Step 3: Write the components**

```tsx
// src/features/orchestrator/NodeChips.tsx
// A rounded pill naming an automation's primary node, with a small kind-colored
// icon and a "+N" suffix for the remaining nodes. Presentational.
import { Activity, Zap, Star } from 'lucide-react'
import { type NodeKind } from './orchestrator-data'

const KIND: Record<NodeKind, { icon: typeof Activity; color: string }> = {
  sentiment: { icon: Activity, color: '#8b5cf6' },
  event: { icon: Zap, color: '#2563eb' },
  csat: { icon: Star, color: '#e0699a' },
}

export function NodeChips({ label, kind, extra }: { label: string; kind: NodeKind; extra: number }) {
  const { icon: Icon, color } = KIND[kind]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-2.5 py-1 text-[12px] text-ink-muted">
      <Icon size={12} aria-hidden style={{ color }} />
      {label}
      {extra > 0 && <span className="text-ink-muted">+{extra}</span>}
    </span>
  )
}
```

```tsx
// src/features/orchestrator/SuccessBar.tsx
// A two-segment horizontal bar showing an automation's run success rate: a green
// segment sized to the rate, a red remainder, and end labels. Renders muted
// "n/a" when the automation has no rate. Presentational.
const GREEN = '#0f8a5f'
const RED = '#e5484d'

export function SuccessBar({ rate }: { rate: number | null }) {
  if (rate === null) {
    return <span className="text-[13px] text-ink-muted">n/a</span>
  }
  const remainder = 100 - rate
  return (
    <div className="w-[120px]">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        <div style={{ width: `${rate}%`, backgroundColor: GREEN }} />
        <div style={{ width: `${remainder}%`, backgroundColor: RED }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
        <span>{rate}%</span>
        <span>{remainder}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/orchestrator/NodeChips.test.tsx src/features/orchestrator/SuccessBar.test.tsx`
Expected: PASS (4 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/NodeChips.tsx src/features/orchestrator/NodeChips.test.tsx src/features/orchestrator/SuccessBar.tsx src/features/orchestrator/SuccessBar.test.tsx
git commit -m "feat: Orchestrator NodeChips + SuccessBar"
```

---

### Task 4: AutomationTable (live toggles)

**Files:**
- Create: `src/features/orchestrator/AutomationTable.tsx`
- Test: `src/features/orchestrator/AutomationTable.test.tsx`

**Interfaces:**
- Consumes: `type Automation` from `./orchestrator-data`; `NodeChips` from `./NodeChips`; `SuccessBar` from `./SuccessBar`.
- Produces: `export function AutomationTable({ automations, isOn, onToggle }: { automations: Automation[]; isOn: (a: Automation) => boolean; onToggle: (id: string) => void }): JSX.Element`. Each row's toggle is a `role="switch"` button with `aria-label={`Activate ${automation.name}`}` and `aria-checked={isOn(automation)}`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/orchestrator/AutomationTable.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AutomationTable } from './AutomationTable'
import { AUTOMATIONS } from './orchestrator-data'

describe('AutomationTable', () => {
  it('renders a row per automation with its name and run count', () => {
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} />)
    for (const a of AUTOMATIONS) {
      expect(screen.getByText(a.name)).toBeInTheDocument()
    }
    expect(screen.getAllByText('200')).toHaveLength(AUTOMATIONS.length)
  })

  it('reflects on/off state via aria-checked', () => {
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} />)
    expect(screen.getByLabelText('Activate Call users with issues')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Activate Refund request')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onToggle with the row id when a switch is clicked', () => {
    const onToggle = vi.fn()
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={onToggle} />)
    fireEvent.click(screen.getByLabelText('Activate Refund request'))
    expect(onToggle).toHaveBeenCalledWith('a2')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/AutomationTable.test.tsx`
Expected: FAIL — cannot resolve `./AutomationTable`.

- [ ] **Step 3: Write the component**

```tsx
// src/features/orchestrator/AutomationTable.tsx
// The automations table. Columns: Automation (name + updated caption) · Nodes ·
// Description · Runs · Run success rate · Activate. The on/off toggle is driven
// by the parent via isOn/onToggle. Rows are separated cards, matching the frame.
import { type Automation } from './orchestrator-data'
import { NodeChips } from './NodeChips'
import { SuccessBar } from './SuccessBar'

const INK = '#2f3130'
const GREEN = '#0f8a5f'

function Toggle({ automation, on, onToggle }: { automation: Automation; on: boolean; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Activate ${automation.name}`}
        onClick={() => onToggle(automation.id)}
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ backgroundColor: on ? GREEN : '#c9c7c3' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: on ? '18px' : '2px' }}
        />
      </button>
      <span className="text-[13px]" style={{ color: INK }}>{on ? 'On' : 'Off'}</span>
    </div>
  )
}

export function AutomationTable({
  automations, isOn, onToggle,
}: {
  automations: Automation[]
  isOn: (a: Automation) => boolean
  onToggle: (id: string) => void
}) {
  return (
    <div>
      {/* Column headers */}
      <div className="grid grid-cols-[1.4fr_1fr_1.6fr_0.5fr_1fr_0.7fr] gap-4 px-5 py-3 text-[12px] font-medium text-ink-muted">
        <span>Automation</span>
        <span>Nodes</span>
        <span>Description</span>
        <span>Runs</span>
        <span>Run success rate</span>
        <span>Activate</span>
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-3">
        {automations.map((a) => (
          <div
            key={a.id}
            className="grid grid-cols-[1.4fr_1fr_1.6fr_0.5fr_1fr_0.7fr] items-center gap-4 rounded-2xl border border-surface-border bg-white px-5 py-4"
          >
            <div>
              <div className="text-[15px] font-semibold" style={{ color: INK }}>{a.name}</div>
              <div className="mt-1 text-[12px] text-ink-muted">{a.updatedLabel}</div>
            </div>
            <div>
              <NodeChips label={a.primaryNode} kind={a.primaryNodeKind} extra={a.extraNodes} />
            </div>
            <div className="border-l border-surface-border pl-4 text-[13px] text-ink-muted">{a.description}</div>
            <div className="text-[14px]" style={{ color: INK }}>{a.runs}</div>
            <div><SuccessBar rate={a.successRate} /></div>
            <div><Toggle automation={a} on={isOn(a)} onToggle={onToggle} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/AutomationTable.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/AutomationTable.tsx src/features/orchestrator/AutomationTable.test.tsx
git commit -m "feat: Orchestrator AutomationTable with live toggles"
```

---

### Task 5: OrchestratorScreen + toolbar + toggle state

**Files:**
- Create: `src/features/orchestrator/OrchestratorScreen.tsx`
- Test: `src/features/orchestrator/OrchestratorScreen.test.tsx`

**Interfaces:**
- Consumes: `METRICS`, `AUTOMATIONS`, `type Automation` from `./orchestrator-data`; `MetricStrip`; `AutomationTable`.
- Produces: `export function OrchestratorScreen(): JSX.Element`, root `data-testid="screen-orchestrator"`. Owns `useState<Automation[]>(AUTOMATIONS)`; `onToggle(id)` flips that row's `on`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/orchestrator/OrchestratorScreen.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { OrchestratorScreen } from './OrchestratorScreen'

describe('OrchestratorScreen', () => {
  it('renders the screen surface with title, metrics, and toolbar', () => {
    render(<OrchestratorScreen />)
    const screenEl = screen.getByTestId('screen-orchestrator')
    expect(within(screenEl).getByRole('heading', { name: 'Orchestrator' })).toBeInTheDocument()
    expect(within(screenEl).getByText('Total runs')).toBeInTheDocument()
    expect(within(screenEl).getByPlaceholderText('Search')).toBeInTheDocument()
    expect(within(screenEl).getByRole('button', { name: 'New automation' })).toBeInTheDocument()
  })

  it('toggles a row on and off', () => {
    render(<OrchestratorScreen />)
    const toggle = screen.getByLabelText('Activate Call users with issues')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/OrchestratorScreen.test.tsx`
Expected: FAIL — cannot resolve `./OrchestratorScreen`.

- [ ] **Step 3: Write the component**

```tsx
// src/features/orchestrator/OrchestratorScreen.tsx
// Orchestrator surface: title, a 4-card metric strip, a presentational toolbar
// (search / date-range / filters / Simulations / New automation), and the
// automations table. Only the row On/Off toggles carry state (local useState);
// every toolbar control is inert. No backend.
import { useState } from 'react'
import { Search, Calendar, ChevronDown } from 'lucide-react'
import { METRICS, AUTOMATIONS, type Automation } from './orchestrator-data'
import { MetricStrip } from './MetricStrip'
import { AutomationTable } from './AutomationTable'

export function OrchestratorScreen() {
  const [automations, setAutomations] = useState<Automation[]>(AUTOMATIONS)

  const onToggle = (id: string) =>
    setAutomations((rows) => rows.map((r) => (r.id === id ? { ...r, on: !r.on } : r)))

  return (
    <div data-testid="screen-orchestrator" className="h-full overflow-y-auto rounded-[26px] bg-white px-8 py-6">
      <h1 className="text-[22px] font-semibold text-ink">Orchestrator</h1>

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
        <div className="ml-auto flex items-center gap-3">
          <button type="button" className="rounded-full border border-surface-border px-4 py-2 text-[14px] text-ink">
            Simulations
          </button>
          <button type="button" className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white">
            New automation
          </button>
        </div>
      </div>

      <div className="mt-6">
        <AutomationTable automations={automations} isOn={(a) => a.on} onToggle={onToggle} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/OrchestratorScreen.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/OrchestratorScreen.tsx src/features/orchestrator/OrchestratorScreen.test.tsx
git commit -m "feat: assemble OrchestratorScreen with toolbar and toggle state"
```

---

### Task 6: Wire the route

**Files:**
- Modify: `src/routes.tsx` (add import; add `/orchestrator` to `BUILT`; add explicit route)
- Test: `src/features/orchestrator/orchestrator.routes.test.tsx`

**Interfaces:**
- Consumes: `OrchestratorScreen`; `routes` from `@/routes`; `findNavItemByPath` from `@/app/nav-config`.
- Produces: nothing (terminal wiring).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/orchestrator/orchestrator.routes.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { findNavItemByPath } from '@/app/nav-config'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('Orchestrator routing', () => {
  it('renders the Orchestrator screen at /orchestrator', () => {
    renderAt('/orchestrator')
    expect(screen.getByTestId('screen-orchestrator')).toBeInTheDocument()
  })

  it('does not render the placeholder at /orchestrator', () => {
    renderAt('/orchestrator')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('resolves /orchestrator to the Orchestrator nav item', () => {
    expect(findNavItemByPath('/orchestrator')?.label).toBe('Orchestrator')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/orchestrator.routes.test.tsx`
Expected: FAIL — `screen-orchestrator` not found (placeholder still renders; "Coming soon" present).

- [ ] **Step 3: Wire the route in `src/routes.tsx`**

Add the import beside the other feature-screen imports:

```tsx
import { OrchestratorScreen } from '@/features/orchestrator/OrchestratorScreen'
```

Add `/orchestrator` to the `BUILT` set:

```tsx
const BUILT = new Set(['/', '/insights', '/organization', '/ai-agents', '/orchestrator'])
```

Add the explicit route inside `children`, next to the `organization` route:

```tsx
          { path: 'organization', element: <OrganizationScreen /> },
          { path: 'orchestrator', element: <OrchestratorScreen /> },
          ...placeholderRoutes,
```

- [ ] **Step 4: Run the route test + full suite to verify green**

Run: `npx vitest run src/features/orchestrator/orchestrator.routes.test.tsx`
Expected: PASS (3 tests).

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests PASS; typecheck reports no errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes.tsx src/features/orchestrator/orchestrator.routes.test.tsx
git commit -m "feat: wire /orchestrator route to OrchestratorScreen"
```

---

## Self-Review

**Spec coverage:**
- Routing/placement (flat, BUILT + explicit route) → Task 6. ✓
- File layout (data, screen, MetricStrip, AutomationTable, NodeChips, SuccessBar) → Tasks 1–5. ✓
- Data model (OrchMetric, NodeKind, Automation; 4 metrics; 3 automations incl. null-rate) → Task 1. ✓
- Live toggles / inert toolbar → Tasks 4 & 5. ✓
- Styling (tokens, lucide, success bar, node chips) → Tasks 2–4. ✓
- Testing (data shape, table toggle, metric cards, route) → Tasks 1, 2, 4, 6. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `OrchMetric`/`NodeKind`/`Automation` defined in Task 1 and consumed with matching names/fields throughout. `AutomationTable` prop shape (`automations`/`isOn`/`onToggle`) matches its consumer in Task 5. Toggle `aria-label` format (`Activate ${name}`) is identical in Tasks 4 and 5 tests. ✓
