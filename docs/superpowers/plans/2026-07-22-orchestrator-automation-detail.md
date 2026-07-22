# Orchestrator Automation Detail Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the automation detail screen — a node-based journey flow editor reached by selecting a row in the Orchestrator table.

**Architecture:** A nested route `/orchestrator/:id` renders `AutomationDetailScreen` (top bar + Journey/Analytic/Log tabs). The Journey tab hosts `JourneyCanvas`, a React Flow (`@xyflow/react`) editor with custom node/edge components styled to the Figma design, a categorized drag-and-drop node palette, and per-automation `localStorage` persistence seeded from mock data.

**Tech Stack:** React 18 + Vite + TypeScript, React Router v7, `@xyflow/react` v12 (new dep), Tailwind v4, lucide-react icons, Vitest + React Testing Library.

## Global Constraints

- **TypeScript strict mode**; keep all new code fully typed. Do NOT add `baseUrl` to `tsconfig.json`.
- **Path alias:** `@` → `src/`.
- **Package manager:** `pnpm` (use `npx pnpm ...` if pnpm is not on PATH). Gates: `npx vitest run`, `npx tsc --noEmit`, `npx vite build`. `pnpm lint` is broken upstream — do NOT rely on it.
- **Icons:** lucide-react only for this feature. Do NOT commit remote Figma asset URLs or hand-write `<svg>` for brand glyphs.
- **Fonts:** use the project system SF stack. Do NOT introduce `Plus Jakarta Sans` or `font-['...']` arbitrary classes.
- **Tokens:** prefer semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`) and Garden palette classes; inline one-off hex only with an explanatory comment, matching `AutomationTable.tsx`.
- **No backend:** all data mocked/in-memory + localStorage. Guard `window.localStorage?.` access.
- **localStorage guard pattern:** wrap reads/writes in `try/catch`, use `window.localStorage?.`, fall back to seed/in-memory (mirror `HomeScreen.tsx` `loadLayout`).
- **Node card visual constants:** `bg-white rounded-[16px] w-[280px] p-[12px]`, shadow `shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]`.
- **Journey chip colors (inline, one-off):** Start `#8dcac6` / event icon `#079db7`; Rule `#ffd483`; End icon `#d2d9e5`, End header `#f2f4f7` border `#d2d3d8`; condition chip bg `#f2f4f7`; `$variable` text `#01567a`; branch-label pill `#ebe8e6` border `#f9f8f7`; tag chip `#e8e9eb`. Email `#247acb` / Voice `#be297b` reuse `channel-meta.ts` where practical.

---

## File Structure

```
src/features/orchestrator/
  OrchestratorScreen.tsx            (modify: rows navigate to /orchestrator/:id)
  AutomationTable.tsx               (modify: row onClick + toggle stopPropagation)
  AutomationDetailScreen.tsx        (new) + .test
  journey/
    journey-data.ts                 (new) + .test   — types, PALETTE, SEED_JOURNEYS
    useJourneyStorage.ts            (new) + .test   — localStorage-backed graph state
    JourneyCanvas.tsx               (new) + .test   — ReactFlow host + palette wiring
    NodePalette.tsx                 (new) + .test   — right drawer, search, drag cards
    nodes/
      StartNode.tsx                 (new)
      RuleNode.tsx                  (new)
      ActionNode.tsx                (new)
      EndNode.tsx                   (new)  (node renderers covered by JourneyCanvas test)
    edges/
      AddButtonEdge.tsx             (new)
src/routes.tsx                      (modify: nested /orchestrator/:id route)
src/test/setup.ts                   (verify ResizeObserver stub — already present)
```

---

## Task 1: Add `@xyflow/react` dependency

**Files:**
- Modify: `package.json` (via pnpm)

