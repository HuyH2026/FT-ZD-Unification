# Generate a New Home Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI-Studio-style right-side panel to the Home dashboard that lets a user answer a short Q&A (role + focus areas + optional free text) and deterministically generate a widget layout, previewed on the live dashboard before it is applied.

**Architecture:** A pure, backend-free `generateLayout()` function scores the existing dashboard widgets against the user's answers and returns a `{ left, right }` layout. A presentational `GenerateHomePanel` component (ported from `AiStudioPanel`'s look) collects the answers and calls the generator. `HomeScreen` hosts the panel, holds a non-destructive `previewLayout` state, and only writes to its persisted `layout` on explicit Apply.

**Tech Stack:** React 19, TypeScript (strict), Vite, Tailwind v4, lucide-react, Vitest + React Testing Library (jsdom).

## Global Constraints

- **Path alias:** `@` → `src/`. Do NOT add `baseUrl` to `tsconfig.json`.
- **TypeScript strict mode** — keep all new code fully typed. TypeScript is pinned to 5.9; do not bump.
- **Reliable gates:** `pnpm typecheck`, `pnpm test` (or `npx tsc --noEmit`, `npx vitest run`). `pnpm lint` is known-broken (TS7 toolchain gap) — do not rely on it.
- **Tokens:** prefer semantic classes (`bg-nav-active`, `text-ink`, `border-surface-border`); the Home widgets use inline hex constants (`INK`, `MUTED`, `BORDER`, `PURPLE`, etc.) defined at the top of `HomeScreen.tsx` — match that local convention inside this file. Do NOT reintroduce `font-['SF_Pro_*']` classes.
- **No backend** — generation is deterministic local logic, not an LLM call.
- **Determinism:** no `Date.now()` / `Math.random()` in generation logic.
- **localStorage** access must stay guarded (`window.localStorage?.`) — jsdom has none.
- The widget registry `WIDGETS` in `HomeScreen.tsx` remains the source of truth for which `WidgetId`s exist; the generator must only ever emit valid ids with no duplicates across columns (same invariants `loadLayout` enforces).

**Existing types (from `src/features/home/dashboard-data.ts`, do not redefine):**
```ts
export type WidgetId =
  | 'health' | 'qa' | 'gaps' | 'approvals' | 'notifications'
  | 'cost' | 'activity' | 'intents' | 'policies' | 'knowledge'
export type Layout = { left: WidgetId[]; right: WidgetId[] }
export type ColumnKey = keyof Layout
```

---

## File Structure

- **Create** `src/features/home/generate-layout.ts` — pure generator: `Role`, `FocusArea`, `WIDGET_TAGS`, `ROLE_BASELINE`, `PROMPT_KEYWORDS`, `WIDGET_ORDER`, `generateLayout()`.
- **Create** `src/features/home/generate-layout.test.ts` — unit tests for the generator.
- **Create** `src/features/home/GenerateHomePanel.tsx` — the right-side Q&A + preview/apply panel.
- **Modify** `src/features/home/HomeScreen.tsx` — add Generate button, `showGenerate` + `previewLayout` state, preview rendering, Apply/Discard wiring.
- **Modify** `src/features/home/HomeScreen.test.tsx` — integration tests for open/generate/apply/discard.

---

## Task 1: Generation logic (`generate-layout.ts`)

**Files:**
- Create: `src/features/home/generate-layout.ts`
- Test: `src/features/home/generate-layout.test.ts`

**Interfaces:**
- Consumes: `WidgetId`, `Layout` from `./dashboard-data`.
- Produces:
  - `type Role = 'ops' | 'quality' | 'knowledge' | 'exec'`
  - `type FocusArea = 'resolution' | 'actions' | 'quality' | 'knowledge' | 'cost'`
  - `const ROLES: { key: Role; label: string }[]`
  - `const FOCUS_AREAS: { key: FocusArea; label: string }[]`
  - `function generateLayout(input: { role: Role; focuses: FocusArea[]; prompt?: string }): Layout`

