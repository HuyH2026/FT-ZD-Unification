# Agent Builder Create/Edit Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static Agent Builder list into a working flow — a "New Agent" slide-over create form and a fully-interactive Autoflow policy editor (editable prose, static entity chips, drag-and-drop Steps into both the policy and a block canvas), reached by clicking an agent row or creating one.

**Architecture:** A new mutable `agent-store` module (React hook + `localStorage`) seeds from the existing frozen `CHANNELS` const and owns agent records extended with editor fields (`policy`, `blocks`, create-form metadata). `AgentBuilderScreen` reads the store, makes rows clickable (→ `/ai-agents/:agentId`), and opens `CreateAgentPanel`. A new `AgentEditorScreen` (nested route) hosts a single `react-dnd` `DndProvider` over a header, the `PolicyEditor` (prose + inline chip drop zone), a `BlockCanvas` (drop + reorder + remove), and a `StepsPalette` (drag sources).

**Tech Stack:** React 19, TypeScript (strict), React Router v7 (`react-router`), react-dnd + react-dnd-html5-backend, Tailwind v4, lucide-react, Vitest + React Testing Library (jsdom).

## Global Constraints

- **No backend.** All state in-memory + `localStorage`; guard every access with `window.localStorage?.` so jsdom degrades gracefully.
- **Deterministic ids only.** Mint ids from a module `seq` counter (`++seq`). Never use `Date.now()` or `Math.random()` (unavailable/nondeterministic here). On store load, sync `seq` past any persisted ids to prevent collisions.
- **Imports from `react-router`**, never `react-router-dom`.
- **Path alias `@` → `src/`.** Do not add `baseUrl` to `tsconfig.json`.
- **TypeScript strict**; keep all new code fully typed.
- **Tokens over hex:** prefer semantic classes (`text-ink`, `text-ink-muted`, `border-surface-border`) and exposed Garden palette classes; inline one-off hues only where no token exists (match the existing `INK = '#2f3130'`, `GREEN = '#0f8a5f'` constants already used in this feature).
- **Gates:** `pnpm typecheck`, `pnpm test`, `pnpm build`. (`pnpm lint` is a known upstream TS7/eslint gap — do not treat its crash as a failure.) `npx` equivalents work if `pnpm` is absent.
- **Tests assert real behavior**; scope screen assertions with `within(getByTestId(...))` per existing convention.

---

### Task 1: Agent store — types, seed, and pure reducers

**Files:**
- Create: `src/features/ai-agents/agent-store.ts`
- Test: `src/features/ai-agents/agent-store.test.ts`

**Interfaces:**
- Consumes: `CHANNELS`, `Agent`, `ChannelKey` from `./agent-builder-data`.
- Produces:
  - Types `StepType`, `PolicyChip`, `PolicyProse`, `PolicySegment`, `PolicyDoc`, `CanvasBlock`, `StoredAgent`.
  - `STEP_TYPES: { type: StepType; label: string }[]`
  - `chipVariantForStep(step: StepType): PolicyChip['variant']`
  - Pure reducers: `insertChip(doc, index, chip): PolicyDoc`, `removeChip(doc, chipId): PolicyDoc`, `appendBlock(blocks, block): CanvasBlock[]`, `moveBlock(blocks, from, to): CanvasBlock[]`, `removeBlock(blocks, id): CanvasBlock[]`
  - `seedAgents(): StoredAgent[]`, `nextId(prefix): string`, `syncSeq(agents): void`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import {
  STEP_TYPES, chipVariantForStep,
  insertChip, removeChip, appendBlock, moveBlock, removeBlock,
  seedAgents, nextId, type PolicyDoc, type CanvasBlock,
} from './agent-store'

const doc: PolicyDoc = {
  title: 'Autoflow policy',
  segments: [
    { kind: 'prose', id: 'p1', text: 'Reveal ' },
    { kind: 'chip', id: 'c1', variant: 'form', label: 'Survey' },
    { kind: 'prose', id: 'p2', text: ' to identify.' },
  ],
}