**Interfaces:**
- Produces: `@xyflow/react` importable (`ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, `Handle`, `Position`, `applyNodeChanges`, `applyEdgeChanges`, `addEdge`, `useReactFlow`, `BaseEdge`, `EdgeLabelRenderer`, `getSmoothStepPath`, and their TS types).

- [ ] **Step 1: Install the dependency**

Run: `npx pnpm add @xyflow/react`
Expected: `package.json` gains `@xyflow/react` under `dependencies` (v12.x).

- [ ] **Step 2: Verify it imports and the build still typechecks**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Verify baseline tests still pass**

Run: `npx vitest run`
Expected: PASS (169 tests, unchanged).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @xyflow/react for orchestrator journey editor"
```

---

## Task 2: Journey data model, palette, and seed graphs

**Files:**
- Create: `src/features/orchestrator/journey/journey-data.ts`
- Test: `src/features/orchestrator/journey/journey-data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type JourneyNodeKind = 'start' | 'rule' | 'action' | 'end'`
  - `type ActionChannel = 'voice' | 'email' | 'widget'`
  - `type Condition = { label: string; tokens?: string[] }`
  - `type JourneyNodeData = { kind: JourneyNodeKind; title: string; event?: string; conditions?: Condition[]; channel?: ActionChannel; actionLabel?: string; description?: string; ticketTags?: string[] }`
  - `type JourneyNode = { id: string; type: JourneyNodeKind; position: { x: number; y: number }; data: JourneyNodeData }`
  - `type JourneyEdge = { id: string; source: string; target: string; sourceHandle?: string; label?: string }`
  - `type Journey = { nodes: JourneyNode[]; edges: JourneyEdge[] }`
  - `type PaletteItem = { id: string; label: string; color: string; icon: PaletteIconName }`
  - `type PaletteIconName` (union of lucide names used, e.g. `'MessageSquare' | 'Mail' | 'Phone' | 'Split' | 'Repeat' | 'RefreshCw' | 'CalendarCheck' | 'Timer' | 'Square' | 'Activity' | 'Languages' | 'Smile' | 'ShieldAlert'`)
  - `type NodeCategory = { title: string; items: PaletteItem[] }`
  - `const PALETTE: NodeCategory[]`
  - `const SEED_JOURNEYS: Record<string, Journey>` (keys `'a1'`, `'a2'`, `'a3'`)
  - `function seedFor(automationId: string): Journey` — returns `SEED_JOURNEYS[id]` or `{ nodes: [], edges: [] }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/orchestrator/journey/journey-data.test.ts
import { describe, it, expect } from 'vitest'
import { PALETTE, SEED_JOURNEYS, seedFor } from './journey-data'

describe('journey-data', () => {
  it('exposes the three palette categories in order', () => {
    expect(PALETTE.map((c) => c.title)).toEqual([
      'Channel Agents',
      'Logic',
      'Triage models',
    ])
  })

  it('every palette item has a unique id', () => {
    const ids = PALETTE.flatMap((c) => c.items.map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('seeds a rich graph for a1 with a start node and at least one end node', () => {
    const g = SEED_JOURNEYS.a1
    expect(g.nodes.some((n) => n.type === 'start')).toBe(true)
    expect(g.nodes.filter((n) => n.type === 'end').length).toBeGreaterThanOrEqual(1)
    // every edge references existing nodes
    const ids = new Set(g.nodes.map((n) => n.id))
    for (const e of g.edges) {
      expect(ids.has(e.source)).toBe(true)
      expect(ids.has(e.target)).toBe(true)
    }
  })

  it('seeds valid smaller graphs for a2 and a3', () => {
    for (const id of ['a2', 'a3'] as const) {
      const g = SEED_JOURNEYS[id]
      expect(g.nodes.length).toBeGreaterThanOrEqual(3)
      expect(g.nodes.some((n) => n.type === 'start')).toBe(true)
    }
  })

  it('seedFor returns an empty graph for an unknown id', () => {
    expect(seedFor('nope')).toEqual({ nodes: [], edges: [] })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/journey/journey-data.test.ts`
Expected: FAIL (cannot resolve `./journey-data`).

- [ ] **Step 3: Write the implementation**

Create `src/features/orchestrator/journey/journey-data.ts` with all types above, then:

```ts
export const PALETTE: NodeCategory[] = [
  {
    title: 'Channel Agents',
    items: [
      { id: 'widget', label: 'Widget', color: '#e05c34', icon: 'MessageSquare' },
      { id: 'email', label: 'Email', color: '#247acb', icon: 'Mail' },
      { id: 'voice', label: 'Voice', color: '#be297b', icon: 'Phone' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { id: 'if-otherwise', label: 'If/Otherwise', color: '#ffd483', icon: 'Split' },
      { id: 'human-loop', label: 'Human in the loop', color: '#9abaca', icon: 'Repeat' },
      { id: 'loop-items', label: 'Loop over items', color: '#000000', icon: 'RefreshCw' },
      { id: 'on-schedule', label: 'On Schedule', color: '#8ca5c2', icon: 'CalendarCheck' },
      { id: 'delay', label: 'Delay', color: '#2f99b3', icon: 'Timer' },
      { id: 'end', label: 'End', color: '#ea5a41', icon: 'Square' },
    ],
  },
  {
    title: 'Triage models',
    items: [
      { id: 'injury-severity', label: 'Injury severity', color: '#7c3aed', icon: 'Activity' },
      { id: 'language-detection', label: 'Language Detection', color: '#16a34a', icon: 'Languages' },
      { id: 'sentiment-detection', label: 'Sentiment Detection', color: '#f59e0b', icon: 'Smile' },
      { id: 'spam-detection', label: 'Spam Detection', color: '#2563eb', icon: 'ShieldAlert' },
    ],
  },
]
```

Then author `SEED_JOURNEYS`. `a1` = the abandoned-cart flow transcribed from the Figma frame. Positions adapted from frame coordinates (divide-and-offset is fine — exact pixels not required, just a coherent top-down layout):

```ts
export const SEED_JOURNEYS: Record<string, Journey> = {
  a1: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 360, y: 0 },
        data: { kind: 'start', title: 'Start', event: 'On Event: Cart abandoned' } },
      { id: 'rule1', type: 'rule', position: { x: 360, y: 220 },
        data: { kind: 'rule', title: 'Cart abandoned for > 24 hours',
          conditions: [{ label: 'has not purchased item', tokens: ['$cart.abandoned', '$User'] }] } },
      { id: 'voice', type: 'action', position: { x: 190, y: 620 },
        data: { kind: 'action', channel: 'voice', actionLabel: 'Voice',
          title: 'Voice', description: 'Call customers with abandoned carts' } },
      { id: 'end1', type: 'end', position: { x: 560, y: 620 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
      { id: 'rule2', type: 'rule', position: { x: 190, y: 800 },
        data: { kind: 'rule', title: 'Cart abandoned for > 24 hours',
          conditions: [{ label: '', tokens: ['$purchase.made'] }] } },
      { id: 'email', type: 'action', position: { x: 20, y: 1120 },
        data: { kind: 'action', channel: 'email', actionLabel: 'Email',
          title: 'Email', description: 'Email users receipt' } },
      { id: 'end2', type: 'end', position: { x: 370, y: 1120 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
      { id: 'end3', type: 'end', position: { x: 20, y: 1340 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
    ],
    edges: [
      { id: 'e-start-rule1', source: 'start', target: 'rule1' },
      { id: 'e-rule1-voice', source: 'rule1', target: 'voice', sourceHandle: 'c0', label: '1' },
      { id: 'e-rule1-end1', source: 'rule1', target: 'end1', sourceHandle: 'otherwise', label: 'Otherwise' },
      { id: 'e-voice-rule2', source: 'voice', target: 'rule2' },
      { id: 'e-rule2-email', source: 'rule2', target: 'email', sourceHandle: 'c0', label: '1' },
      { id: 'e-rule2-end2', source: 'rule2', target: 'end2', sourceHandle: 'otherwise', label: 'Otherwise' },
      { id: 'e-email-end3', source: 'email', target: 'end3' },
    ],
  },
  a2: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 200, y: 0 },
        data: { kind: 'start', title: 'Start', event: 'On Event: Refund requested' } },
      { id: 'rule1', type: 'rule', position: { x: 200, y: 220 },
        data: { kind: 'rule', title: 'Refund amount > $100',
          conditions: [{ label: 'requires approval', tokens: ['$refund.amount'] }] } },
      { id: 'end1', type: 'end', position: { x: 200, y: 520 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
    ],
    edges: [
      { id: 'e-start-rule1', source: 'start', target: 'rule1' },
      { id: 'e-rule1-end1', source: 'rule1', target: 'end1', sourceHandle: 'c0', label: '1' },
    ],
  },
  a3: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 200, y: 0 },
        data: { kind: 'start', title: 'Start', event: 'On Event: Low CSAT submitted' } },
      { id: 'email', type: 'action', position: { x: 200, y: 220 },
        data: { kind: 'action', channel: 'email', actionLabel: 'Email',
          title: 'Email', description: 'Email a discount code' } },
      { id: 'end1', type: 'end', position: { x: 200, y: 440 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
    ],
    edges: [
      { id: 'e-start-email', source: 'start', target: 'email' },
      { id: 'e-email-end1', source: 'email', target: 'end1' },
    ],
  },
}

export function seedFor(automationId: string): Journey {
  return SEED_JOURNEYS[automationId] ?? { nodes: [], edges: [] }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/journey/journey-data.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/journey/journey-data.ts src/features/orchestrator/journey/journey-data.test.ts
git commit -m "feat: journey data model, palette, and seed graphs"
```

---

## Task 3: `useJourneyStorage` hook

**Files:**
- Create: `src/features/orchestrator/journey/useJourneyStorage.ts`
- Test: `src/features/orchestrator/journey/useJourneyStorage.test.ts`

**Interfaces:**
- Consumes: `Journey`, `JourneyNode`, `JourneyEdge`, `seedFor` from `journey-data`.
- Produces:
  - `const JOURNEY_KEY = (id: string) => 'orchestrator-journey-' + id + '-v1'`
  - `function useJourneyStorage(automationId: string): { nodes: JourneyNode[]; edges: JourneyEdge[]; setNodes: React.Dispatch<React.SetStateAction<JourneyNode[]>>; setEdges: React.Dispatch<React.SetStateAction<JourneyEdge[]>> }`
  - Reads from `localStorage` (guarded) on init, falling back to `seedFor(id)`; writes `{ nodes, edges }` back on change (guarded, ignore errors).

- [ ] **Step 1: Write the failing test**

```ts
// src/features/orchestrator/journey/useJourneyStorage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJourneyStorage, JOURNEY_KEY } from './useJourneyStorage'
import { SEED_JOURNEYS } from './journey-data'

describe('useJourneyStorage', () => {
  beforeEach(() => {
    try { window.localStorage?.clear() } catch { /* jsdom has no localStorage */ }
  })

  it('returns the seed graph for a known id on first load', () => {
    const { result } = renderHook(() => useJourneyStorage('a1'))
    expect(result.current.nodes.length).toBe(SEED_JOURNEYS.a1.nodes.length)
    expect(result.current.edges.length).toBe(SEED_JOURNEYS.a1.edges.length)
  })

  it('returns an empty graph for an unknown id', () => {
    const { result } = renderHook(() => useJourneyStorage('unknown'))
    expect(result.current.nodes).toEqual([])
    expect(result.current.edges).toEqual([])
  })

  it('does not throw when setNodes is called (in-memory update works)', () => {
    const { result } = renderHook(() => useJourneyStorage('a2'))
    act(() => { result.current.setNodes((n) => n.slice(0, 1)) })
    expect(result.current.nodes.length).toBe(1)
  })

  it('builds the storage key from the automation id', () => {
    expect(JOURNEY_KEY('a1')).toBe('orchestrator-journey-a1-v1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/journey/useJourneyStorage.test.ts`
Expected: FAIL (cannot resolve `./useJourneyStorage`).

- [ ] **Step 3: Write the implementation**

```ts
// src/features/orchestrator/journey/useJourneyStorage.ts
import { useEffect, useState } from 'react'
import { seedFor, type Journey, type JourneyNode, type JourneyEdge } from './journey-data'

export const JOURNEY_KEY = (id: string) => `orchestrator-journey-${id}-v1`

function load(automationId: string): Journey {
  try {
    const raw = window.localStorage?.getItem(JOURNEY_KEY(automationId))
    if (raw) {
      const parsed = JSON.parse(raw) as Journey
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed
    }
  } catch {
    /* ignore missing/malformed storage */
  }
  return seedFor(automationId)
}

export function useJourneyStorage(automationId: string) {
  const initial = load(automationId)
  const [nodes, setNodes] = useState<JourneyNode[]>(initial.nodes)
  const [edges, setEdges] = useState<JourneyEdge[]>(initial.edges)

  useEffect(() => {
    try {
      window.localStorage?.setItem(JOURNEY_KEY(automationId), JSON.stringify({ nodes, edges }))
    } catch {
      /* ignore quota/unavailable storage */
    }
  }, [automationId, nodes, edges])

  return { nodes, edges, setNodes, setEdges }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/journey/useJourneyStorage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/journey/useJourneyStorage.ts src/features/orchestrator/journey/useJourneyStorage.test.ts
git commit -m "feat: per-automation journey localStorage hook"
```

---

## Task 4: Custom node components

**Files:**
- Create: `src/features/orchestrator/journey/nodes/StartNode.tsx`
- Create: `src/features/orchestrator/journey/nodes/RuleNode.tsx`
- Create: `src/features/orchestrator/journey/nodes/ActionNode.tsx`
- Create: `src/features/orchestrator/journey/nodes/EndNode.tsx`

**Interfaces:**
- Consumes: `JourneyNodeData`, `Condition` from `journey-data`; `Handle`, `Position`, `type NodeProps` from `@xyflow/react`; lucide icons.
- Produces:
  - `export function StartNode(props: NodeProps): JSX.Element`
  - `export function RuleNode(props: NodeProps): JSX.Element`
  - `export function ActionNode(props: NodeProps): JSX.Element`
  - `export function EndNode(props: NodeProps): JSX.Element`
  - Each reads `props.data as JourneyNodeData`.
  - `RuleNode` renders one **source** `<Handle>` per condition with `id={'c' + index}` plus one with `id="otherwise"`; `type="source"`, `position={Position.Bottom}`.
  - `StartNode`: source handle only. `ActionNode`: target (top) + source (bottom). `EndNode`: target handle only.

**Note:** These are exercised by the `JourneyCanvas` test (Task 6) rather than standalone, because React Flow nodes require the provider context to render handles. This task ends by wiring them into a shared `nodeTypes` map used in Task 6 — but the map itself lives in `JourneyCanvas.tsx`. Verify compilation via `tsc` here.

- [ ] **Step 1: Write `StartNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play, Zap } from 'lucide-react'
import { CARD, type JourneyNodeData } from './shared'

export function StartNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: '#8dcac6' }}>
          <Play size={16} className="text-white" fill="currentColor" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">{d.title}</span>
      </div>
      {d.event && (
        <div className="mt-3 flex items-center gap-2 rounded-[4px] p-2" style={{ background: '#f2f4f7' }}>
          <span className="flex items-center justify-center rounded-full p-1" style={{ background: '#079db7' }}>
            <Zap size={12} className="text-white" aria-hidden />
          </span>
          <span className="text-[12px] font-medium text-black">{d.event}</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

Create `src/features/orchestrator/journey/nodes/shared.ts`:

```ts
export type { JourneyNodeData, Condition } from '../journey-data'
export const CARD =
  'w-[280px] rounded-[16px] bg-white p-3 shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]'
```

- [ ] **Step 2: Write `RuleNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Split } from 'lucide-react'
import { CARD, type JourneyNodeData } from './shared'

