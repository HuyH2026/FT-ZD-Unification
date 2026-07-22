# Topics Treemap ("Heatmap") View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated treemap toggle to the CX Journey → Topics toolbar that swaps the nested table for a squarified treemap with a hover tooltip and click-to-drill-down into sub-topics.

**Architecture:** A pure `squarify()` layout function (no React, unit-tested) computes cell rectangles from ticket volumes. `TopicTreemap` measures its container with a ResizeObserver (mirroring `FlowSankey`'s `useMeasured`), runs `squarify`, and renders absolutely-positioned colored `<div>` cells. It owns hover + drill-down state and renders a breadcrumb and a `TreemapTooltip` card. `TopicsTable` lifts a `view` state and gains a toolbar toggle.

**Tech Stack:** React 19, TypeScript (strict), Vite, Tailwind v4, Vitest + React Testing Library (jsdom), lucide-react icons.

## Global Constraints

- **Path alias:** `@` → `src/`. Do NOT add `baseUrl` to `tsconfig.json`.
- **TypeScript strict mode** — all new code fully typed.
- **No backend** — all data mocked in `topics-data.ts`.
- **Determinism:** `Date.now()` / `Math.random()` are unavailable/nondeterministic here — do not use them. `squarify` must be a pure function of its inputs.
- **Tokens & colors:** reuse `BLUE/TEAL/AMBER/RED/GREY/DEEP_TEAL` from `src/features/insights/cx-journey/cx-journey-data.ts`; use semantic Tailwind token classes (`text-ink`, `text-ink-muted`, `border-surface-border`, `bg-white`, `bg-app-backdrop`) per CLAUDE.md rather than raw hex in JSX.
- **Verification gates** (lint is a known-broken TS7 toolchain gap — do NOT rely on it): `pnpm typecheck`, `pnpm test`, `pnpm build`. If `pnpm` is not on PATH, use `npx tsc --noEmit`, `npx vitest run`, `npx vite build`.
- **Localized numbers:** format ticket counts with `.toLocaleString('en-US')` (matches existing `TopicsTable` rows).

---

### Task 1: Squarified treemap layout function

**Files:**
- Create: `src/features/insights/cx-journey/topics/treemap-layout.ts`
- Test: `src/features/insights/cx-journey/topics/treemap-layout.test.ts`

**Interfaces:**
- Consumes: nothing (pure function).
- Produces:
  - `type TreemapItem = { id: string; value: number }`
  - `type PlacedCell = { id: string; x: number; y: number; w: number; h: number }`
  - `function squarify(items: TreemapItem[], size: { width: number; height: number }): PlacedCell[]`
  - Contract: cells fully tile the box (no gaps, no overlap); each cell's area is proportional to its `value` relative to the sum of all values; output is deterministic for identical input; order of returned cells matches input order (by `id`). Items with `value <= 0` are treated as `0` area but still returned (zero-size cell). If `items` is empty, returns `[]`. If total value is `0`, returns zero-area cells at the origin.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, expect, it } from 'vitest'
import { squarify, type TreemapItem } from './treemap-layout'

const SIZE = { width: 600, height: 400 }
const AREA = SIZE.width * SIZE.height

function areaOf(c: { w: number; h: number }) {
  return c.w * c.h
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: typeof a) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

describe('squarify', () => {
  const items: TreemapItem[] = [
    { id: 'a', value: 50 },
    { id: 'b', value: 30 },
    { id: 'c', value: 20 },
  ]

  it('returns one cell per item, preserving ids', () => {
    const cells = squarify(items, SIZE)
    expect(cells.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('tiles the full box (areas sum to box area)', () => {
    const cells = squarify(items, SIZE)
    const total = cells.reduce((s, c) => s + areaOf(c), 0)
    expect(total).toBeCloseTo(AREA, 1)
  })

  it('sizes each cell proportionally to its value', () => {
    const cells = squarify(items, SIZE)
    const byId = Object.fromEntries(cells.map((c) => [c.id, c]))
    // 'a' is 50% of value → ~50% of area
    expect(areaOf(byId.a) / AREA).toBeCloseTo(0.5, 2)
    expect(areaOf(byId.b) / AREA).toBeCloseTo(0.3, 2)
    expect(areaOf(byId.c) / AREA).toBeCloseTo(0.2, 2)
  })

  it('produces no overlapping cells', () => {
    const cells = squarify(items, SIZE)
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        expect(overlaps(cells[i], cells[j])).toBe(false)
      }
    }
  })

  it('keeps all cells inside the box', () => {
    const cells = squarify(items, SIZE)
    for (const c of cells) {
      expect(c.x).toBeGreaterThanOrEqual(-0.001)
      expect(c.y).toBeGreaterThanOrEqual(-0.001)
      expect(c.x + c.w).toBeLessThanOrEqual(SIZE.width + 0.001)
      expect(c.y + c.h).toBeLessThanOrEqual(SIZE.height + 0.001)
    }
  })

  it('is deterministic for identical input', () => {
    expect(squarify(items, SIZE)).toEqual(squarify(items, SIZE))
  })

  it('fills the box with a single item', () => {
    const cells = squarify([{ id: 'only', value: 7 }], SIZE)
    expect(cells).toEqual([{ id: 'only', x: 0, y: 0, w: SIZE.width, h: SIZE.height }])
  })

  it('returns [] for empty input', () => {
    expect(squarify([], SIZE)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/insights/cx-journey/topics/treemap-layout.test.ts`
Expected: FAIL — `squarify` is not defined / module not found.

- [ ] **Step 3: Implement `squarify`**

Standard squarified-treemap (Bruls, Huizing, van Wijk). Layout items into rows along the shorter side, flushing a row when adding the next item would worsen the worst aspect ratio.

```typescript
// Squarified treemap layout (Bruls, Huizing & van Wijk 2000).
// Pure function: maps weighted items to non-overlapping rectangles that tile the
// given box, each cell's area proportional to its value. Used by TopicTreemap.
export type TreemapItem = { id: string; value: number }
export type PlacedCell = { id: string; x: number; y: number; w: number; h: number }

type Rect = { x: number; y: number; w: number; h: number }

// Worst (largest) aspect ratio in a row of already-scaled areas laid along a
// side of length `side`. `sum` is the total scaled area of the row.
function worst(areas: number[], side: number, sum: number): number {
  if (areas.length === 0 || side === 0) return Infinity
  const max = Math.max(...areas)
  const min = Math.min(...areas)
  const s2 = sum * sum
  const side2 = side * side
  return Math.max((side2 * max) / s2, s2 / (side2 * min))
}

// Place a finished row of `areas` (scaled to px²) along the shorter side of
// `rect`, returning the placed cells and the remaining rect. Mutates nothing.
function layoutRow(
  row: { id: string; area: number }[],
  rect: Rect,
): { cells: PlacedCell[]; rest: Rect } {
  const rowSum = row.reduce((s, r) => s + r.area, 0)
  const cells: PlacedCell[] = []
  const horizontal = rect.w >= rect.h
  if (horizontal) {
    const rowW = rowSum / rect.h // thickness of the row (a vertical strip)
    let y = rect.y
    for (const r of row) {
      const h = r.area / rowW
      cells.push({ id: r.id, x: rect.x, y, w: rowW, h })
      y += h
    }
    return { cells, rest: { x: rect.x + rowW, y: rect.y, w: rect.w - rowW, h: rect.h } }
  }
  const rowH = rowSum / rect.w // thickness of the row (a horizontal strip)
  let x = rect.x
  for (const r of row) {
    const w = r.area / rowH
    cells.push({ id: r.id, x, y: rect.y, w, h: rowH })
    x += w
  }
  return { cells, rest: { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH } }
}

export function squarify(items: TreemapItem[], size: { width: number; height: number }): PlacedCell[] {
  if (items.length === 0) return []
  const totalValue = items.reduce((s, i) => s + Math.max(i.value, 0), 0)
  const totalArea = size.width * size.height
  // Scale each value into px² so row areas are directly comparable to side lengths.
  const scaled = items.map((i) => ({
    id: i.id,
    area: totalValue > 0 ? (Math.max(i.value, 0) / totalValue) * totalArea : 0,
  }))

  const placed: PlacedCell[] = []
  let rect: Rect = { x: 0, y: 0, w: size.width, h: size.height }
  let row: { id: string; area: number }[] = []
  let i = 0

  while (i < scaled.length) {
    const side = Math.min(rect.w, rect.h)
    const rowSum = row.reduce((s, r) => s + r.area, 0)
    const current = worst(row.map((r) => r.area), side, rowSum)
    const withNext = worst(
      [...row, scaled[i]].map((r) => r.area),
      side,
      rowSum + scaled[i].area,
    )
    if (row.length === 0 || withNext <= current) {
      row.push(scaled[i])
      i++
    } else {
      const { cells, rest } = layoutRow(row, rect)
      placed.push(...cells)
      rect = rest
      row = []
    }
  }
  if (row.length > 0) {
    const { cells } = layoutRow(row, rect)
    placed.push(...cells)
  }
  return placed
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/insights/cx-journey/topics/treemap-layout.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/topics/treemap-layout.ts src/features/insights/cx-journey/topics/treemap-layout.test.ts
git commit -m "feat(topics): add squarified treemap layout function"
```

---

### Task 2: Extend topics mock data with tooltip metrics + colors

**Files:**
- Modify: `src/features/insights/cx-journey/topics/topics-data.ts`
- Test: `src/features/insights/cx-journey/topics/topics-data.test.ts` (existing — add cases)

**Interfaces:**
- Consumes: `BLUE, TEAL, AMBER, RED, GREY, DEEP_TEAL` from `../cx-journey-data`.
- Produces (added to existing exports):
  - `TopicLeaf` gains: `avgFirstResTime: string; avgFullResTime: string; agentReplyTime: string; agentReplies: string; csat: string`
  - `TopicRow` gains: `color: string` plus the same five metric fields as `TopicLeaf` above.
  - `export const TOPIC_COLORS: string[]` — at least 8 distinct hues.
  - Every entry in `TOPIC_ROWS`, and every sub/leaf, populated with the new fields.

Note: `TopicSub = TopicLeaf & { count; children }`, so extending `TopicLeaf` automatically extends `TopicSub`. The `leaf()` builder must be updated to accept and set the five new fields.

- [ ] **Step 1: Read the current file to confirm exact shapes**

Run: `sed -n '1,90p' src/features/insights/cx-journey/topics/topics-data.ts`
Confirm the `TopicLeaf`, `TopicSub`, `TopicRow` types and the `leaf()` builder signature before editing.

- [ ] **Step 2: Write failing tests**

Add to `src/features/insights/cx-journey/topics/topics-data.test.ts`:

```typescript
import { TOPIC_ROWS, TOPIC_COLORS } from './topics-data'

describe('topics treemap data', () => {
  it('gives every top-level row a color and the full tooltip metric set', () => {
    for (const row of TOPIC_ROWS) {
      expect(row.color).toMatch(/^#/)
      expect(row.avgFirstResTime).toBeTruthy()
      expect(row.avgFullResTime).toBeTruthy()
      expect(row.agentReplyTime).toBeTruthy()
      expect(row.agentReplies).toBeTruthy()
      expect(row.csat).toBeTruthy()
    }
  })

  it('gives every sub-topic and leaf the full tooltip metric set', () => {
    for (const row of TOPIC_ROWS) {
      for (const sub of row.children) {
        expect(sub.avgFirstResTime).toBeTruthy()
        expect(sub.agentReplies).toBeTruthy()
        for (const leaf of sub.children) {
          expect(leaf.avgFirstResTime).toBeTruthy()
          expect(leaf.agentReplies).toBeTruthy()
        }
      }
    }
  })

  it('exposes at least as many palette colors as top-level rows', () => {
    expect(TOPIC_COLORS.length).toBeGreaterThanOrEqual(TOPIC_ROWS.length)
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/features/insights/cx-journey/topics/topics-data.test.ts`
Expected: FAIL — `TOPIC_COLORS` not exported / `color` etc. undefined.

- [ ] **Step 4: Extend the types, builder, palette, and data**

In `topics-data.ts`:

1. Add fields to `TopicLeaf`:

```typescript
export type TopicLeaf = {
  id: string
  name: string
  tickets: number
  ticketsPct: string
  ticketsChangePct: number
  ticketsChangeAbs: string
  fullResTime: string
  fullResChangePct: number
  fullResChangeAbs: string
  // Tooltip metrics (treemap view)
  avgFirstResTime: string
  avgFullResTime: string
  agentReplyTime: string
  agentReplies: string
  csat: string
}
```

2. Add `color` + the metric fields to `TopicRow`:

```typescript
export type TopicRow = {
  id: string
  name: string
  count: number
  tickets: number
  ticketsPct: string
  firstContactResolution: string
  sentiment: number
  color: string
  avgFirstResTime: string
  avgFullResTime: string
  agentReplyTime: string
  agentReplies: string
  csat: string
  children: TopicSub[]
}
```

3. Add the palette near the color imports:

```typescript
// Per-top-level-topic treemap colors. Reuses the CX Journey accent palette and
// adds a few distinct hues so all eight top-level rows read apart.
export const TOPIC_COLORS = [RED, BLUE, TEAL, AMBER, '#7b5ea7', DEEP_TEAL, GREY, '#5a8f4d'] as const
```

4. Update the `leaf()` builder to set the new fields. Keep it terse by giving all leaves the same representative tooltip values (illustrative mock — no backend):

```typescript
function leaf(
  id: string,
  name: string,
  tickets: number,
  ticketsPct: string,
  ticketsChangePct: number,
  ticketsChangeAbs: string,
  fullResTime: string,
  fullResChangePct: number,
  fullResChangeAbs: string,
): TopicLeaf {
  return {
    id, name, tickets, ticketsPct, ticketsChangePct, ticketsChangeAbs,
    fullResTime, fullResChangePct, fullResChangeAbs,
    avgFirstResTime: '20.9 hrs', avgFullResTime: '25.6 hrs',
    agentReplyTime: '9.5 hrs', agentReplies: '1.12', csat: '4.1',
  }
}
```

5. Give each `TOPIC_ROWS` entry a `color` (indexed from `TOPIC_COLORS`) and the five metric fields. Example for the first row — apply the same pattern to all eight, varying values a little for realism:

```typescript
export const TOPIC_ROWS: TopicRow[] = [
  { id: 'account', name: 'Account Management', count: 16, tickets: 25286, ticketsPct: '40.89%', firstContactResolution: '69.4%', sentiment: 48.6, color: TOPIC_COLORS[0], avgFirstResTime: '20.9 hrs', avgFullResTime: '25.6 hrs', agentReplyTime: '9.5 hrs', agentReplies: '1.12', csat: '4.1', children: genericChildren('account') },
  // ...remaining seven rows: color: TOPIC_COLORS[1..7], same five metric fields (vary values).
]
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run src/features/insights/cx-journey/topics/topics-data.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck (catches missing fields anywhere)**

Run: `npx tsc --noEmit`
Expected: no errors. (If `TopicsTable` or other consumers break, they shouldn't — only additive fields were introduced.)

- [ ] **Step 7: Commit**

```bash
git add src/features/insights/cx-journey/topics/topics-data.ts src/features/insights/cx-journey/topics/topics-data.test.ts
git commit -m "feat(topics): extend topic data with treemap tooltip metrics and colors"
```

---

### Task 3: TreemapTooltip card

**Files:**
- Create: `src/features/insights/cx-journey/topics/TreemapTooltip.tsx`
- Test: covered via `TopicTreemap.test.tsx` in Task 4 (this is a presentational leaf; no standalone test file).

**Interfaces:**
- Consumes: `sentimentBand` and the metric fields from `topics-data.ts`.
- Produces:
  - `type TreemapTooltipData = { name: string; color: string; volume: string; volumePct: string; firstContactResolution: string; avgFirstResTime: string; avgFullResTime: string; sentiment: number; agentReplyTime: string; agentReplies: string }`
  - `function TreemapTooltip(props: { data: TreemapTooltipData }): JSX.Element`
  - Renders: a color swatch + `name` header, then rows: Volume, First contact resolution, Avg first resolution time, Avg full resolution time, Sentiment (with face via `sentimentBand`), Agent reply time, Agent replies — label left (`text-ink-muted`), value right (`text-ink`).

- [ ] **Step 1: Write the component**

```tsx
// Hover card for the Topics treemap. Presentational: given one topic's metrics,
// renders the swatch/name header and a labelled metric list, matching the
// CX Journey_01 tooltip. Positioning is handled by the parent (TopicTreemap).
import { Frown, Meh, Smile, type LucideIcon } from 'lucide-react'
import { sentimentBand } from './topics-data'

export type TreemapTooltipData = {
  name: string
  color: string
  volume: string
  volumePct: string
  firstContactResolution: string
  avgFirstResTime: string
  avgFullResTime: string
  sentiment: number
  agentReplyTime: string
  agentReplies: string
}

const BAND_FACE: Record<string, LucideIcon> = { good: Smile, ok: Meh, bad: Frown }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 text-[13px]">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{children}</span>
    </div>
  )
}

export function TreemapTooltip({ data }: { data: TreemapTooltipData }) {
  const band = sentimentBand(data.sentiment)
  const Face = BAND_FACE[band.label]
  return (
    <div className="pointer-events-none w-[273px] rounded-xl border border-surface-border bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: data.color }} />
        <span className="text-[13px] font-semibold text-ink">{data.name}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Row label="Volume">
          {data.volume} <span className="font-normal text-ink-muted">({data.volumePct})</span>
        </Row>
        <Row label="First contact resolution">{data.firstContactResolution}</Row>
        <Row label="Avg. first resolution time">{data.avgFirstResTime}</Row>
        <Row label="Avg. full resolution time">{data.avgFullResTime}</Row>
        <Row label="Sentiment">
          <span className="flex items-center gap-1.5">
            {data.sentiment}%
            <Face className="h-4 w-4" style={{ color: band.color }} />
          </span>
        </Row>
        <Row label="Agent reply time">{data.agentReplyTime}</Row>
        <Row label="Agent replies">{data.agentReplies}</Row>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/insights/cx-journey/topics/TreemapTooltip.tsx
git commit -m "feat(topics): add treemap hover tooltip card"
```

---

### Task 4: TopicTreemap (measured render + hover + drill-down)

**Files:**
- Create: `src/features/insights/cx-journey/topics/TopicTreemap.tsx`
- Test: `src/features/insights/cx-journey/topics/TopicTreemap.test.tsx`

**Interfaces:**
- Consumes: `squarify`, `PlacedCell` from `./treemap-layout`; `TOPIC_ROWS`, `TopicRow` from `./topics-data`; `TreemapTooltip`, `TreemapTooltipData` from `./TreemapTooltip`.
- Produces:
  - `function TopicTreemap(): JSX.Element`
  - Internal test seam: accept an optional prop `initialSize?: { width: number; height: number }` used to seed the measured size so jsdom (no layout) can render cells. Default `{ width: 0, height: 0 }`; the ResizeObserver overrides it in the browser.
  - Root element carries `data-testid="topics-treemap"`.

**jsdom note:** ResizeObserver does not report a size in jsdom, so the component reads `size` from state seeded by `initialSize`. Tests pass a non-zero `initialSize` so `squarify` produces cells.

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TopicTreemap } from './TopicTreemap'
import { TOPIC_ROWS } from './topics-data'

const SIZE = { width: 800, height: 400 }

describe('TopicTreemap', () => {
  it('renders one cell per top-level topic', () => {
    render(<TopicTreemap initialSize={SIZE} />)
    const root = within(screen.getByTestId('topics-treemap'))
    for (const row of TOPIC_ROWS) {
      expect(root.getAllByText(row.name, { exact: false }).length).toBeGreaterThan(0)
    }
  })

  it('shows the tooltip with topic metrics on hover', async () => {
    const user = userEvent.setup()
    render(<TopicTreemap initialSize={SIZE} />)
    await user.hover(screen.getByRole('button', { name: /Account Management/ }))
    // Tooltip-only label proves the card rendered.
    expect(screen.getByText('Avg. first resolution time')).toBeInTheDocument()
  })

  it('drills into a topic on click and shows a breadcrumb back to All topics', async () => {
    const user = userEvent.setup()
    render(<TopicTreemap initialSize={SIZE} />)
    await user.click(screen.getByRole('button', { name: /Account Management/ }))
    const root = within(screen.getByTestId('topics-treemap'))
    // Sub-topics of the generic tree are now the cells.
    expect(root.getByText('Common requests', { exact: false })).toBeInTheDocument()
    expect(root.getByRole('button', { name: 'All topics' })).toBeInTheDocument()
  })

  it('returns to top level when the breadcrumb root is clicked', async () => {
    const user = userEvent.setup()
    render(<TopicTreemap initialSize={SIZE} />)
    await user.click(screen.getByRole('button', { name: /Account Management/ }))
    await user.click(screen.getByRole('button', { name: 'All topics' }))
    const root = within(screen.getByTestId('topics-treemap'))
    // Back at top level: another top-level topic is visible again.
    expect(root.getAllByText('Verification and Security', { exact: false }).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/insights/cx-journey/topics/TopicTreemap.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TopicTreemap**

```tsx
// Treemap view for the Topics tab. Measures its container, lays out cells with
// `squarify` sized by ticket volume, and renders colored rectangles with a hover
// tooltip. Clicking a top-level cell drills into that topic's sub-topics; a
// breadcrumb returns to the top level. Mirrors FlowSankey's measured-viz pattern.
import { useEffect, useRef, useState } from 'react'
import { squarify } from './treemap-layout'
import { TOPIC_ROWS, type TopicRow, type TopicSub } from './topics-data'
import { TreemapTooltip, type TreemapTooltipData } from './TreemapTooltip'

// Below this cell area (px²) the in-cell label is hidden — matches the reference
// where thin cells carry no text.
const MIN_LABEL_AREA = 5000

function useMeasured(seed: { width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(seed)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, size }
}

type Cell = TopicRow | TopicSub

function tooltipData(cell: Cell): TreemapTooltipData {
  const volume = cell.tickets.toLocaleString('en-US')
  // Top-level rows carry firstContactResolution + numeric sentiment; sub-topics
  // reuse their leaf metrics with representative fallbacks.
  const isTop = 'firstContactResolution' in cell
  return {
    name: cell.name,
    color: 'color' in cell ? cell.color : '#8b8e89',
    volume,
    volumePct: cell.ticketsPct ?? '',
    firstContactResolution: isTop ? (cell as TopicRow).firstContactResolution : '—',
    avgFirstResTime: cell.avgFirstResTime,
    avgFullResTime: cell.avgFullResTime,
    sentiment: isTop ? (cell as TopicRow).sentiment : 50,
    agentReplyTime: cell.agentReplyTime,
    agentReplies: cell.agentReplies,
  }
}

export function TopicTreemap({ initialSize = { width: 0, height: 0 } }: { initialSize?: { width: number; height: number } }) {
  const { ref, size } = useMeasured(initialSize)
  const [drillId, setDrillId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const drilled = drillId ? TOPIC_ROWS.find((r) => r.id === drillId) ?? null : null
  const cells: Cell[] = drilled ? drilled.children : TOPIC_ROWS
  const placed = squarify(cells.map((c) => ({ id: c.id, value: c.tickets })), size)
  const byId = Object.fromEntries(cells.map((c) => [c.id, c]))
  const hovered = hoverId ? byId[hoverId] : null

  return (
    <section data-testid="topics-treemap" className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        <button
          type="button"
          onClick={() => setDrillId(null)}
          className={drilled ? 'text-ink-muted underline-offset-2 hover:underline' : 'font-medium text-ink'}
        >
          All topics
        </button>
        {drilled && (
          <>
            <span className="text-ink-muted">/</span>
            <span className="font-medium text-ink">{drilled.name}</span>
          </>
        )}
      </div>

      {/* Measured treemap canvas */}
      <div ref={ref} className="relative h-[480px] w-full overflow-hidden rounded-xl border border-surface-border">
        {placed.map((p) => {
          const cell = byId[p.id]
          if (!cell) return null
          const showLabel = p.w * p.h >= MIN_LABEL_AREA
          const color = 'color' in cell ? cell.color : (drilled?.color ?? '#8b8e89')
          const isTop = !drilled
          return (
            <button
              type="button"
              key={p.id}
              aria-label={cell.name}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId((h) => (h === p.id ? null : h))}
              onClick={isTop ? () => setDrillId(p.id) : undefined}
              className="absolute overflow-hidden border border-white/40 text-left"
              style={{ left: p.x, top: p.y, width: p.w, height: p.h, backgroundColor: color }}
            >
              {showLabel && (
                <span className="block p-2 text-[13px] font-medium leading-tight text-white">
                  {cell.name}
                  <span className="block font-normal text-white/80">
                    {cell.tickets.toLocaleString('en-US')} ({cell.ticketsPct})
                  </span>
                </span>
              )}
            </button>
          )
        })}

        {/* Hover tooltip, anchored top-left of the canvas (clamped by overflow-hidden). */}
        {hovered && (
          <div className="absolute left-3 top-3 z-10">
            <TreemapTooltip data={tooltipData(hovered)} />
          </div>
        )}
      </div>
    </section>
  )
}
```

Note on `ticketsPct` for top-level rows: `TopicRow` already has `ticketsPct` (e.g. `'40.89%'`), so `cell.ticketsPct` is valid for both `TopicRow` and `TopicSub`.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run src/features/insights/cx-journey/topics/TopicTreemap.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/insights/cx-journey/topics/TopicTreemap.tsx src/features/insights/cx-journey/topics/TopicTreemap.test.tsx
git commit -m "feat(topics): add treemap view with hover tooltip and drill-down"
```

---

### Task 5: Wire the treemap toggle into TopicsTable

**Files:**
- Modify: `src/features/insights/cx-journey/topics/TopicsTable.tsx`
- Test: `src/features/insights/cx-journey/topics/TopicsTable.test.tsx` (create)

**Interfaces:**
- Consumes: `TopicTreemap` from `./TopicTreemap`.
- Produces: no new exports. `TopicsTable` gains a `view: 'table' | 'treemap'` state; `Toolbar` gains props `{ view: 'table' | 'treemap'; onToggleTreemap: () => void }`.

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TopicsTable } from './TopicsTable'

describe('TopicsTable view toggle', () => {
  it('shows the table view by default', () => {
    render(<TopicsTable />)
    expect(screen.queryByTestId('topics-treemap')).not.toBeInTheDocument()
    expect(screen.getByText('Account Management')).toBeInTheDocument()
  })

  it('switches to the treemap view when the treemap toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<TopicsTable />)
    const toggle = screen.getByRole('button', { name: 'Treemap view' })
    await user.click(toggle)
    expect(screen.getByTestId('topics-treemap')).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches back to the table view on a second click', async () => {
    const user = userEvent.setup()
    render(<TopicsTable />)
    const toggle = screen.getByRole('button', { name: 'Treemap view' })
    await user.click(toggle)
    await user.click(toggle)
    expect(screen.queryByTestId('topics-treemap')).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/insights/cx-journey/topics/TopicsTable.test.tsx`
Expected: FAIL — no button named "Treemap view".

- [ ] **Step 3: Add the toggle + view state**

In `TopicsTable.tsx`:

1. Add the import (top of file, with other imports) and a `LayoutGrid` icon from lucide-react:

```tsx
import { LayoutGrid } from 'lucide-react'
import { TopicTreemap } from './TopicTreemap'
```

(Add `LayoutGrid` to the existing `lucide-react` import list rather than a second import statement.)

2. Change `Toolbar` to accept props and render the dedicated toggle. Add this button inside the `ml-auto` action cluster, before the Export button:

```tsx
function Toolbar({ view, onToggleTreemap }: { view: 'table' | 'treemap'; onToggleTreemap: () => void }) {
  // ...existing markup unchanged, then inside the ml-auto action group:
  // <button
  //   type="button"
  //   aria-label="Treemap view"
  //   aria-pressed={view === 'treemap'}
  //   onClick={onToggleTreemap}
  //   className={`rounded-lg border p-1.5 ${view === 'treemap' ? 'border-nav-active bg-nav-active text-white' : 'border-surface-border bg-white text-ink-muted'}`}
  // >
  //   <LayoutGrid className="h-3.5 w-3.5" />
  // </button>
}
```

Show the actual edit: replace the `Toolbar` signature line and insert the button as the first child of the `ml-auto` `<div>`:

```tsx
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Treemap view"
          aria-pressed={view === 'treemap'}
          onClick={onToggleTreemap}
          className={`rounded-lg border p-1.5 ${view === 'treemap' ? 'border-nav-active bg-nav-active text-white' : 'border-surface-border bg-white text-ink-muted'}`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Export">
          <Download className="h-3.5 w-3.5 text-ink-muted" />
        </button>
        {/* ...existing List + Settings buttons unchanged */}
      </div>
```

3. Update `TopicsTable` to own `view` and branch the body:

```tsx
export function TopicsTable() {
  const [view, setView] = useState<'table' | 'treemap'>('table')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['payment']))
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  return (
    <section className="flex flex-col gap-4">
      <Toolbar view={view} onToggleTreemap={() => setView((v) => (v === 'treemap' ? 'table' : 'treemap'))} />
      {view === 'treemap' ? (
        <TopicTreemap />
      ) : (
        <>
          {/* Column header strip (sits above the row cards). */}
          <div className="flex items-center gap-4 px-5">
            <SortHeader label={`Topic (${TOPIC_ROWS.length})`} className="flex-1" />
            <SortHeader label="Tickets" />
            <SortHeader label="First contact resolution" />
            <SortHeader label="Sentiment" />
            <span className="w-4" />
          </div>
          <div className="flex flex-col gap-2.5">
            {TOPIC_ROWS.map((row) => (
              <TopicCard key={row.id} row={row} open={expanded.has(row.id)} onToggle={() => toggle(row.id)} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run the new tests to verify pass**

Run: `npx vitest run src/features/insights/cx-journey/topics/TopicsTable.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the existing TopicsView tests (guard against regressions)**

Run: `npx vitest run src/features/insights/cx-journey/topics/TopicsView.test.tsx`
Expected: PASS (4 tests) — table view is the default, so existing assertions still hold.

- [ ] **Step 6: Commit**

```bash
git add src/features/insights/cx-journey/topics/TopicsTable.tsx src/features/insights/cx-journey/topics/TopicsTable.test.tsx
git commit -m "feat(topics): add treemap toggle to topics toolbar"
```

---

### Task 6: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all suites pass (baseline was 47 files / 211 tests; this adds ~4 files and ~19 tests, so expect ~51 files / ~230 tests, 0 failures).

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: build succeeds, no type errors.

- [ ] **Step 4: Manual smoke (optional, if dev server available)**

Run: `npx vite` then open `/insights/cx-journey`, switch to the Topics tab, click the treemap toggle. Verify: cells render sized by volume, hover shows the tooltip, clicking a cell drills in, breadcrumb "All topics" returns.

- [ ] **Step 5: Commit any final touch-ups** (only if Step 1–3 required fixes)

```bash
git add -A
git commit -m "chore(topics): verification fixes for treemap view"
```

---

## Self-Review

**Spec coverage:**
- Dedicated treemap toggle (existing icons untouched) → Task 5. ✓
- Squarified computed layout, unit-tested → Task 1. ✓
- Hover tooltip with 7 metrics → Tasks 3 + 4. ✓
- Click-to-drill-down + breadcrumb → Task 4. ✓
- Extended mock data (metrics + colors) → Task 2. ✓
- Table view unchanged; grid/network icons remain inert → Task 5 (only additive toggle). ✓
- Non-goals (no backend, no animation, no top-movers treemap) → respected. ✓
- Verification gates (typecheck/test/build) → Task 6. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; no "add error handling" hand-waving.

**Type consistency:** `TreemapItem`/`PlacedCell`/`squarify` defined in Task 1 and consumed with matching signatures in Task 4. `TreemapTooltipData` defined in Task 3, built by `tooltipData()` in Task 4 with matching fields. `TopicRow`/`TopicLeaf` field additions in Task 2 are read in Tasks 3–4. `view: 'table' | 'treemap'` consistent across Task 5. Toggle `aria-label="Treemap view"` matches the tests. `data-testid="topics-treemap"` consistent between Task 4 component and Tasks 4/5 tests.