- [ ] **Step 1: Write the failing test**

Create `src/features/home/generate-layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateLayout, ROLES, FOCUS_AREAS, type Role } from './generate-layout'

const ALL_IDS = [
  'health', 'qa', 'gaps', 'approvals', 'notifications',
  'cost', 'activity', 'intents', 'policies', 'knowledge',
]

describe('generateLayout', () => {
  it('exposes four roles and five focus areas for the UI', () => {
    expect(ROLES.map((r) => r.key)).toEqual(['ops', 'quality', 'knowledge', 'exec'])
    expect(FOCUS_AREAS.map((f) => f.key)).toEqual([
      'resolution', 'actions', 'quality', 'knowledge', 'cost',
    ])
  })

  it('only ever emits valid widget ids with no duplicates across columns', () => {
    for (const role of ROLES.map((r) => r.key) as Role[]) {
      const layout = generateLayout({ role, focuses: [] })
      const all = [...layout.left, ...layout.right]
      expect(all.every((id) => ALL_IDS.includes(id))).toBe(true)
      expect(new Set(all).size).toBe(all.length)
      expect(all.length).toBeGreaterThan(0)
    }
  })

  it('always includes the core widgets (health, approvals)', () => {
    const layout = generateLayout({ role: 'exec', focuses: [] })
    const all = [...layout.left, ...layout.right]
    expect(all).toContain('health')
    expect(all).toContain('approvals')
  })

  it('ranks quality-tagged widgets to the top of the left column when quality is the focus', () => {
    const layout = generateLayout({ role: 'quality', focuses: ['quality'] })
    // qa and policies are the quality-tagged widgets; one of them leads the left column.
    expect(['qa', 'policies']).toContain(layout.left[0])
  })

  it('boosts a widget when the free-text prompt mentions its theme', () => {
    const withCost = generateLayout({ role: 'exec', focuses: ['actions'], prompt: 'keep an eye on cost' })
    const withoutCost = generateLayout({ role: 'exec', focuses: ['actions'] })
    const rank = (l: { left: string[]; right: string[] }) =>
      [...l.left, ...l.right].indexOf('cost')
    expect(rank(withCost)).toBeLessThan(rank(withoutCost))
  })

  it('is deterministic — same input yields same output', () => {
    const a = generateLayout({ role: 'ops', focuses: ['resolution', 'actions'], prompt: 'x' })
    const b = generateLayout({ role: 'ops', focuses: ['resolution', 'actions'], prompt: 'x' })
    expect(a).toEqual(b)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/home/generate-layout.test.ts`
Expected: FAIL — cannot resolve `./generate-layout` / exports not defined.

- [ ] **Step 3: Write the implementation**

Create `src/features/home/generate-layout.ts`:

