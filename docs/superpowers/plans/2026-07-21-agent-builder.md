# Agent Builder Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Agent Builder screen at `/ai-agents` — a channel switcher (Widget/Voice/Web Call/Headless), a five-metric strip, and a tabbed agents table (All/Active/Active subagents) with per-row on/off toggles — as presentational mock UI with light client state.

**Architecture:** Authored mock data in `agent-builder-data.ts` (one `CHANNELS` array; each channel holds 5 metrics + its agent rows). `AgentBuilderScreen` owns three pieces of local state — selected channel, selected agent-tab, and a per-row on/off override map — and composes `MetricStrip` + `AgentsTable`. It is a **nested view** rendered inside the existing `AiAgentsScreen` shell's `<Outlet/>` (a parallel session built that shell), wired as both the `/ai-agents` index and `/ai-agents/agent-builder`. No backend, no persistence, no runtime derivation of authored numbers.

**Tech Stack:** React 19, TypeScript (strict, pinned 5.9), Tailwind v4, react-router v7, lucide-react, Vitest + React Testing Library.

## Global Constraints

- **No backend.** All data is mocked in `src/features/ai-agents/agent-builder-data.ts`.
- **TypeScript strict**; keep new code fully typed. Do NOT bump TypeScript (pinned 5.9).
- **Reliable gates:** `npx tsc --noEmit`, `npx vitest run`, `npx vite build`. `pnpm lint` is broken upstream — do not rely on it.
- **Palette:** re-declare needed color constants locally in this feature (siblings CX Journey / HomeScreen do this). Reuse `INK '#2f3130'`, `MUTED '#8b8e89'`, `BORDER '#e2e0dd'`, `GREEN '#0f8a5f'`, `RED '#c8402f'`. Do NOT add a shared palette module. Do NOT introduce `font-['SF_Pro_*']` classes. Prefer semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`) where they exist.
- **Icons:** lucide-react only. No custom SVGs.
- **Widget channel data must match the Figma frame exactly** (values in Task 1). Other channels are authored plausibly within the stated shape.
- **`deflectionRate` is an authored display string** (matches `/^\d+%$/`), NOT derived from counts at runtime.
- **Nested view (revised at execution):** a parallel session already built `/ai-agents` as a nested-route surface — `AiAgentsScreen` (`src/features/ai-agents/AiAgentsScreen.tsx`) renders `h-full rounded-[26px] bg-white` with a `data-testid="screen-ai-agents"` wrapper around an `<Outlet/>`, and their `ConfigurationView` is a nested child (`data-testid="view-configuration"`, `flex h-full flex-col`, no surface chrome of its own). Agent Builder is a sibling nested view: it must NOT re-declare the surface (`rounded`/`bg-white`) or reuse `screen-ai-agents`. Use `data-testid="view-agent-builder"` and `className="h-full overflow-y-auto p-10"`. It renders inside their shell's Outlet in the app and stands alone in its unit test.
- **A11y:** channel switcher and agent tabs use `role="tab"` + `aria-selected`; row toggle is `role="switch"` with `aria-checked` and an accessible name including the agent name.

---

### Task 1: Data model + mock channel data

**Files:**
- Create: `src/features/ai-agents/agent-builder-data.ts`
- Test: `src/features/ai-agents/agent-builder-data.test.ts`

**Interfaces:**
- Produces: `ChannelKey`, `Trend`, `Metric`, `Agent`, `Channel` (exported types); `CHANNELS: Channel[]` (exported const). Consumed by every later task.

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-agents/agent-builder-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { CHANNELS, type ChannelKey } from './agent-builder-data'

const METRIC_KEYS = ['chats', 'resolutions', 'fallback', 'csat', 'cost']
const CHANNEL_KEYS: ChannelKey[] = ['widget', 'voice', 'webcall', 'headless']
const AGENT_COUNTS: Record<ChannelKey, number> = { widget: 3, voice: 2, webcall: 1, headless: 4 }

describe('agent-builder-data', () => {
  it('defines the four channels in order', () => {
    expect(CHANNELS.map((c) => c.key)).toEqual(CHANNEL_KEYS)
  })

  it('gives every channel exactly five metrics in fixed key order', () => {
    for (const c of CHANNELS) {
      expect(c.metrics.map((m) => m.key)).toEqual(METRIC_KEYS)
    }
  })

  it('gives each channel its authored agent count', () => {
    for (const c of CHANNELS) {
      expect(c.agents).toHaveLength(AGENT_COUNTS[c.key])
    }
  })

  it('gives every channel at least one On agent and one subagent', () => {
    for (const c of CHANNELS) {
      expect(c.agents.some((a) => a.on)).toBe(true)
      expect(c.agents.some((a) => a.isSubagent)).toBe(true)
    }
  })

  it('authors every deflectionRate as a percentage string', () => {
    for (const c of CHANNELS) {
      for (const a of c.agents) {
        expect(a.deflectionRate).toMatch(/^\d+%$/)
      }
    }
  })

  it('matches the Figma-exact Widget headline metric', () => {
    const widget = CHANNELS.find((c) => c.key === 'widget')!
    const chats = widget.metrics.find((m) => m.key === 'chats')!
    expect(chats.value).toBe('21,590')
    expect(widget.agents.map((a) => a.name)).toEqual([
      'Knowledge Retrieval', 'Fallback', 'Service cancellation',
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run agent-builder-data`
Expected: FAIL — cannot resolve `./agent-builder-data` (module not created yet).

