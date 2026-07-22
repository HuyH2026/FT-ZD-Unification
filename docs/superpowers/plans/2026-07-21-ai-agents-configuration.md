# AI Agents → Configuration Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend-only AI Agents → Configuration (Widget) screen — a widget-branding studio with a brand list, live chat-widget preview, and config panel — routed under `/ai-agents`.

**Architecture:** Mirror the existing Insights pattern: `/ai-agents` becomes a surface route (`AiAgentsScreen`) with a nested `<Outlet/>`; its index and `/configuration` render `ConfigurationView`, which owns all local state (active tab, selected brand, active rail section, editable per-brand fields). Presentational children (`BrandList`, `WidgetPreview`, `BrandedWidgetPanel`) receive props + handlers. Mock data lives in `config-data.ts`. No backend, no persistence.

**Tech Stack:** React 18, Vite, TypeScript (strict), React Router v7, Tailwind v4 (semantic token classes), lucide-react, Vitest + React Testing Library (jsdom).

## Global Constraints

- **No backend, no persistence.** All data mocked in `config-data.ts`; edits live in `useState` only and reset on reload. Do NOT add `localStorage`.
- **TypeScript strict**, fully typed. Path alias `@` → `src/` (do not add `baseUrl`).
- **Tailwind v4 semantic token classes** where a token exists: `text-ink`, `text-ink-muted`, `border-surface-border`, `bg-white`, `bg-nav-active`, `bg-app-backdrop`, `text-accent-blue`/`bg-accent-blue`. One-off greys/brand colors inline. Do NOT introduce `font-['SF_Pro_*']` arbitrary font-family classes — SF stack is default via `--font-sans`.
- **Icons:** `lucide-react` only on this screen. Do NOT embed Figma asset URLs (they expire).
- **Gates:** `npx tsc --noEmit` and `npx vitest run` must pass. Do NOT rely on `pnpm lint` (known-broken: TS7 vs typescript-eslint). `pnpm`/`npx` both fine; if `pnpm` missing use `npx vitest run`, `npx tsc --noEmit`.
- **Tests:** Vitest + RTL. Scope screen assertions with `within(screen.getByTestId('view-configuration'))`.
- **Commit trailer (every commit):** `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Accessibility affordances (for testability):** active tab → `aria-current="page"`; enabled toggle → `role="switch"` + `aria-checked`; brand rows → `aria-pressed`.

---

### Task 1: Mock data + types (`config-data.ts`)

**Files:**
- Create: `src/features/ai-agents/configuration/config-data.ts`
- Test: `src/features/ai-agents/configuration/config-data.test.ts`

**Interfaces:**
- Consumes: `lucide-react` (`LucideIcon` type + icon components).
- Produces (later tasks rely on these exact names/shapes):
  - `type ChannelTab = { id: 'widget' | 'voice' | 'webcall' | 'headless'; label: string }`
  - `type Brand = { id: string; name: string; swatch: string; tags: string[]; isDefault: boolean; enabled: boolean }`
  - `type RailSection = { id: string; icon: LucideIcon; label: string }`
  - `CHANNEL_TABS: ChannelTab[]`, `SEED_BRANDS: Brand[]`, `BRAND_LIST_LABELS: Record<string, string>`, `RAIL_SECTIONS: RailSection[]`, `SUGGESTED_TAGS: string[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/features/ai-agents/configuration/config-data.test.ts
import { describe, it, expect } from 'vitest'
import { CHANNEL_TABS, SEED_BRANDS, BRAND_LIST_LABELS, RAIL_SECTIONS } from './config-data'

describe('config-data', () => {
  it('has four channel tabs starting with widget', () => {
    expect(CHANNEL_TABS.map((t) => t.id)).toEqual(['widget', 'voice', 'webcall', 'headless'])
  })

  it('seeds three brands with vip default+enabled', () => {
    expect(SEED_BRANDS.map((b) => b.id)).toEqual(['vip', 'member', 'partner'])
    const vip = SEED_BRANDS.find((b) => b.id === 'vip')!
    expect(vip.isDefault).toBe(true)
    expect(vip.enabled).toBe(true)
    expect(vip.name).toBe('SpaceX support')
    expect(vip.tags.length).toBe(4)
  })

  it('maps brand ids to short list labels', () => {
    expect(BRAND_LIST_LABELS.vip).toBe('VIP')
    expect(BRAND_LIST_LABELS.member).toBe('Member')
    expect(BRAND_LIST_LABELS.partner).toBe('Partner')
  })

  it('rail sections lead with brands and each carries an icon', () => {
    expect(RAIL_SECTIONS[0].id).toBe('brands')
    expect(RAIL_SECTIONS.every((s) => typeof s.icon === 'function' || typeof s.icon === 'object')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/configuration/config-data.test.ts`
Expected: FAIL — cannot resolve `./config-data`.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/ai-agents/configuration/config-data.ts
// Mock data + types for the AI Agents → Configuration (Widget) screen.
// Frontend-only; no backend. Values mirror the Figma design (frame Config_01).
import type { LucideIcon } from 'lucide-react'
import { Users, Link2, Heart, BadgeCheck, Smile, Megaphone, Code2, Globe, MessageSquare } from 'lucide-react'

export type ChannelTab = { id: 'widget' | 'voice' | 'webcall' | 'headless'; label: string }

export const CHANNEL_TABS: ChannelTab[] = [
  { id: 'widget', label: 'Widget' },
  { id: 'voice', label: 'Voice' },
  { id: 'webcall', label: 'Web Call' },
  { id: 'headless', label: 'Headless' },
]

// A brand a customer can configure a widget for. `swatch` is the list dot color;
// `name` is the editable brand name shown in the preview header + panel input.
export type Brand = {
  id: string
  name: string
  swatch: string
  tags: string[]
  isDefault: boolean
  enabled: boolean
}

export const SEED_BRANDS: Brand[] = [
  { id: 'vip', name: 'SpaceX support', swatch: '#e0559a', tags: ['Existing Tag 1', 'Existing Tag 2', 'Existing Tag 3', 'Existing Tag 4'], isDefault: true, enabled: true },
  { id: 'member', name: 'Member', swatch: '#4f8bf0', tags: ['Existing Tag 1'], isDefault: false, enabled: true },
  { id: 'partner', name: 'Partner', swatch: '#a06cf0', tags: [], isDefault: false, enabled: false },
]

// The list shows a short label (VIP / Member / Partner); the editable `name`
// drives the preview header + panel input (they are intentionally decoupled).
export const BRAND_LIST_LABELS: Record<string, string> = { vip: 'VIP', member: 'Member', partner: 'Partner' }

// Right-edge customization rail. Only 'brands' has designed panel content; the
// rest highlight on click but do not swap the panel in this phase. Sections from
// 'code' onward form a trailing group rendered below a divider.
export type RailSection = { id: string; icon: LucideIcon; label: string }

export const RAIL_SECTIONS: RailSection[] = [
  { id: 'brands', icon: Users, label: 'Brands' },
  { id: 'links', icon: Link2, label: 'Links' },
  { id: 'sentiment', icon: Heart, label: 'Sentiment' },
  { id: 'license', icon: BadgeCheck, label: 'License' },
  { id: 'mood', icon: Smile, label: 'Mood' },
  { id: 'announce', icon: Megaphone, label: 'Announcements' },
  { id: 'code', icon: Code2, label: 'Code' },
  { id: 'locale', icon: Globe, label: 'Locale' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
]

// First section id in the trailing group (a divider is rendered before it).
export const RAIL_TRAILING_START = 'code'

// Suggested tags for the (decorative) "Assign tags" dropdown.
export const SUGGESTED_TAGS = ['Existing Tag 1', 'Existing Tag 2', 'Existing Tag 3', 'Existing Tag 4']
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/configuration/config-data.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/configuration/config-data.ts src/features/ai-agents/configuration/config-data.test.ts
git commit -m "$(printf 'feat: mock data + types for AI Agents Configuration\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 2: `AiAgentsScreen` surface + nested routing

**Files:**
- Create: `src/features/ai-agents/AiAgentsScreen.tsx`
- Create: `src/features/ai-agents/configuration/ConfigurationView.tsx` (temporary stub, replaced in Task 6)
- Modify: `src/routes.tsx`
- Test: `src/features/ai-agents/ai-agents.routes.test.tsx`

**Interfaces:**
- Consumes: `Outlet` from `react-router`; `routes` from `@/routes`; `findNavItemByPath` from `@/app/nav-config`.
- Produces: `AiAgentsScreen` (default surface), `ConfigurationView` (stub now; full in Task 6). Route paths `/ai-agents`, `/ai-agents/configuration`, `/ai-agents/agent-builder`, `/ai-agents/qa`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/ai-agents/ai-agents.routes.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { findNavItemByPath } from '@/app/nav-config'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('AI Agents routing', () => {
  it('renders Configuration at /ai-agents (index)', () => {
    renderAt('/ai-agents')
    expect(screen.getByTestId('view-configuration')).toBeInTheDocument()
  })

  it('renders Configuration at /ai-agents/configuration', () => {
    renderAt('/ai-agents/configuration')
    expect(screen.getByTestId('view-configuration')).toBeInTheDocument()
  })

  it('renders a placeholder at /ai-agents/agent-builder', () => {
    renderAt('/ai-agents/agent-builder')
    expect(screen.getByText('Agent Builder')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('resolves /ai-agents/configuration to the AI Agents nav item', () => {
    expect(findNavItemByPath('/ai-agents/configuration')?.label).toBe('AI Agents')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/ai-agents.routes.test.tsx`
Expected: FAIL — modules/routes not present.

- [ ] **Step 3: Write the implementations**

`src/features/ai-agents/AiAgentsScreen.tsx`:

```tsx
import { Outlet } from 'react-router'

export function AiAgentsScreen() {
  return (
    <div data-testid="screen-ai-agents" className="h-full rounded-[26px] bg-white">
      <Outlet />
    </div>
  )
}
```

`src/features/ai-agents/configuration/ConfigurationView.tsx` (stub — replaced in Task 6):

```tsx
export function ConfigurationView() {
  return <div data-testid="view-configuration" className="flex h-full flex-col" />
}
```

Modify `src/routes.tsx`:
- Add imports near the other feature imports:
  ```tsx
  import { AiAgentsScreen } from '@/features/ai-agents/AiAgentsScreen'
  import { ConfigurationView } from '@/features/ai-agents/configuration/ConfigurationView'
  ```
- Change the `BUILT` set:
  ```tsx
  const BUILT = new Set(['/', '/insights', '/organization', '/ai-agents'])
  ```
- Add this child block inside the `AppLayout` `children` array (place it right after the `insights` block):
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/ai-agents/ai-agents.routes.test.tsx`
Expected: PASS (4 tests). Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/AiAgentsScreen.tsx src/features/ai-agents/configuration/ConfigurationView.tsx src/routes.tsx src/features/ai-agents/ai-agents.routes.test.tsx
git commit -m "$(printf 'feat: AI Agents surface + nested Configuration routing\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 3: `BrandList`

**Files:**
- Create: `src/features/ai-agents/configuration/BrandList.tsx`
- Test: `src/features/ai-agents/configuration/BrandList.test.tsx`

**Interfaces:**
- Consumes: `Brand`, `BRAND_LIST_LABELS` from `./config-data`.
- Produces: `BrandList` with props `{ brands: Brand[]; selectedId: string; onSelect: (id: string) => void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/ai-agents/configuration/BrandList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrandList } from './BrandList'
import { SEED_BRANDS } from './config-data'

describe('BrandList', () => {
  it('renders a Create new button and one row per brand label', () => {
    render(<BrandList brands={SEED_BRANDS} selectedId="vip" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument()
    expect(screen.getByText('VIP')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.getByText('Partner')).toBeInTheDocument()
  })

  it('marks the selected row via aria-pressed', () => {
    render(<BrandList brands={SEED_BRANDS} selectedId="vip" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /VIP/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Member/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelect with the brand id when a row is clicked', async () => {
    const onSelect = vi.fn()
    render(<BrandList brands={SEED_BRANDS} selectedId="vip" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Member/ }))
    expect(onSelect).toHaveBeenCalledWith('member')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/configuration/BrandList.test.tsx`
Expected: FAIL — cannot resolve `./BrandList`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/features/ai-agents/configuration/BrandList.tsx
// Left column of the Configuration screen: a "Create new" button (inert) and a
// selectable list of brands. Presentational — selection state lives in the view.
import { type Brand, BRAND_LIST_LABELS } from './config-data'

type BrandListProps = {
  brands: Brand[]
  selectedId: string
  onSelect: (id: string) => void
}

export function BrandList({ brands, selectedId, onSelect }: BrandListProps) {
  return (
    <div className="flex w-[180px] shrink-0 flex-col gap-2">
      <button
        type="button"
        className="rounded-full border border-surface-border px-4 py-2 text-[14px] text-ink"
      >
        Create new
      </button>
      {brands.map((brand) => {
        const selected = brand.id === selectedId
        return (
          <button
            key={brand.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(brand.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] text-ink ${selected ? 'bg-nav-active' : ''}`}
          >
            <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: brand.swatch }} />
            <span className="flex-1">{BRAND_LIST_LABELS[brand.id] ?? brand.name}</span>
            {selected ? <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" /> : null}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/configuration/BrandList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/configuration/BrandList.tsx src/features/ai-agents/configuration/BrandList.test.tsx
git commit -m "$(printf 'feat: BrandList for AI Agents Configuration\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 4: `WidgetPreview`

**Files:**
- Create: `src/features/ai-agents/configuration/WidgetPreview.tsx`
- Test: `src/features/ai-agents/configuration/WidgetPreview.test.tsx`

**Interfaces:**
- Consumes: `lucide-react` icons.
- Produces: `WidgetPreview` with props `{ brandName: string }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/ai-agents/configuration/WidgetPreview.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WidgetPreview } from './WidgetPreview'

describe('WidgetPreview', () => {
  it('shows the brand name in the header', () => {
    render(<WidgetPreview brandName="SpaceX support" />)
    expect(screen.getByText('SpaceX support')).toBeInTheDocument()
  })

  it('renders the composer placeholder and footer', () => {
    render(<WidgetPreview brandName="Member" />)
    expect(screen.getByText('Ask a question…')).toBeInTheDocument()
    expect(screen.getByText(/Built with Zendesk/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/configuration/WidgetPreview.test.tsx`
Expected: FAIL — cannot resolve `./WidgetPreview`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/features/ai-agents/configuration/WidgetPreview.tsx
// Center column: a static mock of the live chat widget. Only the header brand
// name is dynamic; the conversation is illustrative (no backend).
import { Rocket } from 'lucide-react'

export function WidgetPreview({ brandName }: { brandName: string }) {
  return (
    <div className="flex flex-1 items-start justify-center">
      <div className="flex w-[320px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_30px_0_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="flex items-center gap-2 bg-[#1b1b1b] px-4 py-4 text-white">
          <Rocket className="h-4 w-4" />
          <span className="text-[15px] font-medium">{brandName}</span>
        </div>
        {/* Body */}
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-[13px] italic text-accent-blue">
            Personalize your chat by using the menu on the right
          </p>
          <p className="max-w-[85%] self-start rounded-2xl bg-app-backdrop px-3 py-2 text-[13px] text-ink">
            Bonjour, Hola, Hello and welcome! How can I help make your day awesome? What can I do to assist you today?
          </p>
          <p className="max-w-[85%] self-end rounded-2xl bg-[#1b1b1b] px-3 py-2 text-[13px] text-white">
            I have some issues with my account
          </p>
        </div>
        {/* Composer */}
        <div className="mx-4 mb-3 rounded-full border border-surface-border px-4 py-2 text-[13px] text-ink-muted">
          Ask a question…
        </div>
        {/* Footer */}
        <div className="flex items-center justify-center gap-1 border-t border-surface-border py-2 text-[12px] text-ink-muted">
          Built with Zendesk
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/configuration/WidgetPreview.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/configuration/WidgetPreview.tsx src/features/ai-agents/configuration/WidgetPreview.test.tsx
git commit -m "$(printf 'feat: WidgetPreview for AI Agents Configuration\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 5: `BrandedWidgetPanel` (config form + icon rail)

**Files:**
- Create: `src/features/ai-agents/configuration/BrandedWidgetPanel.tsx`
- Test: `src/features/ai-agents/configuration/BrandedWidgetPanel.test.tsx`

**Interfaces:**
- Consumes: `Brand`, `RailSection`, `RAIL_SECTIONS`, `RAIL_TRAILING_START` from `./config-data`; `lucide-react` (`Tag`, `X`, `ChevronDown`).
- Produces: `BrandedWidgetPanel` with props:
  ```ts
  {
    brand: Brand
    activeSection: string
    onSectionChange: (id: string) => void
    onNameChange: (name: string) => void
    onToggleEnabled: () => void
    onToggleDefault: () => void
  }
  ```

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/ai-agents/configuration/BrandedWidgetPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrandedWidgetPanel } from './BrandedWidgetPanel'
import { SEED_BRANDS } from './config-data'

const vip = SEED_BRANDS[0]

function setup(overrides = {}) {
  const props = {
    brand: vip,
    activeSection: 'brands',
    onSectionChange: vi.fn(),
    onNameChange: vi.fn(),
    onToggleEnabled: vi.fn(),
    onToggleDefault: vi.fn(),
    ...overrides,
  }
  render(<BrandedWidgetPanel {...props} />)
  return props
}

describe('BrandedWidgetPanel', () => {
  it('renders heading, brand-name input bound to the brand, and tag chips', () => {
    setup()
    expect(screen.getByText('Branded widget')).toBeInTheDocument()
    expect(screen.getByDisplayValue('SpaceX support')).toBeInTheDocument()
    expect(screen.getByText('Existing Tag 1')).toBeInTheDocument()
  })

  it('exposes the enabled toggle via role=switch reflecting brand.enabled', () => {
    setup()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('fires onToggleEnabled when the switch is clicked', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('switch'))
    expect(props.onToggleEnabled).toHaveBeenCalledOnce()
  })

  it('fires onNameChange when the brand name input changes', async () => {
    const props = setup()
    await userEvent.type(screen.getByDisplayValue('SpaceX support'), '!')
    expect(props.onNameChange).toHaveBeenCalled()
  })

  it('fires onSectionChange when a rail icon is clicked', async () => {
    const props = setup()
    // Links is the second rail section.
    await userEvent.click(screen.getByRole('button', { name: 'Links' }))
    expect(props.onSectionChange).toHaveBeenCalledWith('links')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/configuration/BrandedWidgetPanel.test.tsx`
Expected: FAIL — cannot resolve `./BrandedWidgetPanel`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/features/ai-agents/configuration/BrandedWidgetPanel.tsx
// Right column: the "Branded widget" config form plus a far-right icon rail of
// customization sections. Presentational — all edits bubble up via handlers.
// Only the 'brands' rail section has designed content; other sections highlight
// on click but keep this same panel (deferred).
import { Tag, X, ChevronDown } from 'lucide-react'
import { type Brand, RAIL_SECTIONS, RAIL_TRAILING_START } from './config-data'

type BrandedWidgetPanelProps = {
  brand: Brand
  activeSection: string
  onSectionChange: (id: string) => void
  onNameChange: (name: string) => void
  onToggleEnabled: () => void
  onToggleDefault: () => void
}

export function BrandedWidgetPanel({
  brand,
  activeSection,
  onSectionChange,
  onNameChange,
  onToggleEnabled,
  onToggleDefault,
}: BrandedWidgetPanelProps) {
  return (
    <div className="flex w-[484px] shrink-0">
      {/* Config card */}
      <div className="flex-1 rounded-[24px] border border-white/80 bg-white/80 p-6 shadow-[0_0_30px_0_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <h2 className="text-[18px] tracking-[-0.45px] text-black">Branded widget</h2>
        <p className="mt-4 text-[14px] leading-5 text-[#404241]">
          This section lets you create unique widget designs for different <span className="font-semibold">brands</span>, giving each a{' '}
          <span className="font-semibold">personalized look</span>. You can control which users see a widget by applying tags, so only those in the{' '}
          <span className="font-semibold">tagged brands</span> will see it. This ensures targeted visibility and a tailored experience for your audience.
        </p>

        {/* Brand name */}
        <div className="mt-6">
          <p className="text-[14px] font-semibold text-black">Brand name</p>
          <p className="mt-1 text-[12px] text-[#727583]">The name serves as a label for accessing and filtering workflows and insights.</p>
          <input
            type="text"
            aria-label="Brand name"
            value={brand.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#b7b7b3] bg-white px-3 py-2.5 text-[14px] text-ink"
          />
          <p className="mt-1 text-[12px] text-[#999b97]">Keep it under 50 characters</p>
        </div>

        {/* Tags */}
        <div className="mt-6">
          <p className="text-[14px] font-semibold text-black">Tags</p>
          <p className="mt-1 text-[12px] text-[#727583]">
            Tag this brand to associate it with specific segments. Editing and managing tags can be done within{' '}
            <span className="text-[#406cc4]">Global Tags.</span>
          </p>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-[#b7b7b3] bg-white px-4 py-2.5 text-[14px] text-[#9194a0]">
            <span>Assign tags</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {brand.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d9e5] bg-[#f2f4f7] px-2.5 py-1 text-[12px] text-black">
                <Tag className="h-3.5 w-3.5" />
                {tag}
                <X className="h-3.5 w-3.5 text-ink-muted" />
              </span>
            ))}
          </div>
        </div>

        {/* Set as Default */}
        <div className="mt-6">
          <label className="flex items-center gap-2 text-[14px] text-ink">
            <input type="checkbox" checked={brand.isDefault} onChange={onToggleDefault} />
            Set as Default
          </label>
          <p className="mt-1 text-[12px] text-[#727583]">
            Enable this brand by default if no specific tags are assigned or found in the{' '}
            <span className="text-[#406cc4]">embedded script</span>.
          </p>
        </div>

        {/* Widget enabled toggle */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={brand.enabled}
              aria-label="Widget enabled for this brand"
              onClick={onToggleEnabled}
              className={`relative h-5 w-10 rounded-full transition-colors ${brand.enabled ? 'bg-[#2d7e55]' : 'bg-surface-border'}`}
            >
              <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${brand.enabled ? 'left-[23px]' : 'left-1'}`} />
            </button>
            <span className="text-[14px] text-ink">Widget enabled for this brand</span>
          </div>
          <p className="mt-1 text-[12px] text-[#727583]">When off, the widget will not appear for users of this brand.</p>
        </div>
      </div>

      {/* Icon rail */}
      <div className="flex w-[64px] shrink-0 flex-col items-center gap-2 border-l border-surface-border px-2 py-5">
        {RAIL_SECTIONS.map((section) => {
          const Icon = section.icon
          const active = section.id === activeSection
          return (
            <div key={section.id} className="contents">
              {section.id === RAIL_TRAILING_START ? <span className="my-1 w-6 border-t border-surface-border" /> : null}
              <button
                type="button"
                aria-label={section.label}
                onClick={() => onSectionChange(section.id)}
                className={`flex size-8 items-center justify-center rounded-lg ${active ? 'bg-[#ebf5f7] text-[#193d50]' : 'text-ink-muted'}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-agents/configuration/BrandedWidgetPanel.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/configuration/BrandedWidgetPanel.tsx src/features/ai-agents/configuration/BrandedWidgetPanel.test.tsx
git commit -m "$(printf 'feat: BrandedWidgetPanel + icon rail for AI Agents Configuration\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 6: `ConfigurationView` (assemble + state) — replace stub

**Files:**
- Modify: `src/features/ai-agents/configuration/ConfigurationView.tsx` (replace the Task 2 stub)
- Test: `src/features/ai-agents/configuration/ConfigurationView.test.tsx`

**Interfaces:**
- Consumes: `useState` from `react`; `CHANNEL_TABS`, `SEED_BRANDS`, `type Brand`, `type ChannelTab` from `./config-data`; `BrandList`, `WidgetPreview`, `BrandedWidgetPanel`; `lucide-react` (`MessageSquare`, `Mic`, `Phone`, `Code2`).
- Produces: `ConfigurationView` (no props) — the full screen. Still exports the same name imported by `routes.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/ai-agents/configuration/ConfigurationView.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigurationView } from './ConfigurationView'

const view = () => within(screen.getByTestId('view-configuration'))

describe('ConfigurationView', () => {
  it('renders the title, all four tabs, three brands, and the panel', () => {
    render(<ConfigurationView />)
    const v = view()
    expect(v.getByText('Configuration')).toBeInTheDocument()
    for (const t of ['Widget', 'Voice', 'Web Call', 'Headless']) expect(v.getByText(t)).toBeInTheDocument()
    expect(v.getByText('VIP')).toBeInTheDocument()
    expect(v.getByText('Member')).toBeInTheDocument()
    expect(v.getByText('Partner')).toBeInTheDocument()
    expect(v.getByText('Branded widget')).toBeInTheDocument()
  })

  it('updates the panel + preview when a different brand is selected', async () => {
    render(<ConfigurationView />)
    const v = view()
    expect(v.getByDisplayValue('SpaceX support')).toBeInTheDocument()
    await userEvent.click(v.getByRole('button', { name: /Member/ }))
    expect(v.getByDisplayValue('Member')).toBeInTheDocument()
  })

  it('shows a coming-soon body for non-Widget tabs', async () => {
    render(<ConfigurationView />)
    const v = view()
    await userEvent.click(v.getByText('Voice'))
    expect(v.getByText('Coming soon')).toBeInTheDocument()
    expect(v.queryByText('Branded widget')).not.toBeInTheDocument()
  })

  it('marks the active tab with aria-current', async () => {
    render(<ConfigurationView />)
    const v = view()
    expect(v.getByRole('button', { name: /Widget/ })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(v.getByText('Voice'))
    expect(v.getByRole('button', { name: /Voice/ })).toHaveAttribute('aria-current', 'page')
  })

  it('flips the enabled toggle when clicked', async () => {
    render(<ConfigurationView />)
    const v = view()
    const sw = v.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })
})
```

Note: the Widget tab button label contains an icon; `name: /Widget/` matches the accessible name substring. Ensure the tab button's text "Widget" is present so the regex matches.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-agents/configuration/ConfigurationView.test.tsx`
Expected: FAIL — the stub renders an empty view (no title/tabs/brands).

- [ ] **Step 3: Write the implementation** (replace the entire stub file)

```tsx
// src/features/ai-agents/configuration/ConfigurationView.tsx
// AI Agents → Configuration (Widget). A widget-branding studio: a sticky top
// strip (title, channel tabs, Preview/Publish) over a 3-column body — brand
// list, live widget preview, and the Branded-widget config panel. Only the
// Widget tab is built; other tabs show a coming-soon body. All state is local
// and mocked (no backend).
import { useState } from 'react'
import { MessageSquare, Mic, Phone, Code2 } from 'lucide-react'
import { CHANNEL_TABS, SEED_BRANDS, type Brand, type ChannelTab } from './config-data'
import { BrandList } from './BrandList'
import { WidgetPreview } from './WidgetPreview'
import { BrandedWidgetPanel } from './BrandedWidgetPanel'

const TAB_ICON: Record<ChannelTab['id'], typeof MessageSquare> = {
  widget: MessageSquare,
  voice: Mic,
  webcall: Phone,
  headless: Code2,
}

export function ConfigurationView() {
  const [activeTab, setActiveTab] = useState<ChannelTab['id']>('widget')
  const [brands, setBrands] = useState<Brand[]>(SEED_BRANDS)
  const [selectedId, setSelectedId] = useState('vip')
  const [activeSection, setActiveSection] = useState('brands')

  const selected = brands.find((b) => b.id === selectedId)!
  const updateSelected = (patch: Partial<Brand>) =>
    setBrands((bs) => bs.map((b) => (b.id === selectedId ? { ...b, ...patch } : b)))

  return (
    <div data-testid="view-configuration" className="flex h-full flex-col">
      {/* Sticky top strip */}
      <div className="sticky top-0 z-10 flex items-center bg-white px-8 pb-4 pt-6">
        <h1 className="text-[20px] font-semibold text-ink">Configuration</h1>
        <div className="mx-auto flex gap-1 rounded-full bg-app-backdrop p-1">
          {CHANNEL_TABS.map((tab) => {
            const Icon = TAB_ICON[tab.id]
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] ${active ? 'bg-white text-ink shadow-sm' : 'text-ink-muted'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="text-[14px] text-ink-muted">Preview</button>
          <button type="button" className="rounded-full bg-ink px-4 py-1.5 text-[14px] font-medium text-white">Publish</button>
        </div>
      </div>

      {/* Body */}
      {activeTab === 'widget' ? (
        <div className="flex flex-1 gap-6 overflow-hidden px-8 pb-8">
          <BrandList brands={brands} selectedId={selectedId} onSelect={setSelectedId} />
          <WidgetPreview brandName={selected.name} />
          <BrandedWidgetPanel
            brand={selected}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onNameChange={(name) => updateSelected({ name })}
            onToggleEnabled={() => updateSelected({ enabled: !selected.enabled })}
            onToggleDefault={() => updateSelected({ isDefault: !selected.isDefault })}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-ink-muted">
          <div className="text-xl font-medium text-ink">{CHANNEL_TABS.find((t) => t.id === activeTab)?.label}</div>
          <div className="mt-2 text-sm opacity-70">Coming soon</div>
        </div>
      )}
    </div>
  )
}
```

Note on `bg-ink`: confirm an `ink` background utility resolves (the token `--color-ink` exists → `bg-ink` works in Tailwind v4 `@theme inline`). If `bg-ink` does not resolve at build, use `style={{ backgroundColor: 'var(--color-ink)' }}` or `bg-[#2f3130]`. Verify in Step 4 via `npx tsc --noEmit` + a dev build; adjust if the class is dropped.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/ai-agents/configuration/ConfigurationView.test.tsx`
Expected: PASS (5 tests). Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-agents/configuration/ConfigurationView.tsx src/features/ai-agents/configuration/ConfigurationView.test.tsx
git commit -m "$(printf 'feat: assemble AI Agents Configuration view with state\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 7: Full-suite gate + visual verification

**Files:** none (verification only; small fixes if gates fail).

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests green (existing 78 + the new ones). If any fail, fix the offending code and re-run.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check against Figma**

Start the dev server (`npx vite`), poll the port, then navigate a headless Chromium to `/ai-agents/configuration` and screenshot. Compare against Figma frame `Config_01` (node `597:165377`, file `LMPNsX1T3nwkueIRUCDktm`): title + tab pill group, brand list, dark-header widget preview with two bubbles + composer + footer, and the frosted config panel with brand-name input, tag chips, checkbox, toggle, and the right icon rail (top icon active). Note any material visual gaps; apply small CSS fixes only (no scope changes). Stop the dev server (`lsof -ti:PORT -sTCP:LISTEN | xargs -r kill`).

- [ ] **Step 4: Commit any visual fixes** (only if changes were made)

```bash
git add -A
git commit -m "$(printf 'fix: visual polish for AI Agents Configuration vs Figma\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Self-Review

**Spec coverage:** routing (Task 2), mock data (Task 1), brand list (Task 3), widget preview (Task 4), config panel + icon rail (Task 5), assembled view + all interactions + tabs (Task 6), gates + visual check (Task 7). All spec sections mapped. ✓

**Placeholder scan:** every code step contains complete code; test steps contain real assertions; commands have expected output. No TBD/TODO. ✓

**Type consistency:** `Brand`, `ChannelTab`, `RailSection` defined in Task 1 and consumed unchanged. Handler names (`onSelect`, `onNameChange`, `onToggleEnabled`, `onToggleDefault`, `onSectionChange`) consistent between Task 5's `BrandedWidgetPanel` props and Task 6's wiring. `ConfigurationView` export name stable from Task 2 stub → Task 6 replacement, so `routes.tsx` import never breaks. `RAIL_TRAILING_START` defined in Task 1, used in Task 5. ✓

**Known risk flagged:** `bg-ink` utility resolution (Task 6 note) — verified at Step 4 with a fallback.