```ts
// Deterministic, backend-free dashboard generator. Given a role, focus areas, and
// an optional free-text prompt, it scores the existing widgets and returns a
// { left, right } layout. No LLM, no Date.now()/Math.random() — same input always
// yields the same output. The widget id universe mirrors WidgetId in dashboard-data.
import type { WidgetId, Layout } from './dashboard-data'

export type Role = 'ops' | 'quality' | 'knowledge' | 'exec'
export type FocusArea = 'resolution' | 'actions' | 'quality' | 'knowledge' | 'cost'

// UI option lists (order matters — tests and the panel rely on it).
export const ROLES: { key: Role; label: string }[] = [
  { key: 'ops', label: 'Ops lead' },
  { key: 'quality', label: 'Quality lead' },
  { key: 'knowledge', label: 'Knowledge manager' },
  { key: 'exec', label: 'Executive' },
]

export const FOCUS_AREAS: { key: FocusArea; label: string }[] = [
  { key: 'resolution', label: 'Resolution & health' },
  { key: 'actions', label: 'Approvals & actions' },
  { key: 'quality', label: 'Quality & testing' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'cost', label: 'Cost & usage' },
]

// Each widget's themes. A widget with no matching focus scores 0 (still eligible
// via the canonical order tail so layouts are never sparse).
const WIDGET_TAGS: Record<WidgetId, FocusArea[]> = {
  health: ['resolution'],
  intents: ['resolution'],
  approvals: ['actions'],
  activity: ['actions'],
  notifications: ['actions'],
  qa: ['quality'],
  policies: ['quality'],
  gaps: ['knowledge'],
  knowledge: ['knowledge'],
  cost: ['cost'],
}

// Focus areas implied by a role when the user picks none.
const ROLE_BASELINE: Record<Role, FocusArea[]> = {
  ops: ['resolution', 'actions'],
  quality: ['quality', 'resolution'],
  knowledge: ['knowledge', 'actions'],
  exec: ['resolution', 'cost'],
}

// Free-text keywords → the focus area they imply.
const PROMPT_KEYWORDS: { term: string; focus: FocusArea }[] = [
  { term: 'cost', focus: 'cost' },
  { term: 'spend', focus: 'cost' },
  { term: 'budget', focus: 'cost' },
  { term: 'resolution', focus: 'resolution' },
  { term: 'health', focus: 'resolution' },
  { term: 'csat', focus: 'resolution' },
  { term: 'approval', focus: 'actions' },
  { term: 'action', focus: 'actions' },
  { term: 'quality', focus: 'quality' },
  { term: 'test', focus: 'quality' },
  { term: 'knowledge', focus: 'knowledge' },
  { term: 'gap', focus: 'knowledge' },
  { term: 'article', focus: 'knowledge' },
]

// Stable tie-break order (also the fallback tail so no layout is empty).
const WIDGET_ORDER: WidgetId[] = [
  'health', 'approvals', 'policies', 'qa', 'gaps',
  'knowledge', 'intents', 'cost', 'activity', 'notifications',
]

// Widgets always present regardless of scoring.
const CORE: WidgetId[] = ['health', 'approvals']

export function generateLayout(input: {
  role: Role
  focuses: FocusArea[]
  prompt?: string
}): Layout {
  const effective = input.focuses.length > 0 ? input.focuses : ROLE_BASELINE[input.role]
  const focusSet = new Set<FocusArea>(effective)

  // Prompt keywords add extra weight to their focus.
  const promptText = (input.prompt ?? '').toLowerCase()
  const promptFocuses = new Set<FocusArea>(
    PROMPT_KEYWORDS.filter((k) => promptText.includes(k.term)).map((k) => k.focus),
  )

  const score = (id: WidgetId): number => {
    const tags = WIDGET_TAGS[id]
    let s = 0
    for (const t of tags) {
      if (focusSet.has(t)) s += 2
      if (promptFocuses.has(t)) s += 1
    }
    if (CORE.includes(id)) s += 0.5 // gentle nudge so core sits high, not forced to top
    return s
  }

  // Rank all widgets: score desc, then canonical order for stable ties.
  const ranked = [...WIDGET_ORDER].sort((a, b) => {
    const diff = score(b) - score(a)
    if (diff !== 0) return diff
    return WIDGET_ORDER.indexOf(a) - WIDGET_ORDER.indexOf(b)
  })

  // Ensure core widgets are present (they always are, since WIDGET_ORDER is the
  // full set — this guards against future edits to WIDGET_ORDER).
  for (const id of CORE) {
    if (!ranked.includes(id)) ranked.push(id)
  }

  // Split into two columns: highest-ranked to the top of the left column,
  // alternating so both columns fill (left gets the odd picks, matching how
  // DEFAULT_LAYOUT weights the left/primary column).
  const left: WidgetId[] = []
  const right: WidgetId[] = []
  ranked.forEach((id, i) => {
    if (i % 2 === 0) left.push(id)
    else right.push(id)
  })

  return { left, right }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/home/generate-layout.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/generate-layout.ts src/features/home/generate-layout.test.ts
git commit -m "feat: deterministic dashboard layout generator

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Generate panel UI (`GenerateHomePanel.tsx`)

**Files:**
- Create: `src/features/home/GenerateHomePanel.tsx`

**Interfaces:**
- Consumes: `generateLayout`, `ROLES`, `FOCUS_AREAS`, `Role`, `FocusArea` from `./generate-layout`; `Layout` from `./dashboard-data`.
- Produces:
  ```ts
  export function GenerateHomePanel(props: {
    hasPreview: boolean
    onGenerate: (layout: Layout) => void
    onApply: () => void
    onDiscard: () => void
    onClose: () => void
  }): JSX.Element
  ```
  - `hasPreview` is owned by the parent (true once a layout has been generated and is being previewed). The panel shows Apply/Discard/Regenerate only when `hasPreview` is true.

- [ ] **Step 1: Write the implementation**

Create `src/features/home/GenerateHomePanel.tsx`:

```tsx
import { useState } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import type { Layout } from './dashboard-data'
import {
  generateLayout, ROLES, FOCUS_AREAS, type Role, type FocusArea,
} from './generate-layout'