- [ ] **Step 3: Create the data module**

Create `src/features/ai-agents/agent-builder-data.ts`:

```ts
// Mock data + types for the Agent Builder screen. All values are illustrative
// (no backend). The Widget channel matches the Figma design exactly; the other
// three channels carry plausible authored numbers so switching channels visibly
// changes the metrics and rows.

export type ChannelKey = 'widget' | 'voice' | 'webcall' | 'headless'
export type Trend = 'up' | 'down'

// One metric card. `delta`/`trend` drive the pill (↗/↘ + green/red tint); `good`
// decides the tint independent of direction (a falling Fallback is good → green).
// `accent` renders the value itself in green (CSAT in the Figma frame).
export type Metric = {
  key: string
  label: string
  value: string      // formatted, e.g. "21,590", "$706.8K", "4.1"
  sub?: string       // secondary figure shown beside the value (Resolutions → "80%")
  delta: string      // e.g. "0.3%"
  trend: Trend       // 'up' → ↗, 'down' → ↘
  good: boolean      // true → green pill, false → red pill
  accent?: boolean   // true → value text rendered green
}

// One agent row. `deflectionRate` is an authored display string (matches the Figma
// frame, which shows a headline rate independent of the raw counts) — not derived.
export type Agent = {
  id: string
  name: string
  on: boolean          // default toggle state for this channel
  isSubagent: boolean  // included in the "Active subagents" tab
  type: string         // "Knowledge Retrieval" | "Fallback" | "With intent"
  conversations: number
  deflections: number
  deflectionRate: string
  csat: number
  tags: string[]
}

export type Channel = {
  key: ChannelKey
  label: string        // "Widget" | "Voice" | "Web Call" | "Headless"
  metrics: Metric[]    // exactly 5, keys: chats, resolutions, fallback, csat, cost
  agents: Agent[]
}

export const CHANNELS: Channel[] = [
  {
    key: 'widget',
    label: 'Widget',
    metrics: [
      { key: 'chats', label: 'Total Chats', value: '21,590', delta: '0.3%', trend: 'down', good: false },
      { key: 'resolutions', label: 'Resolutions', value: '19,673', sub: '80%', delta: '4.2%', trend: 'up', good: true },
      { key: 'fallback', label: 'Fallback', value: '486', delta: '1.8%', trend: 'down', good: true },
      { key: 'csat', label: 'CSAT', value: '4.1', delta: '1.7%', trend: 'down', good: false, accent: true },
      { key: 'cost', label: 'Cost Savings', value: '$706.8K', delta: '3.4%', trend: 'up', good: true },
    ],
    agents: [
      { id: 'w1', name: 'Knowledge Retrieval', on: true, isSubagent: false, type: 'Knowledge Retrieval', conversations: 3000, deflections: 2500, deflectionRate: '95%', csat: 3, tags: ['member_center'] },
      { id: 'w2', name: 'Fallback', on: true, isSubagent: false, type: 'Fallback', conversations: 3000, deflections: 2500, deflectionRate: '95%', csat: 3, tags: ['member_center'] },
      { id: 'w3', name: 'Service cancellation', on: false, isSubagent: true, type: 'With intent', conversations: 3000, deflections: 2500, deflectionRate: '95%', csat: 3, tags: ['member_center'] },
    ],
  },
  {
    key: 'voice',
    label: 'Voice',
    metrics: [
      { key: 'chats', label: 'Total Calls', value: '8,120', delta: '2.1%', trend: 'up', good: true },
      { key: 'resolutions', label: 'Resolutions', value: '6,900', sub: '85%', delta: '1.4%', trend: 'up', good: true },
      { key: 'fallback', label: 'Fallback', value: '212', delta: '0.9%', trend: 'up', good: false },
      { key: 'csat', label: 'CSAT', value: '4.3', delta: '0.5%', trend: 'up', good: true, accent: true },
      { key: 'cost', label: 'Cost Savings', value: '$318.2K', delta: '2.7%', trend: 'up', good: true },
    ],
    agents: [
      { id: 'v1', name: 'Call routing', on: true, isSubagent: false, type: 'Knowledge Retrieval', conversations: 4200, deflections: 3600, deflectionRate: '86%', csat: 4, tags: ['support_line'] },
      { id: 'v2', name: 'Voicemail triage', on: false, isSubagent: true, type: 'With intent', conversations: 1800, deflections: 1200, deflectionRate: '67%', csat: 4, tags: ['support_line'] },
    ],
  },
  {
    key: 'webcall',
    label: 'Web Call',
    metrics: [
      { key: 'chats', label: 'Total Calls', value: '4,300', delta: '1.2%', trend: 'up', good: true },
      { key: 'resolutions', label: 'Resolutions', value: '3,655', sub: '85%', delta: '0.8%', trend: 'up', good: true },
      { key: 'fallback', label: 'Fallback', value: '128', delta: '1.1%', trend: 'down', good: true },
      { key: 'csat', label: 'CSAT', value: '4.4', delta: '0.3%', trend: 'up', good: true, accent: true },
      { key: 'cost', label: 'Cost Savings', value: '$164.5K', delta: '1.9%', trend: 'up', good: true },
    ],
    agents: [
      { id: 'c1', name: 'Web escalation', on: true, isSubagent: true, type: 'With intent', conversations: 2100, deflections: 1700, deflectionRate: '81%', csat: 4, tags: ['web_widget'] },
    ],
  },
  {
    key: 'headless',
    label: 'Headless',
    metrics: [
      { key: 'chats', label: 'Total Sessions', value: '12,004', delta: '3.6%', trend: 'up', good: true },
      { key: 'resolutions', label: 'Resolutions', value: '10,320', sub: '86%', delta: '2.2%', trend: 'up', good: true },
      { key: 'fallback', label: 'Fallback', value: '640', delta: '2.4%', trend: 'down', good: true },
      { key: 'csat', label: 'CSAT', value: '4.0', delta: '0.6%', trend: 'down', good: false, accent: true },
      { key: 'cost', label: 'Cost Savings', value: '$402.1K', delta: '4.1%', trend: 'up', good: true },
    ],
    agents: [
      { id: 'h1', name: 'API resolver', on: true, isSubagent: false, type: 'Knowledge Retrieval', conversations: 5000, deflections: 4300, deflectionRate: '86%', csat: 4, tags: ['api'] },
      { id: 'h2', name: 'Intent classifier', on: true, isSubagent: false, type: 'With intent', conversations: 3200, deflections: 2600, deflectionRate: '81%', csat: 3, tags: ['api'] },
      { id: 'h3', name: 'Fallback', on: false, isSubagent: false, type: 'Fallback', conversations: 1500, deflections: 900, deflectionRate: '60%', csat: 3, tags: ['api'] },
      { id: 'h4', name: 'Enrichment', on: true, isSubagent: true, type: 'With intent', conversations: 2304, deflections: 1800, deflectionRate: '78%', csat: 4, tags: ['api'] },
    ],
  },
]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run agent-builder-data`
Expected: PASS (all six tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/ai-agents/agent-builder-data.ts src/features/ai-agents/agent-builder-data.test.ts
git commit -m "feat: add Agent Builder mock data model"
```

---

### Task 2: MetricStrip component

**Files:**
- Create: `src/features/ai-agents/MetricStrip.tsx`

**Interfaces:**
- Consumes: `Metric` from `agent-builder-data.ts`.
- Produces: `MetricStrip({ metrics }: { metrics: Metric[] })` default-exportless named export. Renders the five metric cards for one channel.

- [ ] **Step 1: Create the component**

Create `src/features/ai-agents/MetricStrip.tsx`:

```tsx
// The five-metric performance strip for the active channel. Each card shows a
// label + info dot, a colored delta pill (↗/↘, green when good else red), and a
// large value (CSAT rendered green via `accent`). Presentational only.
import { Info, TrendingDown, TrendingUp } from 'lucide-react'
import { type Metric } from './agent-builder-data'

const INK = '#2f3130'
const MUTED = '#8b8e89'
const GREEN = '#0f8a5f'
const RED = '#c8402f'

function DeltaPill({ metric }: { metric: Metric }) {
  const positive = metric.good
  const color = positive ? GREEN : RED
  const Arrow = metric.trend === 'up' ? TrendingUp : TrendingDown
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ color, backgroundColor: positive ? 'rgba(15,138,95,0.10)' : 'rgba(200,64,47,0.10)' }}
    >
      {metric.delta}
      <Arrow size={13} aria-hidden />
    </span>
  )
}

