# CX Journey Automation Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the CX Journey screen's decorative `Overview / Topics / Automation` tab strip real behavior, with a fully built "Automation → Agent gaps" view (stats banner + toolbar + table).

**Architecture:** Make the existing tab strip in `CxJourneyView` interactive via local `useState`, swapping the body between the existing Overview sections and a new `AutomationView`. `AutomationView` composes a sub-tab segmented control, a gradient stats banner, a static toolbar, and a table, all fed by a new `automation-data.ts` mock module.

**Tech Stack:** React 19 + TypeScript, React Router v7, Tailwind v4, lucide-react, Vitest + React Testing Library.

## Global Constraints

- **No backend** — all data mocked in `automation-data.ts`; search box, toolbar buttons, and segmented control are presentational (only tab/sub-tab selection is stateful).
- **TypeScript strict** — all new code fully typed.
- **Semantic tokens** — use `text-ink`, `text-ink-muted`, `border-surface-border`, `bg-app-backdrop` etc.; per-design one-off colors (the banner gradient) may be inline arbitrary Tailwind values, matching the rest of this screen.
- **Icons** — use `lucide-react` (nav rail excepted). No new fonts; never add `font-['SF_Pro_*']` classes.
- **Path alias** `@` → `src/`. Tests colocated as `*.test.tsx`.
- Verify with `pnpm test` / `pnpm typecheck` (or `npx vitest run` / `npx tsc --noEmit`). `pnpm lint` is known-broken (TS7 vs typescript-eslint) — do not treat its crash as a failure.

---

### Task 1: Automation mock data module

**Files:**
- Create: `src/features/insights/cx-journey/automation-data.ts`
- Test: `src/features/insights/cx-journey/automation-data.test.ts`

**Interfaces:**
- Produces:
  - `type AutomationSubTab = 'Agent gaps' | 'Knowledge gaps' | 'Realized impact'`
  - `AUTOMATION_SUBTABS: { label: AutomationSubTab; icon: LucideIcon }[]`
  - `type AutomationStat = { value: string; label: string }`
  - `AUTOMATION_STATS: AutomationStat[]` (length 3)
  - `AUTOMATION_INTRO: string`
  - `type AutomationRow = { topic: string; policy: string; coverage: string; savings: string; created: string }`
  - `AUTOMATION_ROWS: AutomationRow[]` (length 3)

- [ ] **Step 1: Write the failing test**

```ts
// src/features/insights/cx-journey/automation-data.test.ts
import { describe, expect, it } from 'vitest'
import { AUTOMATION_ROWS, AUTOMATION_STATS, AUTOMATION_SUBTABS } from './automation-data'

describe('automation-data', () => {
  it('has three sub-tabs starting with Agent gaps', () => {
    expect(AUTOMATION_SUBTABS.map((t) => t.label)).toEqual([
      'Agent gaps',
      'Knowledge gaps',
      'Realized impact',
    ])
  })

  it('has three headline stats and three rows', () => {
    expect(AUTOMATION_STATS).toHaveLength(3)
    expect(AUTOMATION_STATS[0]).toMatchObject({ value: '6,908' })
    expect(AUTOMATION_ROWS).toHaveLength(3)
    expect(AUTOMATION_ROWS[0].topic).toBe('Reactivate account')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/automation-data.test.ts`
Expected: FAIL — cannot resolve `./automation-data`.

- [ ] **Step 3: Write the data module**