// Local palette to match the HomeScreen widget cards.
const INK = '#2f3130'
const INK_SOFT = '#2f3941'
const MUTED = '#8b8e89'
const BORDER = '#e2e0dd'
const PURPLE = '#724be8'

export function GenerateHomePanel({
  hasPreview, onGenerate, onApply, onDiscard, onClose,
}: {
  hasPreview: boolean
  onGenerate: (layout: Layout) => void
  onApply: () => void
  onDiscard: () => void
  onClose: () => void
}) {
  const [role, setRole] = useState<Role | null>(null)
  const [focuses, setFocuses] = useState<FocusArea[]>([])
  const [prompt, setPrompt] = useState('')

  const canGenerate = role !== null && focuses.length > 0

  const toggleFocus = (key: FocusArea) =>
    setFocuses((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]))

  const handleGenerate = () => {
    if (!role || focuses.length === 0) return
    onGenerate(generateLayout({ role, focuses, prompt }))
  }

  return (
    <aside
      data-testid="generate-home-panel"
      className="flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border bg-white"
      style={{ borderColor: BORDER }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={16} color={PURPLE} />
          <span className="text-[15px] font-semibold" style={{ color: INK_SOFT }}>Generate a Home</span>
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded transition-colors hover:bg-[#f5f6f7]"
        >
          <X size={16} color={MUTED} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5">
        <p className="mt-4 text-[20px] leading-7 tracking-[0.2px]" style={{ color: INK }}>
          Let&apos;s design your Home 👋
        </p>
        <p className="mt-2 text-[13px] leading-[18px]" style={{ color: MUTED }}>
          Answer a couple of questions and I&apos;ll assemble the widgets that matter most to you.
        </p>

        {/* Q1 — Role */}
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          What&apos;s your role?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const active = role === r.key
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                aria-pressed={active}
                className="h-8 rounded-full border px-3 text-[13px] font-medium outline-none transition-colors"
                style={{
                  borderColor: active ? PURPLE : BORDER,
                  backgroundColor: active ? `${PURPLE}12` : 'white',
                  color: active ? PURPLE : INK,
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        {/* Q2 — Focus areas */}
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          What matters most right now?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FOCUS_AREAS.map((f) => {
            const active = focuses.includes(f.key)
            return (
              <button
                key={f.key}
                onClick={() => toggleFocus(f.key)}
                aria-pressed={active}
                className="flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-medium outline-none transition-colors"
                style={{
                  borderColor: active ? PURPLE : BORDER,
                  backgroundColor: active ? `${PURPLE}12` : 'white',
                  color: active ? PURPLE : INK,
                }}
              >
                {active && <Check size={12} color={PURPLE} />}
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Free text */}
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          Anything specific? (optional)
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. keep cost and quality front and center"
          className="mt-2 h-16 w-full resize-none rounded-xl border p-3 text-[13px] leading-[18px] outline-none"
          style={{ borderColor: BORDER, color: INK }}
        />
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-4" style={{ borderColor: BORDER }}>
        {hasPreview ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onApply}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full outline-none"
              style={{ backgroundColor: INK }}
            >
              <Check size={15} color="#fff" />
              <span className="text-[13px] font-semibold text-white">Apply</span>
            </button>
            <button
              onClick={handleGenerate}
              className="flex h-9 items-center rounded-full border bg-white px-3.5 outline-none"
              style={{ borderColor: BORDER }}
            >
              <span className="text-[13px] font-semibold" style={{ color: INK }}>Regenerate</span>
            </button>
            <button
              onClick={onDiscard}
              className="flex h-9 items-center rounded-full border bg-white px-3.5 outline-none"
              style={{ borderColor: BORDER }}
            >
              <span className="text-[13px] font-semibold" style={{ color: INK }}>Discard</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: PURPLE }}
          >
            <Sparkles size={15} color="#fff" />
            <span className="text-[13px] font-semibold text-white">Generate my Home</span>
          </button>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/home/GenerateHomePanel.tsx
git commit -m "feat: GenerateHomePanel Q&A + preview/apply UI

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Wire the panel into HomeScreen (button, preview, apply/discard)

**Files:**
- Modify: `src/features/home/HomeScreen.tsx`
- Test: `src/features/home/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `GenerateHomePanel` from `./GenerateHomePanel`; existing `layout`/`setLayout` state and the `Sparkles` icon (already imported from lucide).

- [ ] **Step 1: Write the failing integration tests**

Add to `src/features/home/HomeScreen.test.tsx` (inside the existing top-level `describe('HomeScreen', ...)` block, after the last `it(...)`):

```ts
  it('opens the generate panel from the header', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    expect(screen.queryByTestId('generate-home-panel')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /generate/i }))
    expect(screen.getByTestId('generate-home-panel')).toBeInTheDocument()
  })

  it('generates a preview and applies it to the dashboard', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    // Answer Q1 + Q2 to enable generation.
    await user.click(within(panel).getByRole('button', { name: /quality lead/i }))
    await user.click(within(panel).getByRole('button', { name: /quality & testing/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    // Preview badge appears and Apply is offered.
    expect(screen.getByText(/preview/i)).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    // Panel closes; dashboard still renders widgets.
    expect(screen.queryByTestId('generate-home-panel')).not.toBeInTheDocument()
    expect(screen.getByText('Overall agent health')).toBeInTheDocument()
  })

  it('discards a preview without changing the saved dashboard', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /executive/i }))
    await user.click(within(panel).getByRole('button', { name: /cost & usage/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /discard/i }))
    expect(screen.queryByTestId('generate-home-panel')).not.toBeInTheDocument()
    // Default widgets still present.
    expect(screen.getByText('Overall agent health')).toBeInTheDocument()
  })