function ConditionChip({ label, tokens }: { label: string; tokens?: string[] }) {
  return (
    <div className="flex-1 rounded-[4px] p-2 text-[12px]" style={{ background: '#f2f4f7' }}>
      {tokens?.map((t) => (
        <span key={t} className="mr-1 font-medium" style={{ color: '#01567a' }}>{t}</span>
      ))}
      {label && <span className="font-medium text-black">{label}</span>}
    </div>
  )
}

export function RuleNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  const conditions = d.conditions ?? []
  return (
    <div className={CARD}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: '#ffd483' }}>
          <Split size={16} className="text-black" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">If/Otherwise</span>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-black">{d.title}</p>
      <div className="mt-3 flex flex-col gap-1">
        {conditions.map((c, i) => (
          <div key={i} className="relative flex items-center gap-2">
            <span className="text-[12px] font-medium text-black">{i + 1}</span>
            <ConditionChip label={c.label} tokens={c.tokens} />
            <Handle type="source" id={`c${i}`} position={Position.Bottom} style={{ left: '75%' }} />
          </div>
        ))}
        <div className="relative flex items-center justify-end">
          <div className="w-[243px] rounded-[4px] p-2 text-[12px] font-medium text-black" style={{ background: '#f2f4f7' }}>
            Otherwise
          </div>
          <Handle type="source" id="otherwise" position={Position.Bottom} style={{ left: '90%' }} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `ActionNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Phone, Mail, MessageSquare } from 'lucide-react'
import { CARD, type JourneyNodeData } from './shared'

const CHANNEL: Record<string, { color: string; Icon: typeof Phone }> = {
  voice: { color: '#be297b', Icon: Phone },
  email: { color: '#247acb', Icon: Mail },
  widget: { color: '#e05c34', Icon: MessageSquare },
}

export function ActionNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  const meta = CHANNEL[d.channel ?? 'widget'] ?? CHANNEL.widget
  const Icon = meta.Icon
  return (
    <div className={CARD}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: meta.color }}>
          <Icon size={16} className="text-white" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">{d.actionLabel}</span>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-black">{d.description}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

- [ ] **Step 4: Write `EndNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Square } from 'lucide-react'
import { type JourneyNodeData } from './shared'