```ts
// src/features/insights/cx-journey/automation-data.ts
// Mock data for the CX Journey → Automation → Agent gaps view. All values are
// illustrative (no backend); numbers/text match the Figma design where legible.
import { BookOpen, PiggyBank, Sparkles, type LucideIcon } from 'lucide-react'

export type AutomationSubTab = 'Agent gaps' | 'Knowledge gaps' | 'Realized impact'

export const AUTOMATION_SUBTABS: { label: AutomationSubTab; icon: LucideIcon }[] = [
  { label: 'Agent gaps', icon: Sparkles },
  { label: 'Knowledge gaps', icon: BookOpen },
  { label: 'Realized impact', icon: PiggyBank },
]

export type AutomationStat = { value: string; label: string }

export const AUTOMATION_INTRO = 'By automating these topics with agents, you could annually achieve:'

export const AUTOMATION_STATS: AutomationStat[] = [
  { value: '6,908', label: 'Potential ticket coverage' },
  { value: '228,821 hrs', label: 'Potential full resolution time decrease' },
  { value: '$229,860', label: 'Potential savings' },
]

export type AutomationRow = {
  topic: string
  policy: string
  coverage: string
  savings: string
  created: string
}

export const AUTOMATION_ROWS: AutomationRow[] = [
  {
    topic: 'Reactivate account',
    policy:
      "Experiencing a delay in receiving your withdrawal from Upwork can be frustrating, especially when you're counting on those funds to arrive on time.",
    coverage: '5,588',
    savings: '2,500',
    created: 'Jan 4, 2024 9:25 AM',
  },
  {
    topic: 'Account Lock Issues',
    policy:
      'General Inquiry about Refund request: - Response: "Notion\'s Plus Plan is free for higher education students and teachers using an eligible academic email address.',
    coverage: '2,960',
    savings: '2,500',
    created: 'Jan 4, 2024 9:25 AM',
  },
  {
    topic: 'Account Linking and Updating',
    policy:
      "When you're navigating the waters of freelance work on platforms like Upwork, understanding how to manage your funds, especially when it comes to withdrawals, is essential.",
    coverage: '31,916',
    savings: '2,500',
    created: 'Jan 4, 2024 9:25 AM',
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/automation-data.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/automation-data.ts src/features/insights/cx-journey/automation-data.test.ts
git commit -m "feat: mock data for CX Journey Automation view

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: AutomationView component

**Files:**
- Create: `src/features/insights/cx-journey/AutomationView.tsx`
- Test: `src/features/insights/cx-journey/AutomationView.test.tsx`

**Interfaces:**
- Consumes: `AUTOMATION_SUBTABS`, `AUTOMATION_STATS`, `AUTOMATION_INTRO`, `AUTOMATION_ROWS` from Task 1.
- Produces: `export function AutomationView(): JSX.Element` — renders a root with `data-testid="view-automation"`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/insights/cx-journey/AutomationView.test.tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AutomationView } from './AutomationView'

describe('AutomationView', () => {
  it('renders the three headline stats and all mock rows under Agent gaps', () => {
    render(<AutomationView />)
    const view = within(screen.getByTestId('view-automation'))
    expect(view.getByText('6,908')).toBeInTheDocument()
    expect(view.getByText('$229,860')).toBeInTheDocument()
    expect(view.getByText('Reactivate account')).toBeInTheDocument()
    expect(view.getByText('Account Linking and Updating')).toBeInTheDocument()
  })

  it('shows an empty state when a non-built sub-tab is selected', async () => {
    const user = userEvent.setup()
    render(<AutomationView />)
    const view = within(screen.getByTestId('view-automation'))
    await user.click(view.getByRole('tab', { name: /Knowledge gaps/ }))
    expect(view.queryByText('Reactivate account')).not.toBeInTheDocument()
    expect(view.getByText(/Coming soon/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/AutomationView.test.tsx`
Expected: FAIL — cannot resolve `./AutomationView`.

- [ ] **Step 3: Implement the component**