```

Ensure `within` is imported at the top of the test file:
```ts
import { render, screen, within } from '@testing-library/react'
```
(If `within` is already imported, leave it. `userEvent` is already imported.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/home/HomeScreen.test.tsx`
Expected: FAIL — no "Generate" button / `generate-home-panel` not found.

- [ ] **Step 3: Add the import**

In `src/features/home/HomeScreen.tsx`, add after the `dashboard-data` import block (around line 13):

```tsx
import { GenerateHomePanel } from './GenerateHomePanel'
```

- [ ] **Step 4: Add preview + panel state**

In `HomeScreen()`, just after `const [layout, setLayout] = useState<Layout>(() => loadLayout())` (line ~751), add:

```tsx
  const [showGenerate, setShowGenerate] = useState(false)
  const [previewLayout, setPreviewLayout] = useState<Layout | null>(null)

  const applyPreview = () => {
    if (previewLayout) setLayout(previewLayout)
    setPreviewLayout(null)
    setShowGenerate(false)
  }
  const discardPreview = () => {
    setPreviewLayout(null)
    setShowGenerate(false)
  }
```

- [ ] **Step 5: Render from the preview when present**

Change `renderColumn` (line ~796) to read the preview layout when set. Replace:

```tsx
  const renderColumn = (column: ColumnKey) => (
    <div className="flex flex-col gap-4">
      {layout[column].map((id, index) => (
```