export function EndNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  return (
    <div className="w-[280px] overflow-hidden rounded-[16px] bg-white shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 border-b p-2.5" style={{ background: '#f2f4f7', borderColor: '#d2d3d8' }}>
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: '#d2d9e5' }}>
          <Square size={16} className="text-black" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">{d.title}</span>
      </div>
      {d.ticketTags && d.ticketTags.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3">
          <span className="text-[12px] font-medium" style={{ color: '#545767' }}>Ticket Tags:</span>
          {d.ticketTags.map((t) => (
            <span key={t} className="w-fit rounded-[12px] px-2 py-1 text-[12px] font-medium text-black" style={{ background: '#e8e9eb' }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/orchestrator/journey/nodes/
git commit -m "feat: custom journey node components (start/rule/action/end)"
```

---

## Task 5: `AddButtonEdge` custom edge

**Files:**
- Create: `src/features/orchestrator/journey/edges/AddButtonEdge.tsx`

**Interfaces:**
- Consumes: `BaseEdge`, `EdgeLabelRenderer`, `getSmoothStepPath`, `type EdgeProps` from `@xyflow/react`; `Plus` from lucide.
- Produces: `export function AddButtonEdge(props: EdgeProps): JSX.Element`. Reads `props.data?.onAdd?: () => void` and `props.label`. Renders a smoothstep path, an optional branch-label pill, and a centered "+" button that calls `onAdd`.

- [ ] **Step 1: Write the implementation**

```tsx
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'

export function AddButtonEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data } = props
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  })
  const onAdd = (data as { onAdd?: () => void } | undefined)?.onAdd
  return (
    <>
      <BaseEdge id={props.id} path={path} style={{ stroke: '#c9c7c3' }} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute flex flex-col items-center gap-1"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
        >
          {label && (
            <span
              className="rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold text-black"
              style={{ background: '#ebe8e6', borderColor: '#f9f8f7' }}
            >
              {label}
            </span>
          )}
          <button
            type="button"
            aria-label="Add node"
            onClick={onAdd}
            className="flex size-6 items-center justify-center rounded-full bg-white shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]"
          >
            <Plus size={14} className="text-ink" aria-hidden />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/orchestrator/journey/edges/
git commit -m "feat: add-button journey edge with branch label"
```

---

## Task 6: `NodePalette` drawer

**Files:**
- Create: `src/features/orchestrator/journey/NodePalette.tsx`
- Test: `src/features/orchestrator/journey/NodePalette.test.tsx`

**Interfaces:**
- Consumes: `PALETTE`, `type PaletteItem`, `type PaletteIconName` from `journey-data`; lucide icons.
- Produces:
  - `const PALETTE_DND_TYPE = 'application/journey-node'`
  - `function NodePalette({ onClose }: { onClose: () => void }): JSX.Element`
  - Renders header ("Nodes" + close button `aria-label="Close node palette"`), a search input (`placeholder="Search"`), and filtered categories. Cards are `draggable` and set `e.dataTransfer.setData(PALETTE_DND_TYPE, item.id)` on drag start.
  - Exports a lucide icon lookup keyed by `PaletteIconName`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/orchestrator/journey/NodePalette.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { NodePalette } from './NodePalette'

describe('NodePalette', () => {
  it('renders the three categories', () => {
    render(<NodePalette onClose={() => {}} />)
    expect(screen.getByText('Channel Agents')).toBeInTheDocument()
    expect(screen.getByText('Logic')).toBeInTheDocument()
    expect(screen.getByText('Triage models')).toBeInTheDocument()
  })

  it('filters cards by search text', () => {
    render(<NodePalette onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'email' } })
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.queryByText('Voice')).toBeNull()
    // an empty category header disappears
    expect(screen.queryByText('Triage models')).toBeNull()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<NodePalette onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close node palette'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sets drag data when a card drag starts', () => {
    render(<NodePalette onClose={() => {}} />)
    const card = screen.getByText('Email').closest('[draggable="true"]') as HTMLElement
    const setData = vi.fn()
    fireEvent.dragStart(card, { dataTransfer: { setData, effectAllowed: '' } })
    expect(setData).toHaveBeenCalledWith('application/journey-node', 'email')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/journey/NodePalette.test.tsx`
Expected: FAIL (cannot resolve `./NodePalette`).

- [ ] **Step 3: Write the implementation**

```tsx
import { useState } from 'react'
import {
  X, Search, GripVertical, MessageSquare, Mail, Phone, Split, Repeat,
  RefreshCw, CalendarCheck, Timer, Square, Activity, Languages, Smile, ShieldAlert,
} from 'lucide-react'
import { PALETTE, type PaletteIconName, type PaletteItem } from './journey-data'

export const PALETTE_DND_TYPE = 'application/journey-node'

const ICONS: Record<PaletteIconName, typeof Mail> = {
  MessageSquare, Mail, Phone, Split, Repeat, RefreshCw, CalendarCheck,
  Timer, Square, Activity, Languages, Smile, ShieldAlert,
}

function Card({ item }: { item: PaletteItem }) {
  const Icon = ICONS[item.icon]
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_DND_TYPE, item.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="flex cursor-grab items-center gap-2.5 rounded-md border bg-white p-3"
      style={{ borderColor: '#e4e7f0' }}
    >
      <GripVertical size={16} className="text-grey-400" aria-hidden />
      <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: item.color }}>
        <Icon size={16} className="text-white" aria-hidden />
      </span>
      <span className="text-[12px] font-semibold text-black">{item.label}</span>
    </div>
  )
}

export function NodePalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const categories = PALETTE
    .map((c) => ({ ...c, items: c.items.filter((i) => i.label.toLowerCase().includes(q)) }))
    .filter((c) => c.items.length > 0)

  return (
    <div className="flex w-[340px] flex-col gap-4 rounded-[21px] border bg-white/80 p-5 shadow-[0px_0px_13px_0px_rgba(0,0,0,0.04)]" style={{ borderColor: '#f2f4f7' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-black">Nodes</h2>
        <button type="button" aria-label="Close node palette" onClick={onClose}>
          <X size={17} className="text-ink" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#f2f4f7' }}>
        <Search size={16} className="text-grey-500" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-[12px] text-black outline-none placeholder:text-grey-500"
        />
      </div>
      {categories.map((c) => (
        <div key={c.title} className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-black">{c.title}</p>
          {c.items.map((item) => <Card key={item.id} item={item} />)}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/journey/NodePalette.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/journey/NodePalette.tsx src/features/orchestrator/journey/NodePalette.test.tsx
git commit -m "feat: journey node palette drawer with search and drag"
```

---

## Task 7: `JourneyCanvas` host

**Files:**
- Create: `src/features/orchestrator/journey/JourneyCanvas.tsx`
- Test: `src/features/orchestrator/journey/JourneyCanvas.test.tsx`

**Interfaces:**
- Consumes: `useJourneyStorage`; node components from `nodes/`; `AddButtonEdge`; `NodePalette`, `PALETTE_DND_TYPE`; `PALETTE` for id→node mapping; `@xyflow/react` (`ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, `applyNodeChanges`, `applyEdgeChanges`, `addEdge`, `useReactFlow`, and change/connection types).
- Produces: `function JourneyCanvas({ automationId }: { automationId: string }): JSX.Element`. Wraps content in `ReactFlowProvider`. Registers `nodeTypes = { start, rule, action, end }` and `edgeTypes = { addButton }`. Manages palette open state; drop creates a node via `paletteItemToNode(itemId, position)`.
  - `function paletteItemToNode(itemId: string, position: { x: number; y: number }): JourneyNode` — maps a palette id to a new node (deterministic id from a module counter, per the org-context pattern; NOT `Date.now()`/`Math.random()`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/orchestrator/journey/JourneyCanvas.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JourneyCanvas } from './JourneyCanvas'

describe('JourneyCanvas', () => {
  beforeEach(() => {
    try { window.localStorage?.clear() } catch { /* no localStorage */ }
  })

  it('renders the seeded nodes for a1 (Start event + an action description)', () => {
    render(<JourneyCanvas automationId="a1" />)
    expect(screen.getByText('On Event: Cart abandoned')).toBeInTheDocument()
    expect(screen.getByText('Call customers with abandoned carts')).toBeInTheDocument()
  })

  it('renders the node palette and can close it', () => {
    render(<JourneyCanvas automationId="a1" />)
    expect(screen.getByText('Nodes')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close node palette'))
    expect(screen.queryByText('Nodes')).toBeNull()
  })

  it('can reopen the palette after closing', () => {
    render(<JourneyCanvas automationId="a1" />)
    fireEvent.click(screen.getByLabelText('Close node palette'))
    fireEvent.click(screen.getByLabelText('Open node palette'))
    expect(screen.getByText('Nodes')).toBeInTheDocument()
  })
})
```

> **Note for the implementer:** React Flow renders nodes into a viewport that jsdom cannot measure, but node *content* still renders in the DOM, so text assertions work. Wrap the canvas in `ReactFlowProvider` inside the component (not the test). If a node's text does not appear, ensure `nodeTypes` is registered and `nodes` come from the hook.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/journey/JourneyCanvas.test.tsx`
Expected: FAIL (cannot resolve `./JourneyCanvas`).

- [ ] **Step 3: Write the implementation**

```tsx
import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow,
  applyNodeChanges, applyEdgeChanges, addEdge,
  type Node, type Edge, type NodeChange, type EdgeChange, type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PanelRightOpen } from 'lucide-react'
import { useJourneyStorage } from './useJourneyStorage'
import { PALETTE, type JourneyNode } from './journey-data'
import { StartNode } from './nodes/StartNode'
import { RuleNode } from './nodes/RuleNode'
import { ActionNode } from './nodes/ActionNode'
import { EndNode } from './nodes/EndNode'
import { AddButtonEdge } from './edges/AddButtonEdge'
import { NodePalette, PALETTE_DND_TYPE } from './NodePalette'

const nodeTypes = { start: StartNode, rule: RuleNode, action: ActionNode, end: EndNode }
const edgeTypes = { addButton: AddButtonEdge }

let seq = 0
const ALL_ITEMS = PALETTE.flatMap((c) => c.items)

// Maps a dropped palette item to a new journey node. Channel agents become
// action nodes; 'end' becomes an end node; everything else becomes a rule node.
export function paletteItemToNode(itemId: string, position: { x: number; y: number }): JourneyNode {
  const item = ALL_ITEMS.find((i) => i.id === itemId)
  const id = `n${seq++}`
  const label = item?.label ?? 'Node'
  if (itemId === 'end') {
    return { id, type: 'end', position, data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } }
  }
  if (itemId === 'widget' || itemId === 'email' || itemId === 'voice') {
    return { id, type: 'action', position, data: { kind: 'action', channel: itemId, actionLabel: label, title: label, description: label } }
  }
  return { id, type: 'rule', position, data: { kind: 'rule', title: label, conditions: [{ label: '', tokens: [] }] } }
}

function Canvas({ automationId }: { automationId: string }) {
  const { nodes, edges, setNodes, setEdges } = useJourneyStorage(automationId)
  const [paletteOpen, setPaletteOpen] = useState(true)
  const { screenToFlowPosition } = useReactFlow()

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((n) => applyNodeChanges(changes, n as Node[]) as JourneyNode[]), [setNodes])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((e) => applyEdgeChanges(changes, e as Edge[]) as typeof edges), [setEdges])
  const onConnect = useCallback((c: Connection) => setEdges((e) => addEdge({ ...c, type: 'addButton' }, e as Edge[]) as typeof edges), [setEdges])

  const openPalette = useCallback(() => setPaletteOpen(true), [])

  const edgesWithData = useMemo(
    () => edges.map((e) => ({ ...e, type: 'addButton', data: { onAdd: openPalette } })),
    [edges, openPalette],
  )

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const itemId = event.dataTransfer.getData(PALETTE_DND_TYPE)
    if (!itemId) return
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    setNodes((n) => [...n, paletteItemToNode(itemId, position)])
  }, [screenToFlowPosition, setNodes])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div className="relative h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes as Node[]}
        edges={edgesWithData as Edge[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
      {paletteOpen ? (
        <div className="absolute right-4 top-4">
          <NodePalette onClose={() => setPaletteOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open node palette"
          onClick={() => setPaletteOpen(true)}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-surface-border bg-white"
        >
          <PanelRightOpen size={18} className="text-ink" aria-hidden />
        </button>
      )}
    </div>
  )
}

export function JourneyCanvas({ automationId }: { automationId: string }) {
  return (
    <ReactFlowProvider>
      <Canvas automationId={automationId} />
    </ReactFlowProvider>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/journey/JourneyCanvas.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/orchestrator/journey/JourneyCanvas.tsx src/features/orchestrator/journey/JourneyCanvas.test.tsx
git commit -m "feat: journey canvas host with palette drag-drop and edges"
```

---

## Task 8: `AutomationDetailScreen` + route

**Files:**
- Create: `src/features/orchestrator/AutomationDetailScreen.tsx`
- Test: `src/features/orchestrator/AutomationDetailScreen.test.tsx`
- Modify: `src/routes.tsx`

**Interfaces:**
- Consumes: `useParams`, `useNavigate`, `Navigate` from `react-router`; `AUTOMATIONS` from `orchestrator-data`; `JourneyCanvas`.
- Produces: `function AutomationDetailScreen(): JSX.Element`. Reads `:id`; if not in `AUTOMATIONS`, renders `<Navigate to="/orchestrator" replace />`. Renders a top bar (back arrow → `/orchestrator`, automation name, kebab, tab group Journey/Analytic/Log, "Run A/B Test") and the active tab body. Root has `data-testid="screen-automation-detail"`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/orchestrator/AutomationDetailScreen.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('AutomationDetailScreen', () => {
  beforeEach(() => {
    try { window.localStorage?.clear() } catch { /* no localStorage */ }
  })

  it('renders the detail screen with the automation name at /orchestrator/a1', () => {
    renderAt('/orchestrator/a1')
    expect(screen.getByTestId('screen-automation-detail')).toBeInTheDocument()
    expect(screen.getByText('Call users with issues')).toBeInTheDocument()
  })

  it('shows the Journey tab (canvas) by default', () => {
    renderAt('/orchestrator/a1')
    expect(screen.getByText('Nodes')).toBeInTheDocument() // palette present
  })

  it('switches to the Analytic tab placeholder', () => {
    renderAt('/orchestrator/a1')
    fireEvent.click(screen.getByRole('tab', { name: 'Analytic' }))
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    expect(screen.queryByText('Nodes')).toBeNull()
  })

  it('redirects an unknown id back to /orchestrator', () => {
    renderAt('/orchestrator/does-not-exist')
    expect(screen.getByTestId('screen-orchestrator')).toBeInTheDocument()
    expect(screen.queryByTestId('screen-automation-detail')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/AutomationDetailScreen.test.tsx`
Expected: FAIL (cannot resolve `./AutomationDetailScreen` / route missing).

- [ ] **Step 3: Write `AutomationDetailScreen.tsx`**

```tsx
import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { AUTOMATIONS } from './orchestrator-data'
import { JourneyCanvas } from './journey/JourneyCanvas'

type Tab = 'journey' | 'analytic' | 'log'
const TABS: { id: Tab; label: string }[] = [
  { id: 'journey', label: 'Journey' },
  { id: 'analytic', label: 'Analytic' },
  { id: 'log', label: 'Log' },
]

export function AutomationDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('journey')
  const automation = AUTOMATIONS.find((a) => a.id === id)

  if (!automation) return <Navigate to="/orchestrator" replace />

  return (
    <div data-testid="screen-automation-detail" className="flex h-full flex-col overflow-hidden rounded-[26px] bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-surface-border px-6 py-3">
        <button type="button" aria-label="Back to Orchestrator" onClick={() => navigate('/orchestrator')}>
          <ArrowLeft size={18} className="text-ink" aria-hidden />
        </button>
        <span className="text-[15px] font-semibold text-ink">{automation.name}</span>
        <button type="button" aria-label="Automation options">
          <MoreHorizontal size={18} className="text-ink-muted" aria-hidden />
        </button>

        <div role="tablist" className="mx-auto flex items-center gap-1 rounded-full bg-[#f5f6f7] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={
                'rounded-full px-4 py-1.5 text-[14px] ' +
                (tab === t.id ? 'bg-white font-medium text-ink shadow-sm' : 'text-ink-muted')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <button type="button" className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white">
          Run A/B Test
        </button>
      </div>

      {/* Tab body */}
      <div className="min-h-0 flex-1">
        {tab === 'journey' ? (
          <JourneyCanvas automationId={automation.id} />
        ) : (
          <div className="flex h-full items-center justify-center text-[14px] text-ink-muted">
            {TABS.find((t) => t.id === tab)?.label} — Coming soon
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add the route in `src/routes.tsx`**

Add the import near the other orchestrator import:

```tsx
import { AutomationDetailScreen } from '@/features/orchestrator/AutomationDetailScreen'
```

Add a sibling child right after the existing `{ path: 'orchestrator', ... }` entry:

```tsx
{ path: 'orchestrator', element: <OrchestratorScreen /> },
{ path: 'orchestrator/:id', element: <AutomationDetailScreen /> },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/AutomationDetailScreen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/orchestrator/AutomationDetailScreen.tsx src/features/orchestrator/AutomationDetailScreen.test.tsx src/routes.tsx
git commit -m "feat: automation detail screen with journey/analytic/log tabs and route"
```

---

## Task 9: Make table rows navigate

**Files:**
- Modify: `src/features/orchestrator/OrchestratorScreen.tsx`
- Modify: `src/features/orchestrator/AutomationTable.tsx`
- Modify: `src/features/orchestrator/AutomationTable.test.tsx`

**Interfaces:**
- Consumes: `useNavigate` from `react-router`.
- Produces: `AutomationTable` gains an optional `onOpen?: (id: string) => void` prop; each row is a `role="button"` that calls `onOpen(a.id)` on click and on Enter/Space; the toggle button calls `e.stopPropagation()`.

- [ ] **Step 1: Write the failing test (extend AutomationTable.test.tsx)**

Add these cases (keep existing ones):

```tsx
import { fireEvent } from '@testing-library/react'
// ...
it('calls onOpen with the automation id when a row is clicked', () => {
  const onOpen = vi.fn()
  render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} onOpen={onOpen} />)
  fireEvent.click(screen.getByText('Call users with issues'))
  expect(onOpen).toHaveBeenCalledWith('a1')
})

it('does not call onOpen when the toggle is clicked', () => {
  const onOpen = vi.fn()
  render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} onOpen={onOpen} />)
  fireEvent.click(screen.getByLabelText('Activate Call users with issues'))
  expect(onOpen).not.toHaveBeenCalled()
})
```

(Ensure `AUTOMATIONS`, `vi`, `screen`, `render` are imported at the top of the file.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/orchestrator/AutomationTable.test.tsx`
Expected: FAIL (`onOpen` not wired / row not clickable).

- [ ] **Step 3: Update `AutomationTable.tsx`**

Add `onOpen?: (id: string) => void` to the props type. Make the row container:

```tsx
<div
  key={a.id}
  role="button"
  tabIndex={0}
  onClick={() => onOpen?.(a.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen?.(a.id)
    }
  }}
  className="grid cursor-pointer grid-cols-[1.4fr_1fr_1.6fr_0.5fr_1fr_0.7fr] items-center gap-4 rounded-2xl border border-surface-border bg-white px-5 py-4"
>
```

In the `Toggle` component's `onClick`, stop propagation:

```tsx
onClick={(e) => { e.stopPropagation(); onToggle(automation.id) }}
```

- [ ] **Step 4: Wire `onOpen` in `OrchestratorScreen.tsx`**

Add `import { useNavigate } from 'react-router'`, then inside the component:

```tsx
const navigate = useNavigate()
```

Pass to the table:

```tsx
<AutomationTable automations={automations} isOn={(a) => a.on} onToggle={onToggle} onOpen={(id) => navigate(`/orchestrator/${id}`)} />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/features/orchestrator/AutomationTable.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/orchestrator/OrchestratorScreen.tsx src/features/orchestrator/AutomationTable.tsx src/features/orchestrator/AutomationTable.test.tsx
git commit -m "feat: orchestrator table rows open the automation detail screen"
```

---

## Task 10: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 2: Full test run**

Run: `npx vitest run`
Expected: PASS (all prior 169 tests plus the new suites).

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: PASS (build completes, no type errors, `@xyflow/react` bundles).

- [ ] **Step 4: Manual smoke check note**

Run `npx vite dev`, open `/orchestrator`, click a row → detail screen loads with the seeded journey; drag a palette card onto the canvas → a node appears; toggle the palette closed/open; switch tabs. (This step is a manual confirmation; no commit.)

- [ ] **Step 5: Final commit if any fixups were needed**

```bash
git add -A
git commit -m "chore: verification fixups for orchestrator automation detail" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** routing (Task 8/9), top bar + tabs (Task 8), journey editor (Tasks 4–7), palette with search + drag (Task 6), drag-drop node creation (Task 7), edges with branch labels + add button (Task 5), data model + seeds (Task 2), persistence (Task 3), dependency (Task 1). Analytic/Log placeholders (Task 8). All covered.
- **Types:** `Journey`, `JourneyNode`, `JourneyEdge`, `JourneyNodeData`, `PaletteItem`, `NodeCategory`, `PaletteIconName` defined in Task 2 and consumed consistently thereafter. `PALETTE_DND_TYPE` defined in Task 6, consumed in Task 7. `paletteItemToNode` defined + exported in Task 7.
- **Determinism:** new node ids use a module `seq` counter (Task 7), consistent with `org-context.tsx` — no `Date.now()`/`Math.random()`.
- **jsdom:** `ResizeObserver` already stubbed in `src/test/setup.ts`; React Flow node text renders in the DOM so behavioral assertions hold without layout measurement.
