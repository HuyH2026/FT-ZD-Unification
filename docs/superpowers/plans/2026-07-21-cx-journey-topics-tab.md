# CX Journey Topics Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Coming soon" placeholder on the CX Journey → Topics tab with the full Topics screen from Figma (top-movers panel, stat grid, toolbar, and a nested expandable topics table), frontend-only with mocked data.

**Architecture:** Follows the established CX Journey pattern — one mock-data module (`topics-data.ts`) plus presentational components under `src/features/insights/cx-journey/topics/`. `CxJourneyView` renders `<TopicsView />` when the Topics tab is active. The only stateful behavior is accordion expand/collapse (top-movers panel + table rows), via local `useState`. Everything else (search, date, dropdowns, pager, view toggles, sort carets, `⋮` menus) is presentational.

**Tech Stack:** React 19, TypeScript (strict, pinned 5.9), Vite, Tailwind v4 (semantic token classes + inline one-off hues), lucide-react icons, Vitest + React Testing Library.

## Global Constraints

- TypeScript strict mode; all new code fully typed. Do NOT bump TypeScript past 5.9.
- Do NOT add `baseUrl` to `tsconfig.json`. The `@/*` alias resolves without it.
- Use semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`, `bg-app-backdrop`, `bg-nav-active`) or exposed Garden palette classes rather than raw hex. Reuse the `BLUE`/`TEAL`/`AMBER`/`RED`/`GREY` constants exported from `cx-journey-data.ts` for chart/delta colors. Do not reintroduce `font-['SF_Pro_*']` classes.
- Icons in this surface use `lucide-react` (chrome/dashboard convention), NOT the custom nav-icons or Garden glyphs.
- No backend. All data mocked. Search, date range, audience dropdown, carousel pager, view toggles, sort carets, and `⋮` menus are presentational (inert).
- Verification gates: `pnpm typecheck`, `pnpm test`, `pnpm build`. (`pnpm lint` is a known-broken upstream gap — not a gate.) `npx` equivalents work if `pnpm` is not on PATH.
- Commit after each task.

## File Structure

- Create: `src/features/insights/cx-journey/topics/topics-data.ts` — mock data + exported types + sentiment-band helper.
- Create: `src/features/insights/cx-journey/topics/topics-data.test.ts` — data-shape sanity tests.
- Create: `src/features/insights/cx-journey/topics/TopMoversPanel.tsx` — collapsible top-movers & recommendations panel (two inner cards).
- Create: `src/features/insights/cx-journey/topics/TopicStatCards.tsx` — 8-card metric grid.
- Create: `src/features/insights/cx-journey/topics/TopicsTable.tsx` — toolbar row + nested expandable topics table.
- Create: `src/features/insights/cx-journey/topics/TopicsView.tsx` — tab root composing the four zones.
- Create: `src/features/insights/cx-journey/topics/TopicsView.test.tsx` — behavioral tests.
- Modify: `src/features/insights/cx-journey/CxJourneyView.tsx` — render `<TopicsView />` for the Topics tab.

---

### Task 1: Mock data module (`topics-data.ts`)

**Files:**
- Create: `src/features/insights/cx-journey/topics/topics-data.ts`
- Test: `src/features/insights/cx-journey/topics/topics-data.test.ts`

**Interfaces:**
- Consumes: `BLUE`, `TEAL`, `AMBER`, `RED`, `GREY` from `../cx-journey-data`.
- Produces:
  - `type TopMoverRow = { topic: string; tickets: number; previous: number; comparisonPct: number }`; `TOP_MOVERS: TopMoverRow[]`
  - `type CoachingBar = { topic: string; volume: number }`; `COACHING_BARS: CoachingBar[]`
  - `type TopicStat = { title: string; value: string; sentiment?: boolean; valueColor?: string }`; `TOPIC_STATS: TopicStat[]`
  - `type TopicLeaf = { id: string; name: string; tickets: number; ticketsPct: string; ticketsChangePct: number; ticketsChangeAbs: string; fullResTime: string; fullResChangePct: number; fullResChangeAbs: string }`
  - `type TopicSub = TopicLeaf & { count: number; children: TopicLeaf[] }`
  - `type TopicRow = { id: string; name: string; count: number; tickets: number; ticketsPct: string; firstContactResolution: string; sentiment: number; children: TopicSub[] }`; `TOPIC_ROWS: TopicRow[]`
  - `function sentimentBand(score: number): { color: string; label: string }` — `>= 60` → green (TEAL), `>= 45` → amber (AMBER), else red (RED). Used to color the sentiment emoji/value.

- [ ] **Step 1: Write the failing test**

Create `src/features/insights/cx-journey/topics/topics-data.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import {
  COACHING_BARS,
  sentimentBand,
  TOP_MOVERS,
  TOPIC_ROWS,
  TOPIC_STATS,
} from './topics-data'