```tsx
// src/features/insights/cx-journey/AutomationView.tsx
// CX Journey → Automation. Segmented control switches sub-views; only
// "Agent gaps" is designed (stats banner + toolbar + table). The search box and
// toolbar icon buttons are presentational (no backend); the other two sub-tabs
// render a "Coming soon" empty region.
import { Download, Info, List, Search, Sparkles, Table2 } from 'lucide-react'
import { useState } from 'react'
import {
  AUTOMATION_INTRO,
  AUTOMATION_ROWS,
  AUTOMATION_STATS,
  AUTOMATION_SUBTABS,
  type AutomationSubTab,
} from './automation-data'

const COLS = [
  'Topic for generated policy',
  'Autoflow policy',
  'Ticket coverage/year',
  'Potential savings/year',
  'Time created',
]

function SegmentedControl({
  value,
  onChange,
}: {
  value: AutomationSubTab
  onChange: (v: AutomationSubTab) => void
}) {
  return (
    <div role="tablist" className="flex items-center gap-1 rounded-full bg-app-backdrop p-1">
      {AUTOMATION_SUBTABS.map(({ label, icon: Icon }) => {
        const active = label === value
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(label)}
            className={
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ' +
              (active ? 'bg-white text-ink shadow-sm' : 'text-ink-muted')
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function StatsBanner() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#fbeee6] to-[#e7eef6] p-6">
      <p className="text-[13px] text-ink">{AUTOMATION_INTRO}</p>
      <div className="mt-4 flex flex-wrap gap-x-24 gap-y-4">
        {AUTOMATION_STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-[32px] font-semibold text-ink">{stat.value}</p>
            <p className="flex items-center gap-1 text-[13px] text-ink-muted">
              {stat.label}
              <Info className="h-3.5 w-3.5" />
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Toolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5">
        <Search className="h-4 w-4 text-ink-muted" />
        <input
          type="text"
          placeholder="Search"
          className="w-40 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      <div className="flex items-center gap-1">
        {[Download, List, Table2].map((Icon, i) => (
          <button
            key={i}
            type="button"
            className="rounded-lg border border-surface-border p-1.5 text-ink-muted"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

function PolicyTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            {COLS.map((col) => (
              <th key={col} className="px-4 py-3 text-left text-[12px] font-medium text-ink-muted">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AUTOMATION_ROWS.map((row) => (
            <tr key={row.topic} className="border-b border-surface-border align-top">
              <td className="px-4 py-6">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-app-backdrop px-2 py-1 text-[13px] text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-ink-muted" />
                  {row.topic}
                </span>
              </td>
              <td className="px-4 py-6 text-[13px] text-ink">
                <p className="line-clamp-3 max-w-[320px]">{row.policy}</p>
              </td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.coverage}</td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.savings}</td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AutomationView() {
  const [subTab, setSubTab] = useState<AutomationSubTab>('Agent gaps')
  return (
    <section data-testid="view-automation" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Automation</h2>
        <SegmentedControl value={subTab} onChange={setSubTab} />
      </div>
      {subTab === 'Agent gaps' ? (
        <>
          <StatsBanner />
          <Toolbar />
          <PolicyTable />
        </>
      ) : (
        <div className="flex h-64 items-center justify-center text-[14px] text-ink-muted">
          Coming soon
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/AutomationView.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/AutomationView.tsx src/features/insights/cx-journey/AutomationView.test.tsx
git commit -m "feat: CX Journey Automation view (Agent gaps)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire the tab strip in CxJourneyView

**Files:**
- Modify: `src/features/insights/cx-journey/CxJourneyView.tsx`
- Modify: `src/features/insights/cx-journey/CxJourneyView.test.tsx`

**Interfaces:**
- Consumes: `AutomationView` from Task 2.

- [ ] **Step 1: Add the failing test**

Append inside the existing `describe('CxJourneyView', ...)` block in `CxJourneyView.test.tsx` (imports `userEvent` and `within` already present):

```tsx
  it('switches to the Automation tab and back to Overview', async () => {
    const user = userEvent.setup()
    render(<CxJourneyView />)
    const view = within(screen.getByTestId('view-cx-journey'))
    await user.click(view.getByRole('tab', { name: 'Automation' }))
    expect(view.getByText('6,908')).toBeInTheDocument()
    expect(view.getByText('Reactivate account')).toBeInTheDocument()
    expect(view.queryByText('Total conversations (AI + Human)')).not.toBeInTheDocument()
    await user.click(view.getByRole('tab', { name: 'Overview' }))
    expect(view.getByText('Total conversations (AI + Human)')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/CxJourneyView.test.tsx`
Expected: FAIL — no `tab` role named "Automation" (current strip uses `<span>`).

- [ ] **Step 3: Make the tab strip interactive**

Replace the full contents of `CxJourneyView.tsx` with:

```tsx
// CX Journey. The Overview/Topics/Automation strip is now interactive (local
// state, no routing): Overview is the scrollable mock dashboard, Automation is
// the agent-gaps view, Topics is a placeholder. The trends granularity toggle
// within Overview stays interactive.
import { useState } from 'react'
import { AgentsBreakdownTable } from './AgentsBreakdownTable'
import { AutomationView } from './AutomationView'
import { ConversationFlowSection } from './ConversationFlowSection'
import { type Granularity } from './cx-journey-data'
import { TrendsSection } from './TrendsSection'

type CxTab = 'Overview' | 'Topics' | 'Automation'
const TABS: CxTab[] = ['Overview', 'Topics', 'Automation']

export function CxJourneyView() {
  const [tab, setTab] = useState<CxTab>('Overview')
  const [granularity, setGranularity] = useState<Granularity>('weekly')
  return (
    <div data-testid="view-cx-journey" className="h-full overflow-y-auto">
      {/* Sticky header: stays pinned to the top of the scroll area with a
          frosted backdrop so content scrolls softly beneath it (per Figma). */}
      <div className="sticky top-0 z-10 flex items-center gap-6 rounded-t-[26px] bg-white/80 px-8 pb-4 pt-6 backdrop-blur-md">
        <h1 className="pb-3 text-[20px] font-semibold text-ink">CX Journey</h1>
        {TABS.map((t) => {
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
                  ? '-mb-px border-b-2 border-ink pb-3 text-[14px] font-medium text-ink'
                  : 'pb-3 text-[14px] text-ink-muted'
              }
            >
              {t}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-12 px-8 pb-8">
        {tab === 'Overview' && (
          <>
            <ConversationFlowSection />
            <AgentsBreakdownTable />
            <TrendsSection granularity={granularity} onGranularityChange={setGranularity} />
          </>
        )}
        {tab === 'Automation' && <AutomationView />}
        {tab === 'Topics' && (
          <div className="flex h-64 items-center justify-center text-[14px] text-ink-muted">
            Coming soon
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/insights/cx-journey/CxJourneyView.test.tsx`
Expected: PASS (all 4 tests — the 3 existing + the new one). The existing tests still pass because Overview is the default tab.

- [ ] **Step 5: Full verification**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/insights/cx-journey/CxJourneyView.tsx src/features/insights/cx-journey/CxJourneyView.test.tsx
git commit -m "feat: interactive CX Journey tabs with Automation view

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Interactive tab strip (local state) → Task 3. ✓
- `automation-data.ts` (sub-tabs, stats, intro, rows) → Task 1. ✓
- `AutomationView` (segmented control, gradient banner, toolbar, table) → Task 2. ✓
- Empty "Coming soon" for non-built sub-tabs and Topics tab → Tasks 2 & 3. ✓
- Static/presentational search + toolbar → Task 2 (no handlers). ✓
- Tests (CxJourneyView switch, AutomationView stats/rows/empty-state) → Tasks 2 & 3. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. "Coming soon" is an intentional UI string, not a plan placeholder.

**Type consistency:** `AutomationSubTab`, `AUTOMATION_SUBTABS`, `AUTOMATION_STATS`, `AUTOMATION_INTRO`, `AUTOMATION_ROWS` defined in Task 1 and consumed with matching names/types in Task 2. `AutomationView` produced in Task 2, consumed in Task 3. `role="tab"` used consistently for both the Cx tab strip and the segmented control (test queries match).

**Note on `LucideIcon` type:** used in Task 1's `AUTOMATION_SUBTABS` type; imported from `lucide-react`. Confirmed exported by the installed lucide-react.