with:

```tsx
  const activeLayout = previewLayout ?? layout
  const renderColumn = (column: ColumnKey) => (
    <div className="flex flex-col gap-4">
      {activeLayout[column].map((id, index) => (
```

Also update the `ColumnDropZone` count on the following line from `layout[column].length` to `activeLayout[column].length` (drag-drop is only active in edit mode, but keep it consistent).

- [ ] **Step 6: Add the Generate button to the header**

In the non-editing header branch (line ~833), replace:

```tsx
              ) : (
                <button onClick={() => setEditing(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Customize dashboard">
                  <Pencil size={14} color={INK} />
                  <span className="text-[13px] font-semibold" style={{ color: INK }}>Customize</span>
                </button>
              )}
```

with:

```tsx
              ) : (
                <>
                  {previewLayout && (
                    <span className="flex h-9 items-center gap-1.5 rounded-full px-3" style={{ backgroundColor: `${PURPLE}12` }}>
                      <Sparkles size={13} color={PURPLE} />
                      <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>Preview</span>
                    </span>
                  )}
                  <button onClick={() => setShowGenerate(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Generate a new Home">
                    <Sparkles size={14} color={PURPLE} />
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Generate</span>
                  </button>
                  <button onClick={() => setEditing(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Customize dashboard">
                    <Pencil size={14} color={INK} />
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Customize</span>
                  </button>
                </>
              )}
```

- [ ] **Step 7: Render the panel alongside the dashboard**

The outermost element inside `DndProvider` is currently the single `screen-home` div. Wrap it and the panel in a flex row. Replace:

```tsx
    <DndProvider backend={HTML5Backend}>
      <div data-testid="screen-home" className="h-full overflow-y-auto rounded-[26px] bg-white">
```

with:

```tsx
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full gap-2">
      <div data-testid="screen-home" className="h-full flex-1 overflow-y-auto rounded-[26px] bg-white">
```

Then find the matching close of that `screen-home` div (the `</div>` at line ~848, right before `</DndProvider>`) and replace:

```tsx
        </div>
      </div>
    </DndProvider>
```

with:

```tsx
        </div>
      </div>
      {showGenerate && (
        <GenerateHomePanel
          hasPreview={previewLayout !== null}
          onGenerate={setPreviewLayout}
          onApply={applyPreview}
          onDiscard={discardPreview}
          onClose={discardPreview}
        />
      )}
      </div>
    </DndProvider>
```

- [ ] **Step 8: Run the Home tests**

Run: `npx vitest run src/features/home/HomeScreen.test.tsx`
Expected: PASS (all existing tests + 3 new ones).

- [ ] **Step 9: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Full suite + commit**

Run: `npx vitest run`
Expected: all test files pass.

```bash
git add src/features/home/HomeScreen.tsx src/features/home/HomeScreen.test.tsx
git commit -m "feat: wire GenerateHomePanel into Home with preview/apply

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Entry button (Task 3, Step 6) · right-side panel mirroring AiStudio (Task 2) · role + focus + free-text Q&A (Task 2) · deterministic `generateLayout` with tags/baselines/keywords (Task 1) · preview-then-apply, lossless discard (Task 3, Steps 4–7) · widget-id/no-dupe invariants (Task 1 test) · tests for logic + integration (Tasks 1 & 3). All spec sections map to a task.
- **Determinism:** generator uses only sorting over static tables — no `Date.now()`/`Math.random()`.
- **Type consistency:** `generateLayout({ role, focuses, prompt })` and the `GenerateHomePanel` prop names (`hasPreview`, `onGenerate`, `onApply`, `onDiscard`, `onClose`) are identical across Tasks 2 and 3. `Role`/`FocusArea`/`Layout`/`WidgetId` all sourced from their defining modules.
- **Non-destructive:** dashboard reads `previewLayout ?? layout`; `setLayout` (the persisted path) is only called in `applyPreview`.
```