export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {metrics.map((m) => (
        <div key={m.key} className="rounded-2xl border border-surface-border p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold" style={{ color: INK }}>{m.label}</span>
              <Info size={13} style={{ color: MUTED }} aria-hidden />
            </div>
            <DeltaPill metric={m} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[30px] font-semibold leading-none" style={{ color: m.accent ? GREEN : INK }}>
              {m.value}
            </span>
            {m.sub ? <span className="text-[15px] font-medium" style={{ color: MUTED }}>{m.sub}</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/ai-agents/MetricStrip.tsx
git commit -m "feat: add Agent Builder metric strip"
```

---

### Task 3: AgentsTable component

**Files:**
- Create: `src/features/ai-agents/AgentsTable.tsx`

**Interfaces:**
- Consumes: `Agent` from `agent-builder-data.ts`.
- Produces: `AgentsTable({ agents, isOn, onToggle }: { agents: Agent[]; isOn: (a: Agent) => boolean; onToggle: (id: string) => void })`. Renders the table header + one row per agent. The row toggle reflects `isOn(agent)` and calls `onToggle(agent.id)`. The parent (Task 4) is responsible for filtering `agents` to the active tab; this component renders whatever list it receives.

- [ ] **Step 1: Create the component**

Create `src/features/ai-agents/AgentsTable.tsx`:

```tsx
// The agents table for the active channel/tab. Columns: checkbox · Agents ·
// Activate (toggle) · Type · Conversations · Deflections · Deflection rate ·
// Avg. CSAT · Tags. The on/off toggle is driven by the parent via isOn/onToggle;
// checkboxes are inert.
import { Tag } from 'lucide-react'
import { type Agent } from './agent-builder-data'

const INK = '#2f3130'
const GREEN = '#0f8a5f'

const COLS = ['Type', 'Conversations', 'Deflections', 'Deflection rate', 'Avg. CSAT', 'Tags']

function Toggle({ agent, on, onToggle }: { agent: Agent; on: boolean; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Activate ${agent.name}`}
        onClick={() => onToggle(agent.id)}
        className="relative h-4 w-7 rounded-full transition-colors"
        style={{ backgroundColor: on ? GREEN : '#c9c7c3' }}
      >
        <span
          className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
          style={{ left: on ? '14px' : '2px' }}
        />
      </button>
      <span className="text-[13px]" style={{ color: INK }}>{on ? 'On' : 'Off'}</span>
    </div>
  )
}

export function AgentsTable({
  agents, isOn, onToggle,
}: {
  agents: Agent[]
  isOn: (a: Agent) => boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="w-10 px-3 py-3"><span className="sr-only">Select</span></th>
            <th className="px-3 py-3 text-left text-[12px] font-medium text-ink-muted">Agents</th>
            <th className="px-3 py-3 text-left text-[12px] font-medium text-ink-muted">Activate</th>
            {COLS.map((c) => (
              <th key={c} className="px-3 py-3 text-left text-[12px] font-medium text-ink-muted">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} className="border-b border-surface-border">
              <td className="px-3 py-4 align-middle">
                <span className="inline-block size-4 rounded border border-surface-border" aria-hidden />
              </td>
              <td className="px-3 py-4 align-middle text-[14px] font-medium" style={{ color: INK }}>{a.name}</td>
              <td className="px-3 py-4 align-middle">
                <Toggle agent={a} on={isOn(a)} onToggle={onToggle} />
              </td>
              <td className="px-3 py-4 align-middle text-[13px] text-ink-muted">{a.type}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.conversations.toLocaleString('en-US')}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.deflections.toLocaleString('en-US')}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.deflectionRate}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.csat}</td>
              <td className="px-3 py-4 align-middle">
                <div className="flex flex-wrap gap-1">
                  {a.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-md border border-surface-border px-2 py-0.5 text-[12px] text-ink-muted">
                      <Tag size={11} aria-hidden />
                      {t}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/ai-agents/AgentsTable.tsx
git commit -m "feat: add Agent Builder agents table"
```

---

### Task 4: AgentBuilderScreen (state + composition) + tests

**Files:**
- Create: `src/features/ai-agents/AgentBuilderScreen.tsx`
- Test: `src/features/ai-agents/AgentBuilderScreen.test.tsx`

**Interfaces:**
- Consumes: `CHANNELS`, `ChannelKey`, `Agent` from `agent-builder-data.ts`; `MetricStrip` (Task 2); `AgentsTable` (Task 3); lucide icons.
- Produces: `AgentBuilderScreen()` named export (the screen component wired into routing in Task 5).

- [ ] **Step 1: Write the failing tests**

Create `src/features/ai-agents/AgentBuilderScreen.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AgentBuilderScreen } from './AgentBuilderScreen'

function surface(): HTMLElement {
  return screen.getByTestId('view-agent-builder')
}

// Row presence is asserted via each row's toggle, whose accessible name
// ("Activate <agent name>") is unique — agent names also appear verbatim in the
// Type column (e.g. "Knowledge Retrieval", "Fallback"), so a bare text query on
// the name would match two cells.
describe('AgentBuilderScreen', () => {
  it('renders the Widget channel by default', () => {
    render(<AgentBuilderScreen />)
    const view = within(surface())
    expect(view.getByText('Agent Builder')).toBeInTheDocument()
    expect(view.getByText('Total Chats')).toBeInTheDocument()
    expect(view.getByText('21,590')).toBeInTheDocument()
    expect(view.getByRole('switch', { name: 'Activate Knowledge Retrieval' })).toBeInTheDocument()
  })

  it('switches channels, changing the headline metric and rows', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    await user.click(view.getByRole('tab', { name: 'Voice' }))
    expect(view.getByText('8,120')).toBeInTheDocument()
    expect(view.queryByText('21,590')).not.toBeInTheDocument()
    expect(view.getByRole('switch', { name: 'Activate Call routing' })).toBeInTheDocument()
    // Widget's agents are gone.
    expect(view.queryByRole('switch', { name: 'Activate Knowledge Retrieval' })).not.toBeInTheDocument()
  })

  it('filters to only On agents under the Active agents tab', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    // Widget: Service cancellation is Off by default.
    await user.click(view.getByRole('tab', { name: 'Active agents' }))
    expect(view.getByRole('switch', { name: 'Activate Knowledge Retrieval' })).toBeInTheDocument()
    expect(view.queryByRole('switch', { name: 'Activate Service cancellation' })).not.toBeInTheDocument()
  })

  it('moves a row out of Active when toggled off', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    // Turn Knowledge Retrieval off (on the All tab), then check the Active tab.
    await user.click(view.getByRole('switch', { name: 'Activate Knowledge Retrieval' }))
    await user.click(view.getByRole('tab', { name: 'Active agents' }))
    expect(view.queryByRole('switch', { name: 'Activate Knowledge Retrieval' })).not.toBeInTheDocument()
    // Fallback (also On) is still present.
    expect(view.getByRole('switch', { name: 'Activate Fallback' })).toBeInTheDocument()
  })

  it('shows only subagents under the Active subagents tab', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    await user.click(view.getByRole('tab', { name: 'Active subagents' }))
    // Widget: only Service cancellation is a subagent.
    expect(view.getByRole('switch', { name: 'Activate Service cancellation' })).toBeInTheDocument()
    expect(view.queryByRole('switch', { name: 'Activate Knowledge Retrieval' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run AgentBuilderScreen`
Expected: FAIL — cannot resolve `./AgentBuilderScreen`.

- [ ] **Step 3: Create the screen**

Create `src/features/ai-agents/AgentBuilderScreen.tsx`:

```tsx
// Agent Builder — the AI Agents landing screen. Owns three pieces of local
// state: the selected channel, the selected agent tab, and a per-row on/off
// override map (keyed by agent id; effective state is override ?? agent.on).
// Switching channels clears the overrides so each channel starts from its
// authored toggles. All search/filter/action affordances are inert (mock scope).
import { useState } from 'react'
import { Calendar, ChevronDown, Code2, Globe, MessageSquare, Phone, Plus, Search } from 'lucide-react'
import { CHANNELS, type Agent, type ChannelKey } from './agent-builder-data'
import { MetricStrip } from './MetricStrip'
import { AgentsTable } from './AgentsTable'

const INK = '#2f3130'

type AgentTab = 'all' | 'active' | 'subagents'

const AGENT_TABS: { key: AgentTab; label: string }[] = [
  { key: 'all', label: 'All agents' },
  { key: 'active', label: 'Active agents' },
  { key: 'subagents', label: 'Active subagents' },
]

const CHANNEL_ICON: Record<ChannelKey, typeof MessageSquare> = {
  widget: MessageSquare,
  voice: Phone,
  webcall: Globe,
  headless: Code2,
}

export function AgentBuilderScreen() {
  const [channelKey, setChannelKey] = useState<ChannelKey>('widget')
  const [tab, setTab] = useState<AgentTab>('all')
  // Per-row on/off overrides; cleared on channel switch.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const channel = CHANNELS.find((c) => c.key === channelKey)!
  const isOn = (a: Agent) => overrides[a.id] ?? a.on
  const toggle = (id: string) =>
    setOverrides((prev) => {
      const current = prev[id] ?? channel.agents.find((a) => a.id === id)!.on
      return { ...prev, [id]: !current }
    })

  const selectChannel = (key: ChannelKey) => {
    setChannelKey(key)
    setOverrides({})
  }

  const visibleAgents = channel.agents.filter((a) => {
    if (tab === 'active') return isOn(a)
    if (tab === 'subagents') return a.isSubagent
    return true
  })

  return (
    // Nested view: the AiAgentsScreen shell already provides the white rounded
    // surface via its Outlet, so this view only supplies scroll + padding.
    <div
      data-testid="view-agent-builder"
      className="h-full overflow-y-auto p-10"
    >
      {/* Header: title + date caption (left), channel switcher (right) */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[26px] leading-8 text-ink">Agent Builder</h1>
          <span className="text-[14px] text-ink-muted">5/2/2026 - 6/1/2026</span>
        </div>
        <div role="tablist" aria-label="Channel" className="flex items-center gap-1 rounded-full bg-[#f4f3f1] p-1">
          {CHANNELS.map((c) => {
            const Icon = CHANNEL_ICON[c.key]
            const active = c.key === channelKey
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectChannel(c.key)}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  backgroundColor: active ? '#ffffff' : 'transparent',
                  color: active ? INK : '#8b8e89',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon size={14} aria-hidden />
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Metric strip */}
      <div className="mb-8">
        <MetricStrip metrics={channel.metrics} />
      </div>

      {/* Agent tabs + trailing add affordance */}
      <div className="mb-4 flex items-center gap-6 border-b border-surface-border">
        <div role="tablist" aria-label="Agents" className="flex items-center gap-6">
          {AGENT_TABS.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={
                  active
                    ? '-mb-px border-b-2 border-ink pb-3 text-[14px] font-medium text-ink'
                    : 'pb-3 text-[14px] text-ink-muted'
                }
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <button type="button" aria-label="Add agent group" className="pb-3 text-ink-muted">
          <Plus size={16} aria-hidden />
        </button>
      </div>

      {/* Toolbar (inert affordances) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5">
            <Search size={14} className="text-ink-muted" aria-hidden />
            <input
              type="text"
              placeholder="Search"
              className="w-40 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-[13px] text-ink">
            <Calendar size={14} className="text-ink-muted" aria-hidden />
            May 02, 2026 - Jun 01, 2026
            <ChevronDown size={14} className="text-ink-muted" aria-hidden />
          </button>
          <button type="button" className="rounded-lg border border-surface-border px-3 py-1.5 text-[13px] text-ink">
            All filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-full border border-surface-border px-4 py-1.5 text-[13px] font-medium text-ink">
            Preview
          </button>
          <button type="button" className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-semibold text-white">
            New Agent
          </button>
        </div>
      </div>

      {/* Agents table */}
      <AgentsTable agents={visibleAgents} isOn={isOn} onToggle={toggle} />
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run AgentBuilderScreen`
Expected: PASS (all five tests).

- [ ] **Step 5: Full gates**

Run: `npx tsc --noEmit` → clean; `npx vitest run` → all pass; `npx vite build` → succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/features/ai-agents/AgentBuilderScreen.tsx src/features/ai-agents/AgentBuilderScreen.test.tsx
git commit -m "feat: add Agent Builder screen with channel + agent-tab state"
```

---

### Task 5: Wire the nested routes

**Context:** A parallel session already built `/ai-agents` as a nested-route surface. `src/routes.tsx` currently has (verify before editing — the exact block may differ slightly):

```tsx
          {
            path: 'ai-agents',
            element: <AiAgentsScreen />,
            children: [
              { index: true, element: <ConfigurationView /> },
              { path: 'configuration', element: <ConfigurationView /> },
              { path: 'agent-builder', element: <PlaceholderScreen title="Agent Builder" /> },
              { path: 'qa', element: <PlaceholderScreen title="QA" /> },
            ],
          },
```

`/ai-agents` is already in the `BUILT` set — do NOT change `BUILT`. `AiAgentsScreen` and `ConfigurationView` imports already exist. The routes test lives at `src/features/ai-agents/ai-agents.routes.test.tsx`.

**Files:**
- Modify: `src/routes.tsx`
- Modify: `src/features/ai-agents/ai-agents.routes.test.tsx`

**Interfaces:**
- Consumes: `AgentBuilderScreen` (Task 4), existing `AiAgentsScreen` shell.
- Produces: `/ai-agents` (index) and `/ai-agents/agent-builder` both render `AgentBuilderScreen` inside the shell; `/ai-agents/configuration` still renders `ConfigurationView`.

- [ ] **Step 1: Update the failing routes test first**

The parallel session's test currently asserts Configuration at the index and a placeholder at `/ai-agents/agent-builder`. Under this feature, the index becomes Agent Builder and `/agent-builder` is the real view. In `src/features/ai-agents/ai-agents.routes.test.tsx`, replace the first and third `it(...)` blocks:

Replace:

```tsx
  it('renders Configuration at /ai-agents (index)', () => {
    renderAt('/ai-agents')
    expect(screen.getByTestId('view-configuration')).toBeInTheDocument()
  })
```

with:

```tsx
  it('renders Agent Builder at /ai-agents (index)', () => {
    renderAt('/ai-agents')
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })
```

Replace:

```tsx
  it('renders a placeholder at /ai-agents/agent-builder', () => {
    renderAt('/ai-agents/agent-builder')
    expect(screen.getByText('Agent Builder')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })
```

with:

```tsx
  it('renders Agent Builder at /ai-agents/agent-builder', () => {
    renderAt('/ai-agents/agent-builder')
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })
```

Leave the `/ai-agents/configuration` and `findNavItemByPath` tests unchanged.

- [ ] **Step 2: Run the routes test to verify it fails**

Run: `npx vitest run ai-agents.routes`
Expected: the index and agent-builder tests FAIL (`view-agent-builder` not found — still routed to Configuration/placeholder).

- [ ] **Step 3: Add the import**

In `src/routes.tsx`, add alongside the existing `AiAgentsScreen`/`ConfigurationView` imports:

```tsx
import { AgentBuilderScreen } from '@/features/ai-agents/AgentBuilderScreen'
```

- [ ] **Step 4: Repoint the index and agent-builder child routes**

In the `ai-agents` route's `children` array, change the `index` and `agent-builder` entries to render `AgentBuilderScreen` (leave `configuration` and `qa` untouched):

```tsx
            children: [
              { index: true, element: <AgentBuilderScreen /> },
              { path: 'configuration', element: <ConfigurationView /> },
              { path: 'agent-builder', element: <AgentBuilderScreen /> },
              { path: 'qa', element: <PlaceholderScreen title="QA" /> },
            ],
```

- [ ] **Step 5: Full gates**

Run: `npx vitest run ai-agents.routes` → pass; then `npx tsc --noEmit` → clean; `npx vitest run` → all pass; `npx vite build` → succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/routes.tsx src/features/ai-agents/ai-agents.routes.test.tsx
git commit -m "feat: route /ai-agents index + agent-builder to the Agent Builder screen"
```

---

## Self-Review

- **Spec coverage:**
  - Route: `/ai-agents` index + `/ai-agents/agent-builder` render Agent Builder inside the existing nested shell; Configuration untouched — Task 5. ✅
  - Header title + date caption + channel switcher — Task 4 Step 3. ✅
  - Five-metric strip with delta pills + CSAT accent — Task 2. ✅
  - Agent tabs (All/Active/Active subagents) + inert `+` — Task 4. ✅
  - Toolbar (search/date/All filters/Preview/New Agent), all inert — Task 4. ✅
  - Agents table columns (checkbox/Agents/Activate/Type/Conversations/Deflections/Deflection rate/Avg. CSAT/Tags) — Task 3. ✅
  - Channel switch swaps metrics + rows; overrides cleared on switch — Task 4 (`selectChannel`). ✅
  - Agent-tab filtering (all/active/subagents) — Task 4 (`visibleAgents`). ✅
  - Row toggle moves rows between All/Active — Task 4 (`isOn`/`toggle`) + Task 3 (`Toggle`). ✅
  - Widget data Figma-exact; other channels authored — Task 1. ✅
  - `deflectionRate` authored display string — Task 1 + data test. ✅
  - A11y: channel switcher + agent tabs `role="tab"`/`aria-selected`; toggle `role="switch"`/`aria-checked`/labelled — Tasks 3 & 4. ✅
  - Tests (data invariants + behavior scoped to `view-agent-builder`) — Tasks 1 & 4. ✅
- **Placeholder scan:** none — every step carries real code/commands.
- **Type consistency:** `Metric`/`Agent`/`Channel`/`ChannelKey` defined in Task 1, imported unchanged in Tasks 2–4. `AgentsTable` props (`agents`/`isOn`/`onToggle`) match the screen's call site in Task 4. `MetricStrip` prop `metrics` matches. `CHANNEL_ICON` keyed by `ChannelKey`. Metric key order `['chats','resolutions','fallback','csat','cost']` consistent between data, data test, and render.
- **Test note:** agent names appear verbatim in BOTH the Agents column and the Type column (e.g. "Knowledge Retrieval", "Fallback"), so a bare text query on a name would match two cells and throw. Behavior tests therefore assert row presence via each row's toggle, whose accessible name `"Activate <agent name>"` is unique per row. Headline-metric assertions (`21,590`, `8,120`) are unique strings and are queried directly.
```