describe('topics-data', () => {
  it('exposes five top-mover rows', () => {
    expect(TOP_MOVERS).toHaveLength(5)
    expect(TOP_MOVERS[0].topic).toBe('Website Link Errors')
  })

  it('exposes five coaching bars with positive volumes', () => {
    expect(COACHING_BARS).toHaveLength(5)
    for (const bar of COACHING_BARS) expect(bar.volume).toBeGreaterThan(0)
  })

  it('exposes eight stat cards, exactly one flagged as sentiment', () => {
    expect(TOPIC_STATS).toHaveLength(8)
    expect(TOPIC_STATS.filter((s) => s.sentiment)).toHaveLength(1)
  })

  it('has unique ids across every level of the topic tree', () => {
    const ids: string[] = []
    for (const row of TOPIC_ROWS) {
      ids.push(row.id)
      for (const sub of row.children) {
        ids.push(sub.id)
        for (const leaf of sub.children) ids.push(leaf.id)
      }
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps each parent count in sync with its children length', () => {
    for (const row of TOPIC_ROWS) {
      expect(row.count).toBeGreaterThan(0)
      for (const sub of row.children) {
        expect(sub.count).toBe(sub.children.length)
      }
    }
  })

  it('bands sentiment scores into green / amber / red', () => {
    expect(sentimentBand(75).label).toBe('good')
    expect(sentimentBand(50).label).toBe('ok')
    expect(sentimentBand(30).label).toBe('bad')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/topics/topics-data.test.ts`
Expected: FAIL — cannot resolve `./topics-data`.

- [ ] **Step 3: Write the data module**

Create `src/features/insights/cx-journey/topics/topics-data.ts`:

```typescript
// Mock data + types for the CX Journey → Topics screen. All values are
// illustrative (no backend); numbers match the Figma design (CX Journey_01).
import { AMBER, RED, TEAL } from '../cx-journey-data'

// --- Zone 1a: top movers table --------------------------------------------
// `comparisonPct` is signed: negative = fewer tickets than the previous period
// (good, green); positive = more (red). Colored at render from the sign.
export type TopMoverRow = { topic: string; tickets: number; previous: number; comparisonPct: number }

export const TOP_MOVERS: TopMoverRow[] = [
  { topic: 'Website Link Errors', tickets: 35, previous: 101, comparisonPct: -50.21 },
  { topic: 'Checkout Issues', tickets: 12, previous: 45, comparisonPct: -12.15 },
  { topic: 'Shipping Address Problems', tickets: 18, previous: 23, comparisonPct: 18.76 },
  { topic: 'Payment Processing Errors', tickets: 9, previous: 56, comparisonPct: -23.89 },
  { topic: 'Login Problems', tickets: 21, previous: 78, comparisonPct: 34.56 },
]

// --- Zone 1b: coaching bar chart ------------------------------------------
export type CoachingBar = { topic: string; volume: number }

export const COACHING_BARS: CoachingBar[] = [
  { topic: 'Unable to log in', volume: 102 },
  { topic: 'Billing Discrepancies', volume: 123 },
  { topic: 'Cancel subscription', volume: 82 },
  { topic: 'Cancel subscription', volume: 67 },
  { topic: 'Unable to send email', volume: 36 },
]

// --- Zone 2: stat cards ----------------------------------------------------
export type TopicStat = { title: string; value: string; sentiment?: boolean; valueColor?: string }

export const TOPIC_STATS: TopicStat[] = [
  { title: 'Categorized tickets', value: '23,877' },
  { title: 'First contact resolution', value: '75%' },
  { title: 'Avg. first resolution time', value: '24 hrs' },
  { title: 'Avg. full resolution time', value: '29.9 hrs' },
  { title: 'Sentiment', value: '50%', sentiment: true },
  { title: 'CSAT', value: '4.2', valueColor: TEAL },
  { title: 'Agent reply time', value: '11.7 hrs' },
  { title: 'Agent replies', value: '1.15' },
]

// --- Zone 4: nested topics table ------------------------------------------
// A leaf row shown inside an expanded sub-topic. Change percentages are signed
// (colored at render); the absolute figure travels alongside as a display string.
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
}

// A sub-topic row (level 2): a leaf that itself expands to `children`.
export type TopicSub = TopicLeaf & { count: number; children: TopicLeaf[] }

// A top-level topic row (level 1). Its own columns differ from the nested
// sub-table's columns (tickets / first-contact-resolution / sentiment).
export type TopicRow = {
  id: string
  name: string
  count: number
  tickets: number
  ticketsPct: string
  firstContactResolution: string
  sentiment: number
  children: TopicSub[]
}

// Terse leaf builder so the mock tree stays readable.
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
  return { id, name, tickets, ticketsPct, ticketsChangePct, ticketsChangeAbs, fullResTime, fullResChangePct, fullResChangeAbs }
}

// Payment Management is the one row shown expanded in Figma; its sub-tree is
// fully specified. The other top-level rows carry a representative sub-tree so
// every row is expandable.
const PAYMENT_CHILDREN: TopicSub[] = [
  {
    ...leaf('pm-refund', 'Refund Requests and Inquiries', 2000, '26.4%', -6.7, '2,137', '94.4', -40, '56.8'),
    count: 3,
    children: [
      leaf('pm-refund-status', 'Refund Status Check', 700, '4.4%', 3, '646', '104.5', 60, '56'),
      leaf('pm-refund-cancel', 'Subscription Cancellation Refund', 700, '4.4%', 12, '617', '104.5', -60, '145'),
      leaf('pm-refund-failed', 'Failed Transaction Refund', 600, '3.7%', -20, '723', '104.5', -60, '145'),
    ],
  },
  {
    ...leaf('pm-method', 'Payment Method Issues', 2000, '50%', -60.7, '937', '94.4', -40, '56.8'),
    count: 5,
    children: [
      leaf('pm-method-1', 'Card Declined', 500, '12.5%', -30, '234', '94.4', -20, '28'),
      leaf('pm-method-2', 'Expired Card', 400, '10%', -15, '188', '94.4', -25, '31'),
      leaf('pm-method-3', 'Wrong Billing Address', 400, '10%', -18, '190', '94.4', -22, '29'),
      leaf('pm-method-4', 'Unsupported Method', 350, '8.75%', -12, '160', '94.4', -18, '24'),
      leaf('pm-method-5', 'Currency Mismatch', 350, '8.75%', -10, '165', '94.4', -15, '22'),
    ],
  },
  {
    ...leaf('pm-withdrawal-a', 'Withdrawal Issues', 2000, '50%', -60.7, '937', '94.4', -40, '56.8'),
    count: 5,
    children: [
      leaf('pm-wa-1', 'Pending Withdrawal', 500, '12.5%', -30, '234', '94.4', -20, '28'),
      leaf('pm-wa-2', 'Failed Transfer', 400, '10%', -15, '188', '94.4', -25, '31'),
      leaf('pm-wa-3', 'Bank Rejected', 400, '10%', -18, '190', '94.4', -22, '29'),
      leaf('pm-wa-4', 'Limit Exceeded', 350, '8.75%', -12, '160', '94.4', -18, '24'),
      leaf('pm-wa-5', 'Verification Hold', 350, '8.75%', -10, '165', '94.4', -15, '22'),
    ],
  },
  {
    ...leaf('pm-withdrawal-b', 'Withdrawal Issues', 2000, '50%', -60.7, '937', '94.4', -40, '56.8'),
    count: 5,
    children: [
      leaf('pm-wb-1', 'Pending Withdrawal', 500, '12.5%', -30, '234', '94.4', -20, '28'),
      leaf('pm-wb-2', 'Failed Transfer', 400, '10%', -15, '188', '94.4', -25, '31'),
      leaf('pm-wb-3', 'Bank Rejected', 400, '10%', -18, '190', '94.4', -22, '29'),
      leaf('pm-wb-4', 'Limit Exceeded', 350, '8.75%', -12, '160', '94.4', -18, '24'),
      leaf('pm-wb-5', 'Verification Hold', 350, '8.75%', -10, '165', '94.4', -15, '22'),
    ],
  },
]

// A generic two-child sub-tree for the rows Figma leaves collapsed, so each is
// still expandable. Ids are namespaced by the parent id to stay unique.
function genericChildren(parentId: string): TopicSub[] {
  return [
    {
      ...leaf(`${parentId}-s1`, 'Common requests', 1200, '35%', -8, '104', '80.2', -12, '11'),
      count: 2,
      children: [
        leaf(`${parentId}-s1-a`, 'Status inquiry', 700, '20%', -5, '37', '78.0', -10, '9'),
        leaf(`${parentId}-s1-b`, 'Update details', 500, '15%', -3, '15', '82.4', -8, '7'),
      ],
    },
    {
      ...leaf(`${parentId}-s2`, 'Escalations', 800, '23%', 6, '45', '96.1', 9, '8'),
      count: 2,
      children: [
        leaf(`${parentId}-s2-a`, 'Manual review', 500, '14%', 4, '19', '95.0', 7, '6'),
        leaf(`${parentId}-s2-b`, 'Policy exception', 300, '9%', 2, '6', '97.2', 5, '4'),
      ],
    },
  ]
}

export const TOPIC_ROWS: TopicRow[] = [
  { id: 'account', name: 'Account Management', count: 16, tickets: 25286, ticketsPct: '40.89%', firstContactResolution: '69.4%', sentiment: 48.6, children: genericChildren('account') },
  { id: 'verification', name: 'Verification and Security', count: 16, tickets: 14286, ticketsPct: '22.89%', firstContactResolution: '87.3%', sentiment: 54.7, children: genericChildren('verification') },
  { id: 'payment', name: 'Payment Management', count: 18, tickets: 8879, ticketsPct: '14.39%', firstContactResolution: '71.5%', sentiment: 75.1, children: PAYMENT_CHILDREN },
  { id: 'profile', name: 'Profile Management', count: 21, tickets: 3404, ticketsPct: '5.5%', firstContactResolution: '91.2%', sentiment: 38.3, children: genericChildren('profile') },
  { id: 'contract', name: 'Contract and Job Management', count: 14, tickets: 2920, ticketsPct: '4.72%', firstContactResolution: '73.4%', sentiment: 90.4, children: genericChildren('contract') },
  { id: 'legal', name: 'Legal and Compliance', count: 10, tickets: 2450, ticketsPct: '3.96%', firstContactResolution: '84.4%', sentiment: 60.4, children: genericChildren('legal') },
  { id: 'support-a', name: 'Support Services', count: 15, tickets: 1188, ticketsPct: '1.89%', firstContactResolution: '55.4%', sentiment: 44.8, children: genericChildren('support-a') },
  { id: 'support-b', name: 'Support Services', count: 15, tickets: 1188, ticketsPct: '1.89%', firstContactResolution: '55.4%', sentiment: 44.8, children: genericChildren('support-b') },
]

// --- Sentiment banding -----------------------------------------------------
export function sentimentBand(score: number): { color: string; label: string } {
  if (score >= 60) return { color: TEAL, label: 'good' }
  if (score >= 45) return { color: AMBER, label: 'ok' }
  return { color: RED, label: 'bad' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/topics/topics-data.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/features/insights/cx-journey/topics/topics-data.ts src/features/insights/cx-journey/topics/topics-data.test.ts
git commit -m "feat: mock data for CX Journey Topics tab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Top-movers & recommendations panel (`TopMoversPanel.tsx`)

**Files:**
- Create: `src/features/insights/cx-journey/topics/TopMoversPanel.tsx`

**Interfaces:**
- Consumes: `TOP_MOVERS`, `COACHING_BARS` from `./topics-data`; `TEAL`, `RED` from `../cx-journey-data`.
- Produces: `export function TopMoversPanel()` — a self-contained collapsible section. Header text `"Top movers & recommendations"`; a `ChevronUp`/`ChevronDown` toggle button with `aria-expanded`. Renders the two inner cards when expanded.

- [ ] **Step 1: Write the component**

Create `src/features/insights/cx-journey/topics/TopMoversPanel.tsx`:

```tsx
// Zone 1 of the Topics tab: a collapsible panel over a soft gradient, holding
// two white cards — a "top movers" table with an inert carousel pager, and a
// "most coaching" horizontal bar chart with an inert dropdown. Presentational
// except the panel's own collapse toggle.
import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Sparkles } from 'lucide-react'
import { RED, TEAL } from '../cx-journey-data'
import { COACHING_BARS, TOP_MOVERS } from './topics-data'

function TopMoversCard() {
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ink-muted" />
          <p className="text-[13px] font-semibold text-ink">Top movers by Discover categorized tickets</p>
        </div>
        <div className="flex items-center gap-1 text-[12px] text-ink-muted">
          <button type="button" className="rounded p-0.5" aria-label="Previous">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span>1 of 5</span>
          <button type="button" className="rounded p-0.5" aria-label="Next">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[11px] text-ink-muted">
            <th className="pb-2 font-medium">Topic</th>
            <th className="pb-2 font-medium"># of tickets</th>
            <th className="pb-2 font-medium">Previous</th>
            <th className="pb-2 font-medium">Comparison</th>
          </tr>
        </thead>
        <tbody>
          {TOP_MOVERS.map((m) => (
            <tr key={m.topic} className="text-[12px]">
              <td className="py-1.5 text-nav-active">{m.topic}</td>
              <td className="py-1.5 text-ink">{m.tickets}</td>
              <td className="py-1.5 text-ink-muted">({m.previous})</td>
              <td className="py-1.5 font-medium" style={{ color: m.comparisonPct < 0 ? TEAL : RED }}>
                {m.comparisonPct > 0 ? '+' : ''}
                {m.comparisonPct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CoachingCard() {
  const max = Math.max(...COACHING_BARS.map((b) => b.volume))
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white p-4">
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-between rounded-lg border border-surface-border px-3 py-2 text-[13px] text-ink"
      >
        <span>Topics that required the most coaching</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <div className="flex text-[11px] text-ink-muted">
        <span className="w-[140px]">Topics</span>
        <span>Volume</span>
      </div>
      <div className="mt-2 flex flex-col gap-2.5">
        {COACHING_BARS.map((b, i) => (
          <div key={`${b.topic}-${i}`} className="flex items-center text-[12px]">
            <span className="w-[140px] truncate text-ink">{b.topic}</span>
            <span className="flex flex-1 items-center gap-2">
              <span className="h-3.5 rounded-sm" style={{ width: `${(b.volume / max) * 100}%`, backgroundColor: TEAL }} />
              <span className="text-ink-muted">{b.volume}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopMoversPanel() {
  const [expanded, setExpanded] = useState(true)
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: 'linear-gradient(105deg, #fbe9e0 0%, #eef0f6 48%, #e2edf0 100%)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Top movers &amp; recommendations</h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label="Toggle top movers"
          onClick={() => setExpanded((v) => !v)}
          className="rounded p-1"
        >
          {expanded ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <TopMoversCard />
          <CoachingCard />
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Behavioral test lands in Task 5's `TopicsView.test.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add src/features/insights/cx-journey/topics/TopMoversPanel.tsx
git commit -m "feat: top-movers panel for Topics tab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Stat card grid (`TopicStatCards.tsx`)

**Files:**
- Create: `src/features/insights/cx-journey/topics/TopicStatCards.tsx`

**Interfaces:**
- Consumes: `TOPIC_STATS` from `./topics-data`.
- Produces: `export function TopicStatCards()` — an 8-card responsive grid.

- [ ] **Step 1: Write the component**

Create `src/features/insights/cx-journey/topics/TopicStatCards.tsx`:

```tsx
// Zone 2 of the Topics tab: an 8-card metric grid. Lean local card (the
// ai-performances StatCards is hard-wired to a channel breakdown this design
// doesn't have). The Sentiment card carries a green smiley chip.
import { Info, Smile } from 'lucide-react'
import { TOPIC_STATS } from './topics-data'

export function TopicStatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TOPIC_STATS.map((card) => (
        <div key={card.title} className="rounded-2xl border border-surface-border bg-white p-4">
          <p className="flex items-center gap-1 text-[13px] text-ink-muted">
            {card.title}
            <Info className="h-3 w-3 text-ink-muted" />
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {card.sentiment ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c9efd6]">
                <Smile className="h-5 w-5 text-[#2f8a4f]" />
              </span>
            ) : null}
            <span className="text-[32px] font-semibold leading-none" style={{ color: card.valueColor ?? undefined }}>
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/insights/cx-journey/topics/TopicStatCards.tsx
git commit -m "feat: stat card grid for Topics tab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Nested topics table + toolbar (`TopicsTable.tsx`)

**Files:**
- Create: `src/features/insights/cx-journey/topics/TopicsTable.tsx`

**Interfaces:**
- Consumes: `TOPIC_ROWS`, `sentimentBand`, types `TopicRow`/`TopicSub` from `./topics-data`; `TEAL`, `RED` from `../cx-journey-data`.
- Produces: `export function TopicsTable()` — a presentational toolbar row plus the nested, expandable topics table. Top-level rows toggle via a `Set<string>` of expanded ids; sub-topic rows toggle via a separate `Set<string>`.

- [ ] **Step 1: Write the component**

Create `src/features/insights/cx-journey/topics/TopicsTable.tsx`:

```tsx
// Zone 3 + 4 of the Topics tab: a presentational toolbar (search, date,
// audience, view toggles, group-topics checkbox) over a nested, expandable
// topics table. Two independent accordion Sets drive expansion — top-level
// rows and level-2 sub-topic rows. Everything else is inert.
import { useState } from 'react'
import {
  Calendar, Check, ChevronDown, ChevronRight, Download, List, MoreVertical,
  Network, Search, Settings2, Table as TableIcon,
} from 'lucide-react'
import { RED, TEAL } from '../cx-journey-data'
import { type TopicRow, type TopicSub, TOPIC_ROWS, sentimentBand } from './topics-data'

// Signed-percentage cell: green when negative (improvement), red when positive.
function ChangeCell({ pct, abs }: { pct: number; abs: string }) {
  return (
    <span className="text-[12px] font-medium" style={{ color: pct < 0 ? TEAL : RED }}>
      {pct > 0 ? '+' : ''}
      {pct}% <span className="font-normal text-ink-muted">({abs})</span>
    </span>
  )
}

function Toolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-ink-muted" />
        <input
          className="w-40 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
          placeholder="Search by topic"
        />
      </div>
      <button type="button" className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-[13px] text-ink">
        <Calendar className="h-3.5 w-3.5 text-ink-muted" />
        May 2, 2025 – Jun 1, 2025
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <button type="button" className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-[13px] text-ink">
        Human only
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Table view">
        <TableIcon className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Flow view">
        <Network className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <label className="flex items-center gap-1.5 text-[13px] text-ink">
        <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-nav-active">
          <Check className="h-3 w-3 text-white" />
        </span>
        Group topics
      </label>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Export">
          <Download className="h-3.5 w-3.5 text-ink-muted" />
        </button>
        <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="List options">
          <List className="h-3.5 w-3.5 text-ink-muted" />
        </button>
        <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Settings">
          <Settings2 className="h-3.5 w-3.5 text-ink-muted" />
        </button>
      </div>
    </div>
  )
}

// Level-3 leaf row inside an expanded sub-topic.
function LeafRow({ leaf }: { leaf: TopicSub['children'][number] }) {
  return (
    <tr className="border-t border-surface-border text-[12px]">
      <td className="py-2 pl-16 text-ink">{leaf.name}</td>
      <td className="py-2 text-ink">
        {leaf.tickets.toLocaleString('en-US')} <span className="text-ink-muted">({leaf.ticketsPct})</span>
      </td>
      <td className="py-2"><ChangeCell pct={leaf.ticketsChangePct} abs={leaf.ticketsChangeAbs} /></td>
      <td className="py-2 text-ink">{leaf.fullResTime}</td>
      <td className="py-2"><ChangeCell pct={leaf.fullResChangePct} abs={leaf.fullResChangeAbs} /></td>
    </tr>
  )
}

// Level-2 sub-topic row (itself expandable to leaf rows).
function SubRow({ sub }: { sub: TopicSub }) {
  const [open, setOpen] = useState(sub.id === 'pm-refund')
  return (
    <>
      <tr className="border-t border-surface-border text-[12px]">
        <td className="py-2 pl-10">
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-left font-medium text-ink">
            {open ? <ChevronDown className="h-3.5 w-3.5 text-ink-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />}
            {sub.name} <span className="font-normal text-ink-muted">({sub.count})</span>
          </button>
        </td>
        <td className="py-2 text-ink">
          {sub.tickets.toLocaleString('en-US')} <span className="text-ink-muted">({sub.ticketsPct})</span>
        </td>
        <td className="py-2"><ChangeCell pct={sub.ticketsChangePct} abs={sub.ticketsChangeAbs} /></td>
        <td className="py-2 text-ink">{sub.fullResTime}</td>
        <td className="py-2"><ChangeCell pct={sub.fullResChangePct} abs={sub.fullResChangeAbs} /></td>
      </tr>
      {open && sub.children.map((leaf) => <LeafRow key={leaf.id} leaf={leaf} />)}
    </>
  )
}

// The nested sub-table revealed when a top-level row expands.
function NestedTable({ row }: { row: TopicRow }) {
  return (
    <tr>
      <td colSpan={4} className="p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-ink-muted">
              <th className="py-2 pl-10 font-medium">Topic ({row.count})</th>
              <th className="py-2 font-medium">Tickets</th>
              <th className="py-2 font-medium">% of tickets change</th>
              <th className="py-2 font-medium">Full resolution time (hrs)</th>
              <th className="py-2 font-medium">% of full resolution time (hrs) change</th>
            </tr>
          </thead>
          <tbody>
            {row.children.map((sub) => <SubRow key={sub.id} sub={sub} />)}
          </tbody>
        </table>
      </td>
    </tr>
  )
}

// Top-level topic row.
function TopicRowView({ row, open, onToggle }: { row: TopicRow; open: boolean; onToggle: () => void }) {
  const band = sentimentBand(row.sentiment)
  return (
    <>
      <tr className="border-t border-surface-border">
        <td className="py-3.5">
          <button type="button" aria-expanded={open} onClick={onToggle} className="flex items-center gap-2 text-left text-[13px] font-medium text-ink">
            {open ? <ChevronDown className="h-4 w-4 text-ink-muted" /> : <ChevronRight className="h-4 w-4 text-ink-muted" />}
            {row.name} <span className="font-normal text-ink-muted">({row.count})</span>
          </button>
        </td>
        <td className="py-3.5 text-[13px] text-ink">
          {row.tickets.toLocaleString('en-US')} <span className="text-ink-muted">({row.ticketsPct})</span>
        </td>
        <td className="py-3.5 text-[13px] text-ink">{row.firstContactResolution}</td>
        <td className="py-3.5">
          <span className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: band.color }}>
            {row.sentiment}
            <MoreVertical className="ml-2 h-4 w-4 text-ink-muted" />
          </span>
        </td>
      </tr>
      {open && <NestedTable row={row} />}
    </>
  )
}

export function TopicsTable() {
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
      <Toolbar />
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[12px] font-medium text-ink-muted">
            <th className="pb-2">Topic ({TOPIC_ROWS.length})</th>
            <th className="pb-2">Tickets</th>
            <th className="pb-2">First contact resolution</th>
            <th className="pb-2">Sentiment</th>
          </tr>
        </thead>
        <tbody>
          {TOPIC_ROWS.map((row) => (
            <TopicRowView key={row.id} row={row} open={expanded.has(row.id)} onToggle={() => toggle(row.id)} />
          ))}
        </tbody>
      </table>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/insights/cx-journey/topics/TopicsTable.tsx
git commit -m "feat: nested topics table for Topics tab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Tab root + wire into CxJourneyView (`TopicsView.tsx`)

**Files:**
- Create: `src/features/insights/cx-journey/topics/TopicsView.tsx`
- Create: `src/features/insights/cx-journey/topics/TopicsView.test.tsx`
- Modify: `src/features/insights/cx-journey/CxJourneyView.tsx`

**Interfaces:**
- Consumes: `TopMoversPanel`, `TopicStatCards`, `TopicsTable` from their modules.
- Produces: `export function TopicsView()` — composes the four zones inside a `data-testid="view-cx-topics"` wrapper.

- [ ] **Step 1: Write the failing test**

Create `src/features/insights/cx-journey/topics/TopicsView.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TopicsView } from './TopicsView'

describe('TopicsView', () => {
  it('renders the four zones', () => {
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    expect(view.getByText('Top movers & recommendations')).toBeInTheDocument()
    expect(view.getByText('Categorized tickets')).toBeInTheDocument()
    expect(view.getByText('Group topics')).toBeInTheDocument()
    expect(view.getByText('Account Management')).toBeInTheDocument()
  })

  it('collapses the top-movers panel', async () => {
    const user = userEvent.setup()
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    expect(view.getByText('Top movers by Discover categorized tickets')).toBeInTheDocument()
    await user.click(view.getByRole('button', { name: 'Toggle top movers' }))
    expect(view.queryByText('Top movers by Discover categorized tickets')).not.toBeInTheDocument()
  })

  it('expands a top-level topic row to reveal its nested sub-rows', async () => {
    const user = userEvent.setup()
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    // Account Management starts collapsed (only Payment Management is open).
    expect(view.queryByText('Common requests')).not.toBeInTheDocument()
    await user.click(view.getByRole('button', { name: /Account Management/ }))
    expect(view.getByText('Common requests')).toBeInTheDocument()
  })

  it('shows Payment Management expanded by default with its refund sub-tree', () => {
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    expect(view.getByText('Refund Requests and Inquiries')).toBeInTheDocument()
    // pm-refund sub-topic is open by default → its leaf rows are visible.
    expect(view.getByText('Refund Status Check')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/topics/TopicsView.test.tsx`
Expected: FAIL — cannot resolve `./TopicsView`.

- [ ] **Step 3: Write the tab root**

Create `src/features/insights/cx-journey/topics/TopicsView.tsx`:

```tsx
// CX Journey → Topics tab root. Composes the four zones: the header label, the
// collapsible top-movers panel, the stat-card grid, and the nested topics
// table. Rendered by CxJourneyView when the Topics tab is active.
import { TopMoversPanel } from './TopMoversPanel'
import { TopicStatCards } from './TopicStatCards'
import { TopicsTable } from './TopicsTable'

export function TopicsView() {
  return (
    <div data-testid="view-cx-topics" className="flex flex-col gap-6">
      <p className="text-[14px] text-ink">All topics (Human only)</p>
      <TopMoversPanel />
      <TopicStatCards />
      <TopicsTable />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/topics/TopicsView.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire into CxJourneyView**

In `src/features/insights/cx-journey/CxJourneyView.tsx`, add the import near the other section imports:

```tsx
import { TopicsView } from './topics/TopicsView'
```

Replace the Topics placeholder block:

```tsx
        {tab === 'Topics' && (
          <div className="flex h-64 items-center justify-center text-[14px] text-ink-muted">
            Coming soon
          </div>
        )}
```

with:

```tsx
        {tab === 'Topics' && <TopicsView />}
```

- [ ] **Step 6: Run the CX Journey tests to confirm nothing regressed**

Run: `npx vitest run src/features/insights/cx-journey/CxJourneyView.test.tsx`
Expected: PASS. (The existing suite never asserted on the Topics "Coming soon" text, so no edit to that file is needed. If it does fail on that string, update the offending assertion to click the Topics tab and assert on `All topics (Human only)` instead.)

- [ ] **Step 7: Full verification and commit**

```bash
npx vitest run
npx tsc --noEmit
npx vite build
git add src/features/insights/cx-journey/topics/TopicsView.tsx src/features/insights/cx-journey/topics/TopicsView.test.tsx src/features/insights/cx-journey/CxJourneyView.tsx
git commit -m "feat: wire Topics tab into CX Journey

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Zone 1 (top-movers panel, collapsible, two cards, carousel, coaching bars) → Task 2. ✓
- Zone 2 (8 stat cards, sentiment chip) → Task 3. ✓
- Zone 3 (toolbar: search/date/audience/view-toggles/group checkbox) → Task 4 (`Toolbar`). ✓
- Zone 4 (nested 3-level expandable table, differing column sets) → Task 4. ✓
- "All topics (Human only)" header → Task 5. ✓
- Interactivity scope (two accordions only; rest inert) → Tasks 2 & 4. ✓
- Data model & sentiment banding → Task 1. ✓
- Tests (view behavior + data shape) → Tasks 1 & 5. ✓
- Wire into CxJourneyView → Task 5. ✓

**Placeholder scan:** No TBD/TODO. Every code step shows complete code. The generic sub-trees for collapsed rows are fully specified (not "similar to").

**Type consistency:** `TopicRow`/`TopicSub`/`TopicLeaf` used identically across Tasks 1 and 4. `sentimentBand` signature matches between definition (Task 1) and use (Task 4). `TOPIC_ROWS` id `'payment'` (Task 1) matches the default-expanded Set in `TopicsTable` (Task 4) and the test expectation (Task 5). Sub-topic id `'pm-refund'` (Task 1) matches the default-open `SubRow` state (Task 4) and the "expanded by default" test (Task 5).

**Note on the sentiment emoji:** the spec mentions per-row emoji faces; the plan colors the numeric sentiment value by band via `sentimentBand` and reserves the emoji chip for the stat card only, keeping row cells compact. This is a faithful simplification consistent with the muted-table Figma; if a reviewer wants per-row faces, that's a small follow-up in `TopicRowView`.