describe('agent-store reducers', () => {
  it('exposes the palette step types with labels', () => {
    expect(STEP_TYPES.map((s) => s.type)).toContain('condition')
    expect(STEP_TYPES.find((s) => s.type === 'code')?.label).toBe('Code')
  })

  it('maps a step type to a chip variant', () => {
    expect(chipVariantForStep('form')).toBe('form')
    expect(chipVariantForStep('condition')).toBe('routing')
    expect(chipVariantForStep('code')).toBe('action')
  })

  it('inserts a chip at a segment index', () => {
    const next = insertChip(doc, 1, { kind: 'chip', id: 'c2', variant: 'action', label: 'Apply' })
    expect(next.segments[1]).toMatchObject({ id: 'c2', label: 'Apply' })
    expect(next.segments).toHaveLength(4)
    expect(doc.segments).toHaveLength(3) // original untouched
  })

  it('removes a chip by id', () => {
    const next = removeChip(doc, 'c1')
    expect(next.segments.some((s) => s.kind === 'chip')).toBe(false)
  })

  it('appends, moves, and removes canvas blocks', () => {
    const a: CanvasBlock = { id: 'b1', stepType: 'condition', title: 'Untitled classic block 01' }
    const b: CanvasBlock = { id: 'b2', stepType: 'code', title: 'Untitled classic block 02' }
    const two = appendBlock(appendBlock([], a), b)
    expect(two.map((x) => x.id)).toEqual(['b1', 'b2'])
    expect(moveBlock(two, 0, 1).map((x) => x.id)).toEqual(['b2', 'b1'])
    expect(removeBlock(two, 'b1').map((x) => x.id)).toEqual(['b2'])
  })

  it('seeds Service cancellation with policy chips and a classic block', () => {
    const agents = seedAgents()
    const svc = agents.find((x) => x.id === 'w3')!
    expect(svc.policy.segments.some((s) => s.kind === 'chip')).toBe(true)
    expect(svc.blocks.length).toBeGreaterThan(0)
  })

  it('mints unique deterministic ids', () => {
    expect(nextId('agent')).not.toBe(nextId('agent'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/agent-store.test.ts`
Expected: FAIL — cannot resolve `./agent-store`.

- [ ] **Step 3: Write minimal implementation**

```ts
// Mutable agent layer for the Agent Builder create/edit flow. Seeds from the
// frozen CHANNELS const and extends each agent with editor fields (policy doc +
// canvas blocks) and create-form metadata. Pure reducers here are unit-tested
// without jsdom; the React hook (below) wires them to state + localStorage.
import { CHANNELS, type Agent, type ChannelKey } from './agent-builder-data'

export type StepType =
  | 'options' | 'condition' | 'form' | 'text' | 'dynamic-card'
  | 'image' | 'csat' | 'attachment' | 'code'

export const STEP_TYPES: { type: StepType; label: string }[] = [
  { type: 'options', label: 'Options' },
  { type: 'condition', label: 'Condition' },
  { type: 'form', label: 'Form' },
  { type: 'text', label: 'Text' },
  { type: 'dynamic-card', label: 'Dynamic card' },
  { type: 'image', label: 'Image' },
  { type: 'csat', label: 'CSAT Survey Trigger Point' },
  { type: 'attachment', label: 'Attachment' },
  { type: 'code', label: 'Code' },
]

export type ChipVariant = 'form' | 'routing' | 'event' | 'action' | 'trigger'

export type PolicyChip = { kind: 'chip'; id: string; variant: ChipVariant; label: string }
export type PolicyProse = { kind: 'prose'; id: string; text: string }
export type PolicySegment = PolicyProse | PolicyChip
export type PolicyDoc = { title: string; segments: PolicySegment[] }

export type CanvasBlock = { id: string; stepType: StepType; title: string }

export type StoredAgent = Agent & {
  channel: ChannelKey
  policy: PolicyDoc
  blocks: CanvasBlock[]
  universalBrand: boolean
  tags: string[]
  triggeredWhen: string
  trainingPhrases: string[]
}

let seq = 0
export function nextId(prefix: string): string {
  return `${prefix}-${++seq}`
}
export function syncSeq(agents: { id: string }[]): void {
  for (const a of agents) {
    const m = /-(\d+)$/.exec(a.id)
    if (m) seq = Math.max(seq, Number(m[1]))
  }
}

export function chipVariantForStep(step: StepType): ChipVariant {
  switch (step) {
    case 'form': return 'form'
    case 'condition': return 'routing'
    case 'csat': return 'event'
    case 'text': return 'trigger'
    default: return 'action'
  }
}

export function insertChip(doc: PolicyDoc, index: number, chip: PolicyChip): PolicyDoc {
  const segments = [...doc.segments]
  segments.splice(index, 0, chip)
  return { ...doc, segments }
}
export function removeChip(doc: PolicyDoc, chipId: string): PolicyDoc {
  return { ...doc, segments: doc.segments.filter((s) => !(s.kind === 'chip' && s.id === chipId)) }
}
export function appendBlock(blocks: CanvasBlock[], block: CanvasBlock): CanvasBlock[] {
  return [...blocks, block]
}
export function moveBlock(blocks: CanvasBlock[], from: number, to: number): CanvasBlock[] {
  const next = [...blocks]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
export function removeBlock(blocks: CanvasBlock[], id: string): CanvasBlock[] {
  return blocks.filter((b) => b.id !== id)
}

// Exact "Service cancellation" policy transcribed from the Figma frame.
function serviceCancellationPolicy(): PolicyDoc {
  return {
    title: 'Autoflow policy',
    segments: [
      { kind: 'prose', id: 'p1', text: 'Reveal ' },
      { kind: 'chip', id: 'c1', variant: 'form', label: 'Form: Cancellation Diagnostic Survey' },
      { kind: 'prose', id: 'p2', text: ' to identify the root cause. Trigger ' },
      { kind: 'chip', id: 'c2', variant: 'routing', label: 'Retention Routing' },
      { kind: 'prose', id: 'p3', text: ' Based on retention classification, explain to the customer that their problem is solvable and offer 30 days free while the team works on resolving it. Ask if they want to take the offer. Collect their decision via ' },
      { kind: 'chip', id: 'c3', variant: 'form', label: '30-Day Free - Accept or Decline' },
      { kind: 'prose', id: 'p4', text: ' If the customer accepts, fire event ' },
      { kind: 'chip', id: 'c4', variant: 'event', label: 'Retention Saved' },
      { kind: 'prose', id: 'p5', text: ' and trigger ' },
      { kind: 'chip', id: 'c5', variant: 'action', label: 'Apply 30-Day Free' },
      { kind: 'prose', id: 'p6', text: ' and ' },
      { kind: 'chip', id: 'c6', variant: 'action', label: 'Schedule Day-30 Check-in' },
      { kind: 'prose', id: 'p7', text: ' If the customer declines, trigger ' },
      { kind: 'chip', id: 'c7', variant: 'action', label: 'Process Cancellation' },
      { kind: 'prose', id: 'p8', text: ' At close, trigger ' },
      { kind: 'chip', id: 'c8', variant: 'form', label: 'CSAT Survey' },
    ],
  }
}

function starterPolicy(name: string): PolicyDoc {
  return {
    title: 'Autoflow policy',
    segments: [{ kind: 'prose', id: 'p1', text: `Describe how the ${name} agent should respond.` }],
  }
}

export function seedAgents(): StoredAgent[] {
  const agents: StoredAgent[] = []
  for (const channel of CHANNELS) {
    for (const a of channel.agents) {
      agents.push({
        ...a,
        channel: channel.key,
        policy: a.id === 'w3' ? serviceCancellationPolicy() : starterPolicy(a.name),
        blocks: a.id === 'w3'
          ? [{ id: 'b-seed-1', stepType: 'condition', title: 'Untitled classic block 01' }]
          : [],
        universalBrand: false,
        tags: a.tags,
        triggeredWhen: '',
        trainingPhrases: [],
      })
    }
  }
  return agents
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/agent-store.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/agent-store.ts src/features/ai-agents/agent-store.test.ts
git commit -m "feat(ai-agents): agent store types, seed, and pure reducers"
```

---

### Task 2: Agent store — React hook with localStorage persistence

**Files:**
- Modify: `src/features/ai-agents/agent-store.ts`
- Test: `src/features/ai-agents/agent-store.hook.test.tsx`

**Interfaces:**
- Consumes: everything from Task 1.
- Produces: `useAgentStore()` returning
  `{ agents: StoredAgent[]; getAgent(id): StoredAgent | undefined; createAgent(fields: CreateAgentFields): string; updateAgent(id, patch: Partial<StoredAgent>): void; toggleAgent(id): void }`
  and type `CreateAgentFields = { name: string; channel: ChannelKey; universalBrand: boolean; tags: string[]; triggeredWhen: string; trainingPhrases: string[] }`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentStore } from './agent-store'

function mockStorage() {
  const map = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  })
  return map
}

describe('useAgentStore', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('seeds agents and finds one by id', () => {
    mockStorage()
    const { result } = renderHook(() => useAgentStore())
    expect(result.current.getAgent('w3')?.name).toBe('Service cancellation')
  })

  it('creates a new agent and returns its id', () => {
    mockStorage()
    const { result } = renderHook(() => useAgentStore())
    let id = ''
    act(() => {
      id = result.current.createAgent({
        name: 'Refund helper', channel: 'widget', universalBrand: false,
        tags: [], triggeredWhen: 'user wants a refund', trainingPhrases: ['refund'],
      })
    })
    expect(result.current.getAgent(id)?.name).toBe('Refund helper')
  })

  it('toggles an agent on/off', () => {
    mockStorage()
    const { result } = renderHook(() => useAgentStore())
    const before = result.current.getAgent('w1')!.on
    act(() => result.current.toggleAgent('w1'))
    expect(result.current.getAgent('w1')!.on).toBe(!before)
  })

  it('persists created agents across a remount', () => {
    mockStorage()
    const first = renderHook(() => useAgentStore())
    let id = ''
    act(() => {
      id = first.result.current.createAgent({
        name: 'Persisted', channel: 'widget', universalBrand: false,
        tags: [], triggeredWhen: '', trainingPhrases: [],
      })
    })
    first.unmount()
    const second = renderHook(() => useAgentStore())
    expect(second.result.current.getAgent(id)?.name).toBe('Persisted')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/agent-store.hook.test.tsx`
Expected: FAIL — `useAgentStore` is not exported.

- [ ] **Step 3: Write minimal implementation** (append to `agent-store.ts`)

```ts
import { useCallback, useMemo, useState } from 'react'

const STORAGE_KEY = 'agent-builder-store-v1'
const STEP_TITLE: Record<StepType, string> = STEP_TYPES.reduce(
  (acc, s) => ({ ...acc, [s.type]: s.label }), {} as Record<StepType, string>,
)

export type CreateAgentFields = {
  name: string
  channel: ChannelKey
  universalBrand: boolean
  tags: string[]
  triggeredWhen: string
  trainingPhrases: string[]
}

function loadAgents(): StoredAgent[] {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAgent[]
      if (Array.isArray(parsed) && parsed.every((a) => a && typeof a.id === 'string')) {
        syncSeq(parsed)
        return parsed
      }
    }
  } catch {
    /* ignore missing/malformed storage */
  }
  const seeded = seedAgents()
  syncSeq(seeded)
  return seeded
}

export function useAgentStore() {
  const [agents, setAgents] = useState<StoredAgent[]>(() => loadAgents())

  const persist = useCallback((next: StoredAgent[]) => {
    setAgents(next)
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore quota/availability errors */
    }
  }, [])

  return useMemo(() => ({
    agents,
    getAgent: (id: string) => agents.find((a) => a.id === id),
    createAgent: (fields: CreateAgentFields) => {
      const id = nextId('agent')
      const agent: StoredAgent = {
        id, name: fields.name, on: true, isSubagent: false, type: 'With intent',
        conversations: 0, deflections: 0, deflectionRate: '0%', csat: 0,
        channel: fields.channel, tags: fields.tags,
        universalBrand: fields.universalBrand, triggeredWhen: fields.triggeredWhen,
        trainingPhrases: fields.trainingPhrases,
        policy: { title: 'Autoflow policy', segments: [{ kind: 'prose', id: nextId('p'), text: '' }] },
        blocks: [],
      }
      persist([...agents, agent])
      return id
    },
    updateAgent: (id: string, patch: Partial<StoredAgent>) =>
      persist(agents.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    toggleAgent: (id: string) =>
      persist(agents.map((a) => (a.id === id ? { ...a, on: !a.on } : a))),
  }), [agents, persist])
}

export { STEP_TITLE }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/agent-store.hook.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/agent-store.ts src/features/ai-agents/agent-store.hook.test.tsx
git commit -m "feat(ai-agents): useAgentStore hook with localStorage persistence"
```

---

### Task 3: Make agent rows clickable → navigate to the editor

**Files:**
- Modify: `src/features/ai-agents/AgentsTable.tsx`
- Modify: `src/features/ai-agents/AgentBuilderScreen.tsx`
- Test: `src/features/ai-agents/AgentsTable.test.tsx` (new)

**Interfaces:**
- Consumes: `StoredAgent`/`Agent` from the store; `useNavigate` from `react-router`.
- Produces: `AgentsTable` gains an optional `onRowClick?: (id: string) => void`. Row name cells become buttons with accessible name `Open <agent name>`.

**Note:** `AgentBuilderScreen` keeps its existing local `overrides`/`tab`/`channel` behavior for this task (store integration of the toggle is deferred to Task 8 to keep tasks independently reviewable). Only wire row-click navigation here.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AgentsTable } from './AgentsTable'
import type { Agent } from './agent-builder-data'

const agents: Agent[] = [
  { id: 'w1', name: 'Knowledge Retrieval', on: true, isSubagent: false, type: 'Knowledge Retrieval', conversations: 3000, deflections: 2500, deflectionRate: '95%', csat: 3, tags: ['member_center'] },
]

describe('AgentsTable row click', () => {
  it('calls onRowClick with the agent id when the name is clicked', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<AgentsTable agents={agents} isOn={() => true} onToggle={() => {}} onRowClick={onRowClick} />)
    await user.click(screen.getByRole('button', { name: 'Open Knowledge Retrieval' }))
    expect(onRowClick).toHaveBeenCalledWith('w1')
  })

  it('does not trigger row click when the toggle is clicked', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<AgentsTable agents={agents} isOn={() => true} onToggle={() => {}} onRowClick={onRowClick} />)
    await user.click(screen.getByRole('switch', { name: 'Activate Knowledge Retrieval' }))
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/AgentsTable.test.tsx`
Expected: FAIL — no button named "Open Knowledge Retrieval".

- [ ] **Step 3: Write minimal implementation**

In `AgentsTable.tsx`, extend the props and make the name cell a button:

```tsx
export function AgentsTable({
  agents, isOn, onToggle, onRowClick,
}: {
  agents: Agent[]
  isOn: (a: Agent) => boolean
  onToggle: (id: string) => void
  onRowClick?: (id: string) => void
}) {
```

Replace the name `<td>` (currently line ~61) with:

```tsx
              <td className="px-3 py-4 align-middle text-[14px] font-medium">
                <button
                  type="button"
                  aria-label={`Open ${a.name}`}
                  onClick={() => onRowClick?.(a.id)}
                  className="text-left hover:underline"
                  style={{ color: INK }}
                >
                  {a.name}
                </button>
              </td>
```

(The toggle already stops at its own `<button>`; it does not bubble to a row handler because the row itself has no `onClick` — the click target is the name button only.)

In `AgentBuilderScreen.tsx`, import and use the navigate hook:

```tsx
import { useNavigate } from 'react-router'
```

Inside the component:

```tsx
  const navigate = useNavigate()
```

Pass the handler to the table (replace the existing `<AgentsTable ... />` at the bottom):

```tsx
      <AgentsTable
        agents={visibleAgents}
        isOn={isOn}
        onToggle={toggle}
        onRowClick={(id) => navigate(`/ai-agents/${id}`)}
      />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/AgentsTable.test.tsx src/features/ai-agents/AgentBuilderScreen.test.tsx`
Expected: PASS (new table tests pass; existing AgentBuilderScreen tests still pass — they query the toggle `switch`, unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/AgentsTable.tsx src/features/ai-agents/AgentBuilderScreen.tsx src/features/ai-agents/AgentsTable.test.tsx
git commit -m "feat(ai-agents): agent rows open the editor on click"
```

---

### Task 4: Editor data — step icons and chip variant styles

**Files:**
- Create: `src/features/ai-agents/editor/editor-data.ts`
- Test: `src/features/ai-agents/editor/editor-data.test.ts`

**Interfaces:**
- Consumes: `StepType`, `ChipVariant` from `../agent-store`; `LucideIcon` from `lucide-react`.
- Produces:
  - `STEP_ICON: Record<StepType, LucideIcon>`
  - `CHIP_STYLE: Record<ChipVariant, { text: string; border: string; bg: string }>` (Tailwind class fragments / inline color strings)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { STEP_ICON, CHIP_STYLE } from './editor-data'
import { STEP_TYPES } from '../agent-store'

describe('editor-data', () => {
  it('has an icon for every step type', () => {
    for (const s of STEP_TYPES) expect(STEP_ICON[s.type]).toBeTruthy()
  })
  it('has a style for every chip variant', () => {
    for (const v of ['form', 'routing', 'event', 'action', 'trigger'] as const) {
      expect(CHIP_STYLE[v]).toHaveProperty('text')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/editor/editor-data.test.ts`
Expected: FAIL — cannot resolve `./editor-data`.

- [ ] **Step 3: Write minimal implementation**

```ts
// Icon + color mappings for the editor palette and inline policy chips.
import {
  Code2, GitBranch, FileText, MessageSquare, LayoutGrid, Image as ImageIcon,
  SmilePlus, Paperclip, ListChecks, type LucideIcon,
} from 'lucide-react'
import type { StepType, ChipVariant } from '../agent-store'

export const STEP_ICON: Record<StepType, LucideIcon> = {
  options: ListChecks,
  condition: GitBranch,
  form: FileText,
  text: MessageSquare,
  'dynamic-card': LayoutGrid,
  image: ImageIcon,
  csat: SmilePlus,
  attachment: Paperclip,
  code: Code2,
}

// Chip tints per Figma: form = green, routing = purple, event = blue,
// action = filled dark, trigger = neutral.
export const CHIP_STYLE: Record<ChipVariant, { text: string; border: string; bg: string }> = {
  form: { text: '#0f8a5f', border: '#0f8a5f', bg: '#0f8a5f14' },
  routing: { text: '#724be8', border: '#724be8', bg: '#724be814' },
  event: { text: '#1f73b7', border: '#1f73b7', bg: '#1f73b714' },
  action: { text: '#2f3130', border: '#e2e0dd', bg: '#ffffff' },
  trigger: { text: '#8b8e89', border: '#e2e0dd', bg: '#f4f3f1' },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/editor/editor-data.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/editor/editor-data.ts src/features/ai-agents/editor/editor-data.test.ts
git commit -m "feat(ai-agents): editor step icons and chip variant styles"
```

---

### Task 5: StepsPalette — draggable step sources

**Files:**
- Create: `src/features/ai-agents/editor/StepsPalette.tsx`
- Test: `src/features/ai-agents/editor/StepsPalette.test.tsx`

**Interfaces:**
- Consumes: `STEP_TYPES` from `../agent-store`, `STEP_ICON` from `./editor-data`, `useDrag` from `react-dnd`, `DndProvider`/`HTML5Backend` (test only).
- Produces: `StepsPalette({ onClose }: { onClose: () => void })`; exported `EDITOR_DND_TYPE = 'editor-step'` and `type StepDragItem = { stepType: StepType }`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { StepsPalette } from './StepsPalette'

describe('StepsPalette', () => {
  it('lists all step types under a Steps heading', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <StepsPalette onClose={() => {}} />
      </DndProvider>,
    )
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Condition')).toBeInTheDocument()
    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('CSAT Survey Trigger Point')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/editor/StepsPalette.test.tsx`
Expected: FAIL — cannot resolve `./StepsPalette`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// Right-side palette of draggable step types. Each row is a react-dnd drag
// source; drops are handled by the policy inline zone and the block canvas.
import { X, GripVertical } from 'lucide-react'
import { useDrag } from 'react-dnd'
import { STEP_TYPES, type StepType } from '../agent-store'
import { STEP_ICON } from './editor-data'

export const EDITOR_DND_TYPE = 'editor-step'
export type StepDragItem = { stepType: StepType }

function PaletteRow({ stepType, label }: { stepType: StepType; label: string }) {
  const Icon = STEP_ICON[stepType]
  const [{ isDragging }, drag] = useDrag({
    type: EDITOR_DND_TYPE,
    item: (): StepDragItem => ({ stepType }),
    collect: (m) => ({ isDragging: m.isDragging() }),
  })
  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="flex cursor-grab items-center gap-3 rounded-xl border border-surface-border bg-white px-4 py-3 active:cursor-grabbing"
    >
      <GripVertical size={16} className="text-ink-muted" aria-hidden />
      <Icon size={18} className="text-ink" aria-hidden />
      <span className="text-[14px] text-ink">{label}</span>
    </div>
  )
}

export function StepsPalette({ onClose }: { onClose: () => void }) {
  return (
    <aside className="flex w-[380px] shrink-0 flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-medium text-ink">Steps</h2>
        <button type="button" aria-label="Close steps" onClick={onClose} className="text-ink-muted">
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {STEP_TYPES.map((s) => (
          <PaletteRow key={s.type} stepType={s.type} label={s.label} />
        ))}
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/editor/StepsPalette.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/editor/StepsPalette.tsx src/features/ai-agents/editor/StepsPalette.test.tsx
git commit -m "feat(ai-agents): draggable Steps palette"
```

---

### Task 6: PolicyEditor — toolbar, prose, chips, inline drop zone

**Files:**
- Create: `src/features/ai-agents/editor/PolicyChipView.tsx`
- Create: `src/features/ai-agents/editor/PolicyEditor.tsx`
- Test: `src/features/ai-agents/editor/PolicyEditor.test.tsx`

**Interfaces:**
- Consumes: `PolicyDoc`, `PolicySegment`, `PolicyChip`, `chipVariantForStep`, `nextId` from `../agent-store`; `CHIP_STYLE` from `./editor-data`; `EDITOR_DND_TYPE`, `StepDragItem` from `./StepsPalette`; `useDrop` from `react-dnd`.
- Produces: `PolicyEditor({ doc, onChange }: { doc: PolicyDoc; onChange: (doc: PolicyDoc) => void })`; `PolicyChipView({ chip, onRemove })`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { PolicyEditor } from './PolicyEditor'
import type { PolicyDoc } from '../agent-store'

const doc: PolicyDoc = {
  title: 'Autoflow policy',
  segments: [
    { kind: 'prose', id: 'p1', text: 'Reveal ' },
    { kind: 'chip', id: 'c1', variant: 'form', label: 'Survey' },
    { kind: 'prose', id: 'p2', text: ' to identify.' },
  ],
}

function renderEditor(onChange = vi.fn()) {
  render(
    <DndProvider backend={HTML5Backend}>
      <PolicyEditor doc={doc} onChange={onChange} />
    </DndProvider>,
  )
  return onChange
}

describe('PolicyEditor', () => {
  it('renders the policy title and chips', () => {
    renderEditor()
    expect(screen.getByText('Autoflow policy')).toBeInTheDocument()
    expect(screen.getByText('Survey')).toBeInTheDocument()
  })

  it('removes a chip and emits the new doc', async () => {
    const user = userEvent.setup()
    const onChange = renderEditor()
    await user.click(screen.getByRole('button', { name: 'Remove Survey' }))
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls[0][0] as PolicyDoc
    expect(next.segments.some((s) => s.kind === 'chip')).toBe(false)
  })

  it('renders the formatting toolbar', () => {
    renderEditor()
    expect(screen.getByRole('button', { name: 'Insert' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/editor/PolicyEditor.test.tsx`
Expected: FAIL — cannot resolve `./PolicyEditor`.

- [ ] **Step 3: Write minimal implementation**

`PolicyChipView.tsx`:

```tsx
// One inline entity chip in the policy prose. Read-only token (not
// reconfigurable) with a hover delete control.
import { X } from 'lucide-react'
import type { PolicyChip } from '../agent-store'
import { CHIP_STYLE } from './editor-data'

export function PolicyChipView({ chip, onRemove }: { chip: PolicyChip; onRemove: (id: string) => void }) {
  const style = CHIP_STYLE[chip.variant]
  return (
    <span
      className="mx-0.5 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 align-middle text-[14px]"
      style={{ color: style.text, borderColor: style.border, backgroundColor: style.bg }}
    >
      {chip.label}
      <button
        type="button"
        aria-label={`Remove ${chip.label}`}
        onClick={() => onRemove(chip.id)}
        className="opacity-60 hover:opacity-100"
        style={{ color: style.text }}
      >
        <X size={12} aria-hidden />
      </button>
    </span>
  )
}
```

`PolicyEditor.tsx`:

```tsx
// The Autoflow policy editor: a formatting toolbar over a document of prose
// segments (editable) interleaved with static entity chips. A react-dnd drop
// zone at the end of the prose inserts a chip derived from the dragged step.
import {
  Undo2, Redo2, Bold, Italic, Underline, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Code2, Link2, Plus,
} from 'lucide-react'
import { useDrop } from 'react-dnd'
import {
  chipVariantForStep, nextId, removeChip, insertChip,
  type PolicyDoc, type PolicySegment,
} from '../agent-store'
import { PolicyChipView } from './PolicyChipView'
import { EDITOR_DND_TYPE, type StepDragItem } from './StepsPalette'

const TOOLBAR = [Undo2, Redo2, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, Quote, Code2, Link2]

export function PolicyEditor({ doc, onChange }: { doc: PolicyDoc; onChange: (doc: PolicyDoc) => void }) {
  const editProse = (id: string, text: string) =>
    onChange({ ...doc, segments: doc.segments.map((s) => (s.kind === 'prose' && s.id === id ? { ...s, text } : s)) })

  const [{ isOver }, drop] = useDrop<StepDragItem, void, { isOver: boolean }>({
    accept: EDITOR_DND_TYPE,
    collect: (m) => ({ isOver: m.isOver() }),
    drop: (item) => {
      const chip = { kind: 'chip' as const, id: nextId('c'), variant: chipVariantForStep(item.stepType), label: item.stepType }
      onChange(insertChip(doc, doc.segments.length, chip))
    },
  })

  return (
    <div className="flex flex-1 flex-col">
      {/* Formatting toolbar */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-surface-border bg-white px-3 py-2">
        {TOOLBAR.map((Icon, i) => (
          <button key={i} type="button" className="rounded p-1.5 text-ink-muted hover:bg-[#f4f3f1]" tabIndex={-1}>
            <Icon size={18} aria-hidden />
          </button>
        ))}
        <button type="button" className="ml-2 flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-[14px] text-ink">
          <Plus size={16} aria-hidden /> Insert
        </button>
      </div>

      <h2 className="mb-4 text-[20px] font-medium text-ink">{doc.title}</h2>

      {/* Document: prose segments (editable) + inline chips */}
      <div className="text-[16px] leading-8 text-ink">
        {doc.segments.map((seg: PolicySegment) =>
          seg.kind === 'prose' ? (
            <span
              key={seg.id}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => editProse(seg.id, e.currentTarget.textContent ?? '')}
              className="whitespace-pre-wrap outline-none"
            >
              {seg.text}
            </span>
          ) : (
            <PolicyChipView key={seg.id} chip={seg} onRemove={(id) => onChange(removeChip(doc, id))} />
          ),
        )}
      </div>

      {/* Inline drop zone */}
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className="mt-4 flex h-10 items-center justify-center rounded-lg border-2 border-dashed text-[13px] transition-colors"
        style={{ borderColor: isOver ? '#1f73b7' : '#e2e0dd', color: '#8b8e89', backgroundColor: isOver ? '#1f73b70a' : 'transparent' }}
      >
        Drop it here
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/editor/PolicyEditor.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/editor/PolicyChipView.tsx src/features/ai-agents/editor/PolicyEditor.tsx src/features/ai-agents/editor/PolicyEditor.test.tsx
git commit -m "feat(ai-agents): policy editor with prose, chips, and inline drop zone"
```

---

### Task 7: BlockCanvas — drop, reorder, remove block cards

**Files:**
- Create: `src/features/ai-agents/editor/BlockCanvas.tsx`
- Test: `src/features/ai-agents/editor/BlockCanvas.test.tsx`

**Interfaces:**
- Consumes: `CanvasBlock`, `StepType`, `STEP_TITLE`, `nextId`, `appendBlock`, `moveBlock`, `removeBlock` from `../agent-store`; `STEP_ICON` from `./editor-data`; `EDITOR_DND_TYPE`, `StepDragItem` from `./StepsPalette`; `useDrop`, `useDrag` from `react-dnd`.
- Produces: `BlockCanvas({ blocks, onChange }: { blocks: CanvasBlock[]; onChange: (blocks: CanvasBlock[]) => void })`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { BlockCanvas } from './BlockCanvas'
import type { CanvasBlock } from '../agent-store'

const blocks: CanvasBlock[] = [
  { id: 'b1', stepType: 'condition', title: 'Untitled classic block 01' },
]

describe('BlockCanvas', () => {
  it('renders existing block cards', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <BlockCanvas blocks={blocks} onChange={() => {}} />
      </DndProvider>,
    )
    expect(screen.getByText('Untitled classic block 01')).toBeInTheDocument()
  })

  it('removes a block and emits the new list', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DndProvider backend={HTML5Backend}>
        <BlockCanvas blocks={blocks} onChange={onChange} />
      </DndProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Remove Untitled classic block 01' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/editor/BlockCanvas.test.tsx`
Expected: FAIL — cannot resolve `./BlockCanvas`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// The block canvas below the policy prose. Accepts step drops (append a block
// card), supports reordering existing cards, and removing them.
import { useRef } from 'react'
import { X, GripVertical } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import {
  appendBlock, moveBlock, removeBlock, nextId, STEP_TITLE,
  type CanvasBlock,
} from '../agent-store'
import { STEP_ICON } from './editor-data'
import { EDITOR_DND_TYPE, type StepDragItem } from './StepsPalette'

const REORDER_TYPE = 'editor-block'
type ReorderItem = { index: number }

function BlockCard({
  block, index, onMove, onRemove,
}: {
  block: CanvasBlock; index: number
  onMove: (from: number, to: number) => void
  onRemove: (id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const Icon = STEP_ICON[block.stepType]
  const [, drag] = useDrag({ type: REORDER_TYPE, item: (): ReorderItem => ({ index }) })
  const [, drop] = useDrop<ReorderItem>({
    accept: REORDER_TYPE,
    hover: (item) => {
      if (item.index === index) return
      onMove(item.index, index)
      item.index = index
    },
  })
  drag(drop(ref))
  return (
    <div ref={ref} className="flex items-center gap-3 rounded-2xl border border-surface-border bg-white px-4 py-3">
      <GripVertical size={16} className="cursor-grab text-ink-muted" aria-hidden />
      <Icon size={18} className="text-ink" aria-hidden />
      <span className="flex-1 text-[14px] font-medium text-ink">{block.title}</span>
      <button type="button" aria-label={`Remove ${block.title}`} onClick={() => onRemove(block.id)} className="text-ink-muted hover:text-ink">
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}

export function BlockCanvas({ blocks, onChange }: { blocks: CanvasBlock[]; onChange: (blocks: CanvasBlock[]) => void }) {
  const [{ isOver }, drop] = useDrop<StepDragItem, void, { isOver: boolean }>({
    accept: EDITOR_DND_TYPE,
    collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
    drop: (item) => {
      const n = blocks.length + 1
      const title = `Untitled classic block ${String(n).padStart(2, '0')}`
      onChange(appendBlock(blocks, { id: nextId('b'), stepType: item.stepType, title }))
    },
  })

  return (
    <div className="mt-6 flex flex-col gap-3">
      {blocks.map((b, i) => (
        <BlockCard
          key={b.id}
          block={b}
          index={i}
          onMove={(from, to) => onChange(moveBlock(blocks, from, to))}
          onRemove={(id) => onChange(removeBlock(blocks, id))}
        />
      ))}
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className="flex h-16 items-center justify-center rounded-2xl border-2 border-dashed text-[13px] transition-colors"
        style={{ borderColor: isOver ? '#1f73b7' : '#e2e0dd', color: '#8b8e89', backgroundColor: isOver ? '#1f73b70a' : 'transparent' }}
      >
        Drop a step here to add a block
      </div>
    </div>
  )
}
```

Note: `STEP_TITLE` is imported for parity with the store export even though titles are generated inline; if unused it will trip `noUnusedLocals` — remove the `STEP_TITLE` import if TypeScript flags it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/editor/BlockCanvas.test.tsx && npx tsc --noEmit`
Expected: PASS (2 tests); typecheck clean (drop the unused `STEP_TITLE` import if flagged).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/editor/BlockCanvas.tsx src/features/ai-agents/editor/BlockCanvas.test.tsx
git commit -m "feat(ai-agents): block canvas with drop, reorder, and remove"
```

---

### Task 8: EditorHeader + AgentEditorScreen, wired route

**Files:**
- Create: `src/features/ai-agents/editor/EditorHeader.tsx`
- Create: `src/features/ai-agents/editor/AgentEditorScreen.tsx`
- Modify: `src/routes.tsx`
- Test: `src/features/ai-agents/editor/AgentEditorScreen.test.tsx`

**Interfaces:**
- Consumes: `useAgentStore` from `../agent-store`; `PolicyEditor`, `BlockCanvas`, `StepsPalette` from siblings; `useParams`, `useNavigate`, `Navigate` from `react-router`; `DndProvider`, `HTML5Backend`.
- Produces: `AgentEditorScreen` (default editor screen at `/ai-agents/:agentId`), `EditorHeader({ title, version, channel, onChannelChange, onBack })`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('AgentEditorScreen', () => {
  it('renders the editor for a seeded agent', () => {
    renderAt('/ai-agents/w3')
    expect(screen.getByTestId('view-agent-editor')).toBeInTheDocument()
    // Seeded Service cancellation policy chip.
    expect(screen.getByText('Retention Routing')).toBeInTheDocument()
    // Steps palette present.
    expect(screen.getByText('Steps')).toBeInTheDocument()
  })

  it('redirects to the list for an unknown agent id', () => {
    renderAt('/ai-agents/does-not-exist')
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })

  it('navigates back to the list from the editor', async () => {
    const user = userEvent.setup()
    renderAt('/ai-agents/w3')
    await user.click(screen.getByRole('button', { name: 'Back to agents' }))
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/editor/AgentEditorScreen.test.tsx`
Expected: FAIL — `view-agent-editor` not found / route missing.

- [ ] **Step 3: Write minimal implementation**

`EditorHeader.tsx`:

```tsx
// Sticky editor header: back, editable title + version chip, centered channel
// tabs, and inert Preview/Versions/Publish actions.
import { ArrowLeft, MoreVertical, MessageSquare, Phone, Globe, Code2 } from 'lucide-react'
import type { ChannelKey } from '../agent-builder-data'

const CHANNELS: { key: ChannelKey; label: string; Icon: typeof MessageSquare }[] = [
  { key: 'widget', label: 'Widget', Icon: MessageSquare },
  { key: 'voice', label: 'Voice', Icon: Phone },
  { key: 'webcall', label: 'Web Call', Icon: Globe },
  { key: 'headless', label: 'Headless', Icon: Code2 },
]

export function EditorHeader({
  title, version, channel, onChannelChange, onBack, onTitleChange,
}: {
  title: string
  version: string
  channel: ChannelKey
  onChannelChange: (c: ChannelKey) => void
  onBack: () => void
  onTitleChange: (t: string) => void
}) {
  return (
    <div className="flex items-center gap-4 border-b border-surface-border bg-white px-8 py-4">
      <button type="button" aria-label="Back to agents" onClick={onBack} className="text-ink">
        <ArrowLeft size={20} aria-hidden />
      </button>
      <input
        aria-label="Agent title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="min-w-0 max-w-[240px] bg-transparent text-[20px] font-medium text-ink outline-none"
      />
      <span className="rounded-md bg-[#f4f3f1] px-2 py-0.5 text-[12px] text-ink-muted">{version}</span>
      <button type="button" aria-label="More actions" className="text-ink-muted"><MoreVertical size={18} aria-hidden /></button>

      <div role="tablist" aria-label="Channel" className="mx-auto flex items-center gap-1 rounded-full bg-[#f4f3f1] p-1">
        {CHANNELS.map(({ key, label, Icon }) => {
          const active = key === channel
          return (
            <button
              key={key} type="button" role="tab" aria-selected={active}
              onClick={() => onChannelChange(key)}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium"
              style={{ backgroundColor: active ? '#fff' : 'transparent', color: active ? '#2f3130' : '#8b8e89', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
            >
              <Icon size={14} aria-hidden /> {label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="text-[14px] text-ink-muted">Preview</button>
        <button type="button" className="rounded-full border border-surface-border px-4 py-1.5 text-[13px] font-medium text-ink">Versions</button>
        <button type="button" className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-semibold text-white">Publish</button>
      </div>
    </div>
  )
}
```

`AgentEditorScreen.tsx`:

```tsx
// The Autoflow policy editor screen (/ai-agents/:agentId). One DndProvider over
// the header, the policy editor + block canvas (center), and the Steps palette
// (right). Unknown ids redirect to the list. Edits persist via the agent store.
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useAgentStore } from '../agent-store'
import type { ChannelKey } from '../agent-builder-data'
import { EditorHeader } from './EditorHeader'
import { PolicyEditor } from './PolicyEditor'
import { BlockCanvas } from './BlockCanvas'
import { StepsPalette } from './StepsPalette'

export function AgentEditorScreen() {
  const { agentId = '' } = useParams()
  const navigate = useNavigate()
  const store = useAgentStore()
  const agent = store.getAgent(agentId)

  const [channel, setChannel] = useState<ChannelKey>(agent?.channel ?? 'widget')
  const [paletteOpen, setPaletteOpen] = useState(true)

  if (!agent) return <Navigate to="/ai-agents" replace />

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-testid="view-agent-editor" className="flex h-full flex-col">
        <EditorHeader
          title={agent.name}
          version="Version 001"
          channel={channel}
          onChannelChange={setChannel}
          onBack={() => navigate('/ai-agents')}
          onTitleChange={(name) => store.updateAgent(agent.id, { name })}
        />
        <div className="flex flex-1 gap-6 overflow-hidden p-8">
          <div className="flex-1 overflow-y-auto">
            <PolicyEditor doc={agent.policy} onChange={(policy) => store.updateAgent(agent.id, { policy })} />
            <BlockCanvas blocks={agent.blocks} onChange={(blocks) => store.updateAgent(agent.id, { blocks })} />
          </div>
          {paletteOpen && <StepsPalette onClose={() => setPaletteOpen(false)} />}
        </div>
      </div>
    </DndProvider>
  )
}
```

In `src/routes.tsx`, add the import and the child route (after the static children, before `qa` is fine — place it last in the `ai-agents` children):

```tsx
import { AgentEditorScreen } from '@/features/ai-agents/editor/AgentEditorScreen'
```

```tsx
              { path: 'configuration', element: <ConfigurationView /> },
              { path: 'agent-builder', element: <AgentBuilderScreen /> },
              { path: 'qa', element: <PlaceholderScreen title="QA" /> },
              { path: ':agentId', element: <AgentEditorScreen /> },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/editor/AgentEditorScreen.test.tsx src/features/ai-agents/ai-agents.routes.test.tsx`
Expected: PASS (editor tests + existing routing tests; `:agentId` is ranked below the static `configuration`/`agent-builder`/`qa` segments by React Router v7, so those still resolve).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/editor/EditorHeader.tsx src/features/ai-agents/editor/AgentEditorScreen.tsx src/routes.tsx src/features/ai-agents/editor/AgentEditorScreen.test.tsx
git commit -m "feat(ai-agents): agent editor screen wired at /ai-agents/:agentId"
```

---

### Task 9: CreateAgentPanel — slide-over create form

**Files:**
- Create: `src/features/ai-agents/CreateAgentPanel.tsx`
- Test: `src/features/ai-agents/CreateAgentPanel.test.tsx`

**Interfaces:**
- Consumes: `CreateAgentFields`, `ChannelKey`; lucide `X`, `Plus`, `ChevronDown`.
- Produces: `CreateAgentPanel({ channel, onClose, onCreate }: { channel: ChannelKey; onClose: () => void; onCreate: (fields: CreateAgentFields) => void })`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateAgentPanel } from './CreateAgentPanel'

describe('CreateAgentPanel', () => {
  it('disables Create until a display name is entered', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<CreateAgentPanel channel="widget" onClose={() => {}} onCreate={onCreate} />)
    const create = screen.getByRole('button', { name: 'Create Agent' })
    expect(create).toBeDisabled()
    await user.type(screen.getByLabelText('Agent display name'), 'Refund helper')
    expect(create).toBeEnabled()
  })

  it('emits the entered fields on Create', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<CreateAgentPanel channel="widget" onClose={() => {}} onCreate={onCreate} />)
    await user.type(screen.getByLabelText('Agent display name'), 'Refund helper')
    await user.type(screen.getByLabelText('Training phrases'), 'refund{Enter}')
    await user.click(screen.getByRole('button', { name: 'Create Agent' }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Refund helper', channel: 'widget', trainingPhrases: ['refund'],
    }))
  })

  it('closes on the X button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CreateAgentPanel channel="widget" onClose={onClose} onCreate={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/CreateAgentPanel.test.tsx`
Expected: FAIL — cannot resolve `./CreateAgentPanel`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// Right slide-over create form for a new agent. Fields: Universal Brand toggle,
// Tags, display name, "triggered when" description, and training phrases.
// Create is disabled until a display name is entered. Presentational — the
// parent owns creation + navigation.
import { useState } from 'react'
import { X, Plus, ChevronDown } from 'lucide-react'
import type { ChannelKey } from './agent-builder-data'
import type { CreateAgentFields } from './agent-store'

export function CreateAgentPanel({
  channel, onClose, onCreate,
}: {
  channel: ChannelKey
  onClose: () => void
  onCreate: (fields: CreateAgentFields) => void
}) {
  const [universalBrand, setUniversalBrand] = useState(false)
  const [name, setName] = useState('')
  const [triggeredWhen, setTriggeredWhen] = useState('')
  const [phrases, setPhrases] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  const addPhrase = () => {
    const v = draft.trim()
    if (!v) return
    setPhrases((p) => [...p, v])
    setDraft('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div role="dialog" aria-label="Create Agent" className="relative flex h-full w-[480px] flex-col overflow-y-auto bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <h1 className="text-[28px] font-semibold text-ink">Create Agent</h1>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full border border-surface-border p-2 text-ink"><X size={18} aria-hidden /></button>
        </div>

        {/* Universal Brand */}
        <div className="mb-6">
          <button
            type="button" role="switch" aria-checked={universalBrand} aria-label="Universal Brand"
            onClick={() => setUniversalBrand((v) => !v)}
            className="mb-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[13px] font-medium"
            style={{ backgroundColor: universalBrand ? '#0f8a5f' : '#c9c7c3', color: '#fff' }}
          >
            {universalBrand ? 'On' : 'Off'}
          </button>
          <span className="ml-2 text-[15px] text-ink">Universal Brand is {universalBrand ? 'on' : 'off'}</span>
          <p className="mt-1 text-[13px] text-ink-muted">The agent will be shared across all brands, including existing ones and any added in the future.</p>
        </div>

        {/* Tags */}
        <label className="mb-2 block text-[16px] font-semibold text-ink">Tags (optional)</label>
        <p className="mb-2 text-[13px] text-ink-muted">Agents can be shared across brands or user segments and will only be triggered for the specified brand. If no brand is assigned, the agent will be visible to all segments.</p>
        <button type="button" className="mb-6 flex w-full items-center justify-between rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink-muted">
          Assign tags <ChevronDown size={16} aria-hidden />
        </button>

        {/* Display name */}
        <label htmlFor="agent-name" className="mb-2 block text-[16px] font-semibold text-ink">Agent display name</label>
        <p className="mb-2 text-[13px] text-ink-muted">Display names are used by the model to better understand the agent and may be shown to your customer for confirmation. Ensure accuracy by using descriptive names that reflect the expected outcome, such as "Error Uploading Tax Return" rather than "Return Errors".</p>
        <input
          id="agent-name" aria-label="Agent display name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Give a name to this agent"
          className="mb-6 w-full rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted"
        />

        {/* More information */}
        <label htmlFor="agent-trigger" className="mb-2 block text-[16px] font-semibold text-ink">More information (Recommended)</label>
        <p className="mb-2 text-[13px] text-ink-muted">Briefly describe your customer's action or query to help predict accurate responses.</p>
        <p className="mb-2 text-[14px] text-ink">This agent is triggered when...</p>
        <textarea
          id="agent-trigger" aria-label="This agent is triggered when" value={triggeredWhen} onChange={(e) => setTriggeredWhen(e.target.value)}
          rows={3} placeholder="describe your customer's action or query."
          className="mb-6 w-full rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted"
        />

        {/* Training phrases */}
        <label htmlFor="agent-phrase" className="mb-2 block text-[16px] font-semibold text-ink">Training phrases</label>
        <p className="mb-2 text-[13px] text-ink-muted">Input training phrases for questions that your customers would ask.</p>
        {phrases.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {phrases.map((p) => (
              <span key={p} className="rounded-md border border-surface-border px-2 py-0.5 text-[13px] text-ink">{p}</span>
            ))}
          </div>
        )}
        <div className="mb-8 flex items-center gap-2">
          <input
            id="agent-phrase" aria-label="Training phrases" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPhrase() } }}
            placeholder="Type a training phrase and press 'Enter'"
            className="flex-1 rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted"
          />
          <button type="button" aria-label="Add training phrase" onClick={addPhrase} className="text-ink-muted"><Plus size={18} aria-hidden /></button>
        </div>

        <button
          type="button" disabled={name.trim().length === 0}
          onClick={() => onCreate({ name: name.trim(), channel, universalBrand, tags: [], triggeredWhen, trainingPhrases: phrases })}
          className="mt-auto w-full rounded-full bg-ink px-4 py-3 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#f0eeec] disabled:text-ink-muted"
        >
          Create Agent
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/CreateAgentPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/CreateAgentPanel.tsx src/features/ai-agents/CreateAgentPanel.test.tsx
git commit -m "feat(ai-agents): Create Agent slide-over form"
```

---

### Task 10: Wire New Agent → Create panel → editor in AgentBuilderScreen

**Files:**
- Modify: `src/features/ai-agents/AgentBuilderScreen.tsx`
- Test: `src/features/ai-agents/AgentBuilderScreen.test.tsx` (add cases)

**Interfaces:**
- Consumes: `useAgentStore`, `CreateAgentPanel`.
- Produces: no new exports; "New Agent" opens the panel; creating navigates to `/ai-agents/:newId`.

**Note:** This task must render inside a router (the existing `AgentBuilderScreen.test.tsx` renders the component bare). Add the new cases using `createMemoryRouter` with the real `routes` so navigation to the editor can be asserted, leaving the existing bare-render tests intact.

- [ ] **Step 1: Write the failing test** (append to `AgentBuilderScreen.test.tsx`)

```tsx
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderApp(path = '/ai-agents') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('AgentBuilderScreen — create flow', () => {
  it('opens the Create Agent panel from New Agent', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'New Agent' }))
    expect(screen.getByRole('dialog', { name: 'Create Agent' })).toBeInTheDocument()
  })

  it('creates an agent and lands in the editor', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'New Agent' }))
    await user.type(screen.getByLabelText('Agent display name'), 'Refund helper')
    await user.click(screen.getByRole('button', { name: 'Create Agent' }))
    expect(screen.getByTestId('view-agent-editor')).toBeInTheDocument()
    expect(screen.getByLabelText('Agent title')).toHaveValue('Refund helper')
  })

  it('opens the editor when an agent row is clicked', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Open Knowledge Retrieval' }))
    expect(screen.getByTestId('view-agent-editor')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/AgentBuilderScreen.test.tsx`
Expected: FAIL — no dialog; New Agent is inert.

- [ ] **Step 3: Write minimal implementation**

In `AgentBuilderScreen.tsx` add imports:

```tsx
import { useAgentStore } from './agent-store'
import { CreateAgentPanel } from './CreateAgentPanel'
```

Add state near the other `useState` calls:

```tsx
  const store = useAgentStore()
  const [creating, setCreating] = useState(false)
```

Make the "New Agent" button open the panel (replace the existing `New Agent` button):

```tsx
          <button type="button" onClick={() => setCreating(true)} className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-semibold text-white">
            New Agent
          </button>
```

Render the panel at the end of the component's returned JSX, just before the outermost closing `</div>`:

```tsx
      {creating && (
        <CreateAgentPanel
          channel={channelKey}
          onClose={() => setCreating(false)}
          onCreate={(fields) => {
            const id = store.createAgent(fields)
            setCreating(false)
            navigate(`/ai-agents/${id}`)
          }}
        />
      )}
```

(`navigate` is already available from Task 3.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/AgentBuilderScreen.test.tsx`
Expected: PASS (existing bare-render tests + 3 new create-flow tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/AgentBuilderScreen.tsx src/features/ai-agents/AgentBuilderScreen.test.tsx
git commit -m "feat(ai-agents): wire New Agent create panel and row-click into the editor"
```

---

### Task 11: Full-suite gate + cleanup

**Files:**
- Modify: any file flagged by typecheck/tests.

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS across the repo (no regressions in home/insights/org/ai-agents suites).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. Remove any unused imports flagged (e.g. `STEP_TITLE` in `BlockCanvas.tsx` if not used).

- [ ] **Step 3: Build**

Run: `pnpm build` (or `npx tsc -b && npx vite build`)
Expected: build succeeds.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore(ai-agents): typecheck/test cleanup for create/edit flow"
```

---

## Self-Review

**Spec coverage:**
- Routing `/ai-agents/:agentId` + create-as-slide-over → Tasks 8, 9, 10. ✅
- Row click → editor → Task 3. ✅
- New Agent → Create form → editor → Tasks 9, 10. ✅
- `agent-store` + localStorage + deterministic seq → Tasks 1, 2. ✅
- `PolicyDoc`/`CanvasBlock` models + reducers → Task 1. ✅
- Editable prose + static chips → Task 6. ✅
- DnD into both policy (inline chip) and canvas (block card) + reorder/remove → Tasks 6, 7. ✅
- Steps palette drag sources → Task 5. ✅
- Seeded "Service cancellation" content + classic block → Task 1 (seed), Task 8 (render). ✅
- Inert chrome (Preview/Versions/Publish, overflow, channel-tab-body parity, far-right rail treated as omitted-for-now icon rail) → Task 8 header. ✅ (The far-right icon rail is folded into "render inert"; it is drawn as part of the header actions region rather than a separate rail to keep scope tight — acceptable per the spec's "visual-only" call.)
- Tests per convention → every task. ✅

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✅

**Type consistency:** `StoredAgent`, `PolicyDoc`, `CanvasBlock`, `CreateAgentFields`, `StepDragItem`, `EDITOR_DND_TYPE`, reducer names (`insertChip`, `removeChip`, `appendBlock`, `moveBlock`, `removeBlock`), `chipVariantForStep`, `nextId`, `useAgentStore` are defined in Tasks 1–2 and used consistently in Tasks 4–10. ✅

**Note on the far-right icon rail:** the spec lists it as visual-only. This plan does not draw a separate decorative rail component (YAGNI for a purely inert element); if pixel-faithful fidelity of that rail is desired, it can be added as a follow-up. Flagging so it is not mistaken for an omission.
