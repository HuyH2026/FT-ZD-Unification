# PM Opportunity Detail View (L3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-page `/opportunity/:id` detail view that opens from PM-dashboard feed cards and Spotlight rows, showing an opportunity's stats strip, narrative, conversations, customer-segment breakdown, and a right rail (mock Add-to-Jira, linked items, lifecycle timeline).

**Architecture:** A real React Router v7 route (mirrors `orchestrator/:id`). A new deterministic mock (`pm-detail-data.ts`) keyed by opportunity id. Shared UI primitives (`ImpactDonut`, `StageBadge`, `TypeTag`, palette) are first extracted from `PmDashboard.tsx` into `pm-ui.tsx` so both screens share them. Feed cards and mapped spotlight rows become `<Link>`s.

**Tech Stack:** React 19, React Router v7 (`react-router`), TypeScript strict, Vitest + RTL (jsdom), lucide-react, Tailwind v4.

## Global Constraints

- **Frontend-only, deterministic.** No backend. No `Date.now()` / `Math.random()`. Dates are literal display labels; relative math reuses `PM_NOW` from `pm-data.ts`. Ids are literal strings.
- **TypeScript strict.** TS pinned to **5.9** — do NOT bump. Do NOT add `baseUrl` to `tsconfig.json`. `@` → `src/`.
- **React Router:** import from `react-router` (NOT `react-router-dom`).
- **Palette:** reuse the inline hues `INK #2f3130`, `INK_SOFT #2f3941`, `MUTED #8b8e89`, `BORDER #e2e0dd`, `BLUE #1f73b7`, `GREEN #0f8a5f`, `AMBER #c8792b`, `RED #c8402f`, `PURPLE #724be8`. Do NOT introduce `font-['...']` arbitrary font-family classes.
- **Icons:** `lucide-react` only.
- **Tests:** Vitest + RTL. Scope assertions with `within(getByTestId(...))`. Components using `<Link>`/router hooks must render inside a router in tests.
- **Verification gates** (lint is broken upstream — do NOT rely on it): `npx tsc --noEmit`, `npx vitest run`.
- Every task ends green (tsc 0 + all tests pass) and is committed.

## File Structure

- `src/features/home/pm-ui.tsx` (new) — shared palette consts + `ImpactDonut`, `StageBadge`, `STAGE_COLOR`, `TypeTag`.
- `src/features/home/PmDashboard.tsx` (modify) — import shared primitives; wrap feed cards + mapped spotlight rows in `<Link>`.
- `src/features/home/pm-data.ts` (modify) — add `oppId?` to spotlight item types + populate.
- `src/features/home/pm-detail-data.ts` (new) — `OpportunityDetail` types + `PM_OPPORTUNITY_DETAILS`.
- `src/features/home/OpportunityDetailScreen.tsx` (new) — the L3 page.
- `src/routes.tsx` (modify) — register the route.
- Test files alongside each.

---

### Task 1: Extract shared PM UI primitives into `pm-ui.tsx`

Pure refactor: move `ImpactDonut`, `StageBadge`, `STAGE_COLOR`, `TypeTag`, and the palette constants out of `PmDashboard.tsx` into a new `pm-ui.tsx`, and import them back. No behavior change; existing `PmDashboard` tests must stay green.

**Files:**
- Create: `src/features/home/pm-ui.tsx`
- Modify: `src/features/home/PmDashboard.tsx`
- Test: `src/features/home/PmDashboard.test.tsx` (existing — must stay green, no edits expected)

**Interfaces:**
- Produces (imported by Tasks 4 & 5):
  - `INK, INK_SOFT, MUTED, BORDER, BLUE, GREEN, AMBER, RED, PURPLE: string`
  - `function ImpactDonut({ value }: { value: number }): JSX.Element`
  - `const STAGE_COLOR: Record<LifecycleStageKey, string>`
  - `function StageBadge({ stage }: { stage: LifecycleStageKey }): JSX.Element`
  - `function TypeTag({ type }: { type: OppType }): JSX.Element`

- [ ] **Step 1: Create `pm-ui.tsx` with the moved primitives**

```tsx
// Shared, presentational PM UI primitives + palette. Extracted from
// PmDashboard.tsx so the dashboard AND the opportunity detail screen render
// the same donut / badges / tags without duplication or a circular import.
import { Bug, Sparkles } from 'lucide-react'
import { LIFECYCLE_LABEL, type LifecycleStageKey, type OppType } from './pm-data'

// Palette — mirror HomeScreen's inline dashboard hues (same hex values).
export const INK = '#2f3130'
export const INK_SOFT = '#2f3941'
export const MUTED = '#8b8e89'
export const BORDER = '#e2e0dd'
export const BLUE = '#1f73b7'
export const GREEN = '#0f8a5f'
export const AMBER = '#c8792b'
export const RED = '#c8402f'
export const PURPLE = '#724be8'

// --- Impact donut (deterministic, no chart lib) -----------------------------
export function ImpactDonut({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r
  const dash = (value / 100) * c
  const color = value >= 80 ? GREEN : value >= 60 ? BLUE : AMBER
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-label={`Impact ${value}`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#efeeec" strokeWidth="8" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
      <text x="36" y="41" textAnchor="middle" fontSize="18" fontWeight="600" fill={INK}>{value}</text>
    </svg>
  )
}

// --- Stage badge ------------------------------------------------------------
export const STAGE_COLOR: Record<LifecycleStageKey, string> = {
  detected: MUTED,
  planned: PURPLE,
  'in-dev': GREEN,
  shipped: INK,
}

export function StageBadge({ stage }: { stage: LifecycleStageKey }) {
  const color = STAGE_COLOR[stage]
  return (
    <span className="flex h-[20px] items-center rounded-full px-2" style={{ backgroundColor: `${color}18` }}>
      <span className="text-[11px] font-semibold" style={{ color }}>{LIFECYCLE_LABEL[stage]}</span>
    </span>
  )
}

// --- Type tag (BUG / REQUEST) -----------------------------------------------
export function TypeTag({ type }: { type: OppType }) {
  const isBug = type === 'bug'
  const color = isBug ? RED : BLUE
  return (
    <span className="flex h-[20px] items-center gap-1 rounded-full px-2" style={{ backgroundColor: `${color}18` }}>
      {isBug ? <Bug size={11} color={color} /> : <Sparkles size={11} color={color} />}
      <span className="text-[10px] font-semibold uppercase tracking-[0.4px]" style={{ color }}>{isBug ? 'Bug' : 'Request'}</span>
    </span>
  )
}
```

- [ ] **Step 2: Update `PmDashboard.tsx` to import the primitives and delete the local copies**

In `PmDashboard.tsx`:
1. Remove the local palette constant block (`const INK = '#2f3130'` … `const PURPLE = '#724be8'`) — but **keep `const DAY = 86400000`** (still used by the feed).
2. Remove the local `ImpactDonut` function, the `STAGE_COLOR` const, the `StageBadge` function, and the `TypeTag` function.
3. Add an import of the extracted primitives. Place it after the existing `./pm-integration` import:

```tsx
import {
  INK, INK_SOFT, MUTED, BORDER, BLUE, GREEN, AMBER, RED, PURPLE,
  ImpactDonut, STAGE_COLOR, StageBadge, TypeTag,
} from './pm-ui'
```

4. Remove `Bug` and `Sparkles` from the top `lucide-react` import IF they are no longer referenced anywhere else in `PmDashboard.tsx` after the moves. (Check: `Sparkles` is still used by the "Generate fix" button and `TrendingUp`/etc. remain. `Bug` was only used by `TypeTag` — remove it. Keep `Sparkles`.) Verify with tsc: unused imports are a `tsc --noEmit` error under this project's config only if `noUnusedLocals` is on — regardless, remove `Bug` to be safe and keep the import list minimal.

Note: `STAGE_COLOR` is referenced by `PmLifecycle` in `PmDashboard.tsx` (`const color = STAGE_COLOR[s.key]`) — the import covers it.

- [ ] **Step 3: Run tsc**

Run: `cd /Users/huy.hua/Documents/Unification && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Run the PM tests**

Run: `npx vitest run src/features/home/PmDashboard.test.tsx src/features/home/HomeScreen.test.tsx`
Expected: PASS (no assertion changes — pure refactor).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/pm-ui.tsx src/features/home/PmDashboard.tsx
git commit -m "refactor(pm): extract shared ImpactDonut/StageBadge/TypeTag into pm-ui"
```

---

### Task 2: Add `oppId` links to spotlight items

Give spotlight rows an optional pointer to a feed opportunity so mapped rows can link to the detail page in Task 5.

**Files:**
- Modify: `src/features/home/pm-data.ts`
- Test: `src/features/home/pm-data.test.ts`

**Interfaces:**
- Produces: `TrendingItem`, `AtRiskItem`, `AskingItem` each gain `oppId?: string`. Populated mappings: trending `t2→'o3'`, `t3→'o2'`; atRisk `r1→'o1'`, `r2→'o3'`, `r3→'o2'`; asking `a2→'o2'`. Other rows leave `oppId` undefined.

- [ ] **Step 1: Write the failing test**

Add to `src/features/home/pm-data.test.ts` (append inside the existing top-level `describe`, or add a new `describe`):

```ts
import { PM_DATA } from './pm-data'

describe('pm-data — spotlight → opportunity links', () => {
  const oppIds = new Set(PM_DATA.opportunities.map((o) => o.id))

  it('every populated spotlight oppId points at a real opportunity', () => {
    const all = [
      ...PM_DATA.spotlight.trending,
      ...PM_DATA.spotlight.atRisk,
      ...PM_DATA.spotlight.asking,
    ]
    const linked = all.filter((i) => i.oppId !== undefined)
    expect(linked.length).toBeGreaterThan(0)
    for (const i of linked) expect(oppIds.has(i.oppId!)).toBe(true)
  })

  it('maps the SCIM at-risk row to o2', () => {
    const scim = PM_DATA.spotlight.atRisk.find((i) => /SCIM/i.test(i.title))
    expect(scim?.oppId).toBe('o2')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/features/home/pm-data.test.ts`
Expected: FAIL — `oppId` is not a known property / values undefined.

- [ ] **Step 3: Add `oppId?` to the three item types**

In `pm-data.ts`, extend each spotlight item type with `oppId?: string`:

```ts
export type TrendingItem = {
  id: string; rank: number; title: string; meta: string
  stage: LifecycleStageKey; trendPct: string; trendGood: boolean; up: boolean
  oppId?: string
}
export type AtRiskItem = {
  id: string; rank: number; title: string; meta: string
  tag: SpotlightTag; amount: string
  oppId?: string
}
export type AskingItem = {
  id: string; rank: number; title: string; meta: string
  stage: LifecycleStageKey; amount: string
  oppId?: string
}
```

- [ ] **Step 4: Populate the mappings in `PM_DATA.spotlight`**

Edit the existing rows (add `oppId` to these, leave the rest unchanged):
- `trending`: `t2` (Bulk CSV) → `oppId: 'o3'`; `t3` (SCIM) → `oppId: 'o2'`. (`t1` Android crash: no opportunity — leave undefined.)
- `atRisk`: `r1` (SAML SSO) → `oppId: 'o1'`; `r2` (Bulk CSV) → `oppId: 'o3'`; `r3` (SCIM) → `oppId: 'o2'`.
- `asking`: `a2` (SCIM) → `oppId: 'o2'`. (`a1` Salesforce sync and `a3` Dark mode: no opportunity — leave undefined.)

Example (trending t2 & t3):

```ts
{ id: 't2', rank: 2, title: 'Bulk CSV export times out past ~10k rows', meta: '91 conversations · churn risk $190K', stage: 'planned', trendPct: '38%', trendGood: false, up: true, oppId: 'o3' },
{ id: 't3', rank: 3, title: 'SCIM auto-provisioning for user lifecycle', meta: '64 conversations · opportunity $610K', stage: 'planned', trendPct: '23%', trendGood: true, up: true, oppId: 'o2' },
```

Apply the analogous one-property additions to `r1`, `r2`, `r3`, and `a2`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/features/home/pm-data.test.ts && npx tsc --noEmit`
Expected: PASS, tsc exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/pm-data.ts src/features/home/pm-data.test.ts
git commit -m "feat(pm): link spotlight rows to feed opportunities via oppId"
```

---

### Task 3: Opportunity detail data model (`pm-detail-data.ts`)

Deterministic per-opportunity detail records. SCIM (`o2`) transcribed from the Figma; `o1`/`o3` coherent equivalents.

**Files:**
- Create: `src/features/home/pm-detail-data.ts`
- Test: `src/features/home/pm-detail-data.test.ts`

**Interfaces:**
- Consumes: `PM_DATA`, `PM_NOW`, `Opportunity`, `LifecycleStageKey` from `./pm-data`.
- Produces (imported by Task 4):
  - Types `DetailSegment`, `AffectedCustomer`, `DetailConversation`, `NarrativeRun`, `TimelineNode`, `OpportunityDetail` (shapes below).
  - `const LIFECYCLE_ORDER: LifecycleStageKey[]` = `['detected','planned','in-dev','shipped']`.
  - `const PM_OPPORTUNITY_DETAILS: Record<string, OpportunityDetail>` keyed `o1`/`o2`/`o3`.
  - `function getOpportunityDetail(id: string | undefined): OpportunityDetail | undefined`.

- [ ] **Step 1: Write the failing test**

Create `src/features/home/pm-detail-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PM_DATA } from './pm-data'
import { PM_OPPORTUNITY_DETAILS, getOpportunityDetail, LIFECYCLE_ORDER } from './pm-detail-data'

describe('pm-detail-data', () => {
  it('has a detail record for every feed opportunity', () => {
    for (const o of PM_DATA.opportunities) {
      expect(PM_OPPORTUNITY_DETAILS[o.id]).toBeDefined()
    }
  })

  it('each detail reuses the base opportunity as its .opp (single source of truth)', () => {
    for (const o of PM_DATA.opportunities) {
      expect(PM_OPPORTUNITY_DETAILS[o.id].opp).toBe(o)
    }
  })

  it('timeline is 4 nodes in canonical lifecycle order', () => {
    for (const id of Object.keys(PM_OPPORTUNITY_DETAILS)) {
      const t = PM_OPPORTUNITY_DETAILS[id].timeline
      expect(t.map((n) => n.stage)).toEqual(LIFECYCLE_ORDER)
    }
  })

  it('the node matching the opportunity stage carries a date label', () => {
    for (const id of Object.keys(PM_OPPORTUNITY_DETAILS)) {
      const d = PM_OPPORTUNITY_DETAILS[id]
      const current = d.timeline.find((n) => n.stage === d.opp.stage)
      expect(current?.dateLabel).toBeTruthy()
    }
  })

  it('detail records are well-formed', () => {
    for (const id of Object.keys(PM_OPPORTUNITY_DETAILS)) {
      const d = PM_OPPORTUNITY_DETAILS[id]
      expect(d.volumeCount).toBeGreaterThan(0)
      expect(d.segments.length).toBeGreaterThan(0)
      expect(d.affectedCustomers.length).toBeGreaterThan(0)
      expect(d.conversations.length).toBeGreaterThan(0)
      expect(d.narrative.length).toBeGreaterThan(0)
      expect(d.totalConversations).toBeGreaterThan(0)
    }
  })

  it('getOpportunityDetail resolves a known id and rejects others', () => {
    expect(getOpportunityDetail('o2')).toBe(PM_OPPORTUNITY_DETAILS.o2)
    expect(getOpportunityDetail('bogus')).toBeUndefined()
    expect(getOpportunityDetail(undefined)).toBeUndefined()
  })

  it('SCIM (o2) matches the Figma stats strip', () => {
    const d = PM_OPPORTUNITY_DETAILS.o2
    expect(d.opp.impact).toBe(78)
    expect(d.volumeCount).toBe(164)
    expect(d.reproSteps && d.reproSteps.length).toBeGreaterThan(0) // o2 is a bug
    expect(d.segments.map((s) => s.label)).toEqual(['Enterprise', 'Pro', 'Team'])
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/features/home/pm-detail-data.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `pm-detail-data.ts`**

```ts
// Deterministic per-opportunity detail records for the L3 opportunity view.
// Extends the base Opportunity (from pm-data) with the narrative, conversations,
// customer-segment breakdown, affected accounts, and lifecycle timeline shown in
// the Figma. SCIM (o2) is transcribed from the Figma; o1/o3 are coherent
// equivalents. No backend, no Date.now(): dates are literal labels.
import { PM_DATA, type Opportunity, type LifecycleStageKey } from './pm-data'

export type DetailSegment = {
  key: string; label: string; convoCount: number; pct: number; revenue: string
}
export type AffectedCustomer = {
  id: string; name: string; plan: string; renewalDate: string; arrLabel: string
}
export type DetailConversation = {
  id: string; quote: string; customer: string; revenueLabel: string; plan: string
}
export type NarrativeRun = { text: string; bold?: boolean }
export type TimelineNode = { stage: LifecycleStageKey; dateLabel: string | null }

export type OpportunityDetail = {
  opp: Opportunity
  volumeCount: number
  narrative: NarrativeRun[]
  reproSteps?: string[]
  suggestedAction: string
  linkedSuggestion?: { ref: string; text: string }
  timeline: TimelineNode[]
  segments: DetailSegment[]
  affectedCustomers: AffectedCustomer[]
  totalConversations: number
  conversations: DetailConversation[]
}

export const LIFECYCLE_ORDER: LifecycleStageKey[] = ['detected', 'planned', 'in-dev', 'shipped']

// Index the canonical opportunities by id so each detail's .opp is the SAME
// object (no drift between the feed card and the detail page).
const byId: Record<string, Opportunity> = Object.fromEntries(
  PM_DATA.opportunities.map((o) => [o.id, o]),
)

// Build the 4-node timeline: the node at the opportunity's current stage gets the
// supplied date; earlier stages are marked done with their date; later stages are
// null ("--"). `dates` maps a stage key to its label for the stages that have one.
function timeline(dates: Partial<Record<LifecycleStageKey, string>>): TimelineNode[] {
  return LIFECYCLE_ORDER.map((stage) => ({ stage, dateLabel: dates[stage] ?? null }))
}

export const PM_OPPORTUNITY_DETAILS: Record<string, OpportunityDetail> = {
  // --- SCIM auto-provisioning (Figma-exact) ---------------------------------
  o2: {
    opp: byId.o2,
    volumeCount: 164,
    narrative: [
      { text: 'Enterprise and Pro customers with an external identity provider report that new hires and departures are not reflected in their ' },
      { text: 'user access automatically', bold: true },
      { text: '. Without SCIM provisioning, admins manually add and remove seats, which leaves stale accounts active after employees leave and blocks org-wide rollout. The pattern is concentrated in accounts with 100+ seats and has grown sharply since the identity-sync beta opened on Jun 12, pointing to ' },
      { text: 'automated lifecycle management as the blocking requirement', bold: true },
      { text: '. Several customers say they cannot expand until provisioning is hands-off.' },
    ],
    reproSteps: [
      'Connect an external identity provider (reproduced with Okta, Entra ID)',
      'Deactivate a user in the identity provider',
      'Observe the account stays active in the app — no deprovisioning event is received',
      'New hires added in the IdP are likewise not provisioned automatically',
    ],
    suggestedAction:
      'Connect your identity provider to keep user access up to date. Sync with Jira to track the provisioning rollout across your Atlassian workspace, or with Claude Code to automatically assign and revoke seats as your team changes. No manual updates needed.',
    linkedSuggestion: {
      ref: 'SCIM-1423',
      text: '“SCIM deprovisioning delay” already exists.',
    },
    timeline: timeline({ detected: 'Jun 15' }),
    segments: [
      { key: 'enterprise', label: 'Enterprise', convoCount: 104, pct: 80, revenue: '$815K' },
      { key: 'pro', label: 'Pro', convoCount: 54, pct: 55, revenue: '$710K' },
      { key: 'team', label: 'Team', convoCount: 35, pct: 40, revenue: '$650K' },
    ],
    affectedCustomers: [
      { id: 'ac', name: 'Active Campaign', plan: 'Enterprise', renewalDate: 'Aug 15, 2026', arrLabel: '$140K ARR' },
      { id: 'lime', name: 'Lime', plan: 'Pro', renewalDate: 'Sep 15, 2026', arrLabel: '$86K ARR' },
      { id: 'acorns', name: 'Acorns', plan: 'Pro', renewalDate: 'Aug 1, 2026', arrLabel: '$60K ARR' },
    ],
    totalConversations: 142,
    conversations: [
      { id: 'c1', quote: 'Every 60 minutes our whole org gets kicked back to login. Killing adoption with 400 seats.', customer: 'Lime', revenueLabel: '$210K revenue', plan: 'Enterprise' },
      { id: 'c2', quote: 'Refresh silently fails and we lose unsaved work.', customer: 'Acorns', revenueLabel: '$60K revenue', plan: 'Pro' },
    ],
  },

  // --- SAML SSO drops users (request, in-dev) -------------------------------
  o1: {
    opp: byId.o1,
    volumeCount: 218,
    narrative: [
      { text: 'Large SSO customers report that users are ' },
      { text: 'silently signed out on token refresh', bold: true },
      { text: ', roughly every session hour, and bounced back to the login screen mid-task. The disruption scales with seat count and is most severe on Enterprise annual plans. It began after the v2.4 auth release and correlates with the silent-refresh code path, indicating a ' },
      { text: 'regression in SAML session renewal', bold: true },
      { text: '. Customers describe real adoption and productivity loss across hundreds of seats.' },
    ],
    reproSteps: [
      'Sign in via SAML SSO on an Enterprise account',
      'Leave the session idle until the access token nears expiry (~60 min)',
      'Trigger any authenticated request → silent refresh runs',
      'User is returned to the login screen; unsaved work is lost',
    ],
    suggestedAction:
      'Ship the session-renewal fix behind a flag for affected tenants, then sync the rollout to Jira so account teams can track it against renewals. Notify the top Enterprise accounts once verified.',
    linkedSuggestion: {
      ref: 'AUTH-982',
      text: '“Silent token refresh logout” already exists.',
    },
    timeline: timeline({ detected: 'May 28', planned: 'Jun 3', 'in-dev': 'Jun 12' }),
    segments: [
      { key: 'enterprise', label: 'Enterprise', convoCount: 118, pct: 86, revenue: '$920K' },
      { key: 'pro', label: 'Pro', convoCount: 61, pct: 58, revenue: '$540K' },
      { key: 'team', label: 'Team', convoCount: 39, pct: 42, revenue: '$310K' },
    ],
    affectedCustomers: [
      { id: 'lime', name: 'Lime', plan: 'Enterprise', renewalDate: 'Sep 15, 2026', arrLabel: '$210K ARR' },
      { id: 'ac', name: 'Active Campaign', plan: 'Enterprise', renewalDate: 'Aug 15, 2026', arrLabel: '$140K ARR' },
      { id: 'acorns', name: 'Acorns', plan: 'Pro', renewalDate: 'Aug 1, 2026', arrLabel: '$60K ARR' },
    ],
    totalConversations: 190,
    conversations: [
      { id: 'c1', quote: 'Every 60 minutes our whole org gets kicked back to login. Killing adoption with 400 seats.', customer: 'Lime', revenueLabel: '$210K revenue', plan: 'Enterprise' },
      { id: 'c2', quote: 'Our reps lose half-written tickets when the session drops. It happens all day.', customer: 'Active Campaign', revenueLabel: '$140K revenue', plan: 'Enterprise' },
    ],
  },

  // --- Bulk CSV export times out (request, planned) -------------------------
  o3: {
    opp: byId.o3,
    volumeCount: 91,
    narrative: [
      { text: 'Customers running scheduled exports report that ' },
      { text: 'large CSV exports time out past roughly 10,000 rows', bold: true },
      { text: ', returning no file and no clear error. Teams work around it by manually splitting files or abandoning the export entirely. Volume is concentrated on Growth-plan accounts with weekly reporting jobs and has climbed steadily over the last ten weeks, indicating a ' },
      { text: 'scaling limit in the export pipeline', bold: true },
      { text: ' rather than a one-off outage.' },
    ],
    reproSteps: [
      'Create an export whose result set exceeds ~10,000 rows',
      'Run the export (or wait for the scheduled job)',
      'The request exceeds the timeout and returns no file',
      'No actionable error is surfaced to the user',
    ],
    suggestedAction:
      'Move large exports to an async, chunked job with a download link on completion. Track the work in Jira and notify affected accounts when streaming exports ship.',
    timeline: timeline({ detected: 'May 6', planned: 'May 20' }),
    segments: [
      { key: 'enterprise', label: 'Enterprise', convoCount: 21, pct: 44, revenue: '$210K' },
      { key: 'pro', label: 'Pro', convoCount: 33, pct: 62, revenue: '$180K' },
      { key: 'team', label: 'Team', convoCount: 18, pct: 30, revenue: '$90K' },
    ],
    affectedCustomers: [
      { id: 'acorns', name: 'Acorns', plan: 'Pro', renewalDate: 'Aug 1, 2026', arrLabel: '$60K ARR' },
      { id: 'lime', name: 'Lime', plan: 'Pro', renewalDate: 'Sep 15, 2026', arrLabel: '$86K ARR' },
      { id: 'ac', name: 'Active Campaign', plan: 'Enterprise', renewalDate: 'Aug 15, 2026', arrLabel: '$140K ARR' },
    ],
    totalConversations: 91,
    conversations: [
      { id: 'c1', quote: 'We schedule weekly exports and half of them silently fail now.', customer: 'Acorns', revenueLabel: '$60K revenue', plan: 'Pro' },
      { id: 'c2', quote: 'We had to split our monthly report into six files by hand. It is not workable.', customer: 'Lime', revenueLabel: '$86K revenue', plan: 'Pro' },
    ],
  },
}

export function getOpportunityDetail(id: string | undefined): OpportunityDetail | undefined {
  if (id === undefined) return undefined
  return PM_OPPORTUNITY_DETAILS[id]
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/features/home/pm-detail-data.test.ts && npx tsc --noEmit`
Expected: PASS, tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/home/pm-detail-data.ts src/features/home/pm-detail-data.test.ts
git commit -m "feat(pm): opportunity detail data model (o1/o2/o3)"
```

---

### Task 4: Opportunity detail screen + route

The L3 page itself, plus registering the route. Wraps the visual layout from the Figma; reuses the shared primitives (Task 1) and detail data (Task 3); Add-to-tool reuses `pm-integration`.

**Files:**
- Create: `src/features/home/OpportunityDetailScreen.tsx`
- Modify: `src/routes.tsx`
- Test: `src/features/home/OpportunityDetailScreen.test.tsx`

**Interfaces:**
- Consumes: `getOpportunityDetail`, `LIFECYCLE_ORDER`, detail types from `./pm-detail-data`; `ImpactDonut`, `StageBadge`, `TypeTag`, palette from `./pm-ui`; `LIFECYCLE_LABEL` from `./pm-data`; `loadPmIntegration`, `persistPmIntegration`, `PM_TOOLS`, `PM_TOOL_LABEL`, types from `./pm-integration`; `useParams`, `useNavigate`, `Link` from `react-router`.
- Produces: `export function OpportunityDetailScreen(): JSX.Element` — reads `:id`, renders detail or a not-found state.

- [ ] **Step 1: Write the failing test**

Create `src/features/home/OpportunityDetailScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { OpportunityDetailScreen } from './OpportunityDetailScreen'

function stubStorage() {
  const map = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(), key: () => null, length: 0,
  })
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/opportunity/:id', element: <OpportunityDetailScreen /> },
      { path: '/', element: <div data-testid="home-landing">Home</div> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('OpportunityDetailScreen', () => {
  beforeEach(() => stubStorage())
  afterEach(() => vi.unstubAllGlobals())

  it('renders the SCIM opportunity by id', () => {
    renderAt('/opportunity/o2')
    const screenEl = within(screen.getByTestId('screen-opportunity-detail'))
    expect(screenEl.getByText(/SCIM auto-provisioning/i)).toBeInTheDocument()
    expect(screenEl.getByText('164')).toBeInTheDocument()          // volume
    expect(screenEl.getByLabelText('Impact 78')).toBeInTheDocument() // donut
  })

  it('shows a not-found state for an unknown id', () => {
    renderAt('/opportunity/bogus')
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })

  it('back button navigates home', async () => {
    const user = userEvent.setup()
    renderAt('/opportunity/o2')
    await user.click(screen.getByRole('button', { name: /product recommendations|back/i }))
    expect(screen.getByTestId('home-landing')).toBeInTheDocument()
  })

  it('Add to tool: connecting flips the action to Added', async () => {
    const user = userEvent.setup()
    renderAt('/opportunity/o2')
    const detail = within(screen.getByTestId('screen-opportunity-detail'))
    await user.click(detail.getByRole('button', { name: /add to jira|connect/i }))
    await user.click(screen.getByRole('button', { name: /^Jira$/i }))
    await user.click(detail.getByRole('button', { name: /add to jira/i }))
    expect(detail.getByRole('button', { name: /added/i })).toBeInTheDocument()
  })

  it('dismissing the linked-item alert hides it', async () => {
    const user = userEvent.setup()
    renderAt('/opportunity/o2')
    const detail = within(screen.getByTestId('screen-opportunity-detail'))
    expect(detail.getByText(/possible related issue/i)).toBeInTheDocument()
    await user.click(detail.getByRole('button', { name: /dismiss/i }))
    expect(detail.queryByText(/possible related issue/i)).not.toBeInTheDocument()
    expect(detail.getByText(/no issues linked yet/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/features/home/OpportunityDetailScreen.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `OpportunityDetailScreen.tsx`**

```tsx
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Check, Clock, Lightbulb, MessageSquare,
  Plug, Sparkles, TrendingUp, TrendingDown, User, X,
} from 'lucide-react'
import {
  INK, INK_SOFT, MUTED, BORDER, BLUE, GREEN, RED, PURPLE,
  ImpactDonut, StageBadge, TypeTag,
} from './pm-ui'
import { LIFECYCLE_LABEL } from './pm-data'
import {
  getOpportunityDetail, LIFECYCLE_ORDER,
  type OpportunityDetail, type DetailSegment, type AffectedCustomer, type DetailConversation,
} from './pm-detail-data'
import {
  PM_TOOLS, PM_TOOL_LABEL, loadPmIntegration, persistPmIntegration,
  type PmIntegration, type PmTool,
} from './pm-integration'

const CARD = 'rounded-2xl border border-solid bg-white'

function Divider() {
  return <div className="my-8 h-px w-full" style={{ backgroundColor: BORDER }} />
}

// Stats-strip proportional bar (filled portion = the affected/at-risk share).
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#d2d3d8' }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function StatsStrip({ d }: { d: OpportunityDetail }) {
  const { opp } = d
  const atRisk = opp.revenueState === 'at-risk'
  const revColor = atRisk ? RED : GREEN
  const volColor = opp.volumeGood ? GREEN : RED
  return (
    <div className={`${CARD} flex items-stretch gap-6 p-6`} style={{ borderColor: '#e4e7f0' }}>
      {/* Impact donut */}
      <div className="flex shrink-0 flex-col items-center justify-center">
        <ImpactDonut value={opp.impact} />
        <span className="mt-1 text-[12px] font-normal" style={{ color: INK }}>Impact</span>
      </div>
      <div className="w-px shrink-0" style={{ backgroundColor: BORDER }} />
      {/* Revenue */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-normal" style={{ color: INK }}>Revenue</span>
          <span className="flex h-[24px] items-center rounded-full px-2" style={{ backgroundColor: `${revColor}18` }}>
            <span className="text-[12px] font-medium" style={{ color: revColor }}>{atRisk ? 'At risk' : 'Asking'}</span>
          </span>
        </div>
        <span className="mt-1 text-[28px] font-semibold leading-[30px]" style={{ color: INK }}>{opp.revenue}</span>
        <MiniBar pct={62} color="#e53112" />
      </div>
      <div className="w-px shrink-0" style={{ backgroundColor: BORDER }} />
      {/* Volume */}
      <div className="flex flex-1 flex-col justify-center">
        <span className="text-[14px] font-normal" style={{ color: INK }}>Volume • 10 wk</span>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[28px] font-semibold leading-[30px]" style={{ color: INK }}>{d.volumeCount}</span>
          <span className="flex items-center gap-0.5" style={{ color: volColor }}>
            {opp.volumeUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-[14px] font-normal">{opp.volumePct}</span>
          </span>
        </div>
      </div>
      <div className="w-px shrink-0" style={{ backgroundColor: BORDER }} />
      {/* Customer segment legend */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <span className="text-[14px] font-normal" style={{ color: INK }}>Customer segment</span>
        <div className="flex flex-wrap gap-1.5">
          {d.segments.map((s) => (
            <span key={s.key} className="flex h-[22px] items-center rounded-full px-2" style={{ backgroundColor: '#e8e9eb' }}>
              <span className="text-[11px] font-semibold" style={{ color: '#373a4d' }}>{s.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Narrative({ d }: { d: OpportunityDetail }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb size={22} color={INK} />
        <h2 className="text-[20px] font-semibold" style={{ color: INK }}>What’s happening</h2>
      </div>
      <p className="text-[14px] leading-[20px]" style={{ color: INK }}>
        {d.narrative.map((run, i) => (
          <span key={i} className={run.bold ? 'font-bold' : 'font-normal'}>{run.text}</span>
        ))}
      </p>
      {d.reproSteps && d.reproSteps.length > 0 && (
        <div className="mt-4 rounded-[10px] border border-solid p-4" style={{ borderColor: '#ffb393' }}>
          <p className="text-[14px] font-semibold" style={{ color: INK }}>Suggested reproduction steps</p>
          <ol className="mt-2 list-decimal pl-5">
            {d.reproSteps.map((s, i) => (
              <li key={i} className="text-[14px] leading-[20px]" style={{ color: '#162040' }}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function ConversationCard({ c }: { c: DetailConversation }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: '#f5faff' }}>
      <p className="text-[14px] italic leading-[22px]" style={{ color: '#000' }}>“{c.quote}”</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[12px] font-medium" style={{ color: '#545767' }}>
          {c.customer} • {c.revenueLabel} • {c.plan}
        </span>
        <button className="text-[12px] font-medium underline outline-none" style={{ color: '#293239' }}>View conversation</button>
      </div>
    </div>
  )
}

function Conversations({ d }: { d: OpportunityDetail }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare size={22} color={INK} />
        <h2 className="text-[20px] font-semibold" style={{ color: INK }}>Conversations</h2>
        <button className="flex h-8 items-center rounded-full border border-solid px-3 outline-none" style={{ borderColor: '#b8b7b5' }}>
          <span className="text-[12px] font-semibold" style={{ color: '#293239' }}>View all {d.totalConversations} conversations</span>
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {d.conversations.map((c) => <ConversationCard key={c.id} c={c} />)}
      </div>
    </div>
  )
}

function SegmentBar({ s }: { s: DetailSegment }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-[80px] shrink-0 text-[14px] font-medium" style={{ color: INK }}>{s.label}</span>
      <div className="flex h-[9px] flex-1 overflow-hidden rounded-[2px]" style={{ backgroundColor: '#d2d3d8' }}>
        <div className="h-full rounded-[2px]" style={{ width: `${s.pct}%`, backgroundColor: BLUE }} />
      </div>
      <span className="w-[190px] shrink-0 text-right text-[14px] font-medium" style={{ color: '#545767' }}>
        {s.convoCount} convo · {s.pct}% · {s.revenue}
      </span>
    </div>
  )
}

function CustomerRow({ a }: { a: AffectedCustomer }) {
  return (
    <div className="flex items-center gap-3 border-b border-solid py-3" style={{ borderColor: '#e4e7f0' }}>
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#e8e9eb' }}>
        <span className="text-[11px] font-semibold" style={{ color: '#373a4d' }}>{a.name[0]}</span>
      </div>
      <span className="text-[14px]" style={{ color: '#000' }}>{a.name}</span>
      <span className="flex h-[22px] items-center rounded-full px-2" style={{ backgroundColor: '#e8e9eb' }}>
        <span className="text-[11px] font-semibold" style={{ color: '#373a4d' }}>{a.plan}</span>
      </span>
      <span className="text-[14px] font-medium" style={{ color: '#545767' }}>Renewal date - {a.renewalDate}</span>
      <span className="ml-auto text-[14px]" style={{ color: '#000' }}>{a.arrLabel}</span>
    </div>
  )
}

function CustomerSegment({ d }: { d: OpportunityDetail }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <User size={22} color={INK} />
        <h2 className="text-[20px] font-semibold" style={{ color: INK }}>Customer segment</h2>
      </div>
      <div className="flex flex-col gap-4">
        {d.segments.map((s) => <SegmentBar key={s.key} s={s} />)}
      </div>
      <p className="mt-6 text-[14px]" style={{ color: '#000' }}>
        {d.affectedCustomers.length} customers affected <span style={{ color: '#a6a9b2' }}>•</span> churn risk
      </p>
      <div className="mt-2">
        {d.affectedCustomers.map((a) => <CustomerRow key={a.id} a={a} />)}
      </div>
    </div>
  )
}

// Right rail --------------------------------------------------------------
function SuggestedAction({ d }: { d: OpportunityDetail }) {
  const [integration, setIntegration] = useState<PmIntegration>(() => loadPmIntegration())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const toolLabel = integration.tool ? PM_TOOL_LABEL[integration.tool] : null

  const connect = (tool: PmTool) => {
    const next: PmIntegration = { connected: true, tool }
    setIntegration(next)
    persistPmIntegration(next)
    setPickerOpen(false)
  }

  return (
    <div
      className="relative flex flex-col gap-4 rounded-2xl border border-solid p-6"
      style={{
        borderColor: '#f2f4f7',
        backgroundImage:
          'linear-gradient(132deg, rgba(255,179,147,0.15) 0%, rgba(171,213,250,0.15) 50%, rgba(18,166,180,0.15) 100%)',
      }}
    >
      <p className="text-[14px] font-semibold" style={{ color: '#000' }}>Suggested action</p>
      <p className="text-[14px] leading-[20px]" style={{ color: '#293239' }}>{d.suggestedAction}</p>

      {/* Add to {tool} — reuses the mock connect flow */}
      {integration.connected && toolLabel ? (
        <button
          onClick={() => setAdded(true)}
          disabled={added}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-solid outline-none disabled:opacity-70"
          style={{ borderColor: '#b8b7b5', backgroundColor: added ? `${GREEN}14` : 'transparent' }}
        >
          {added ? <Check size={16} color={GREEN} /> : <Plug size={16} color="#293239" />}
          <span className="text-[14px] font-semibold" style={{ color: added ? GREEN : '#293239' }}>
            {added ? 'Added ✓' : `Add to ${toolLabel}`}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-solid outline-none"
          style={{ borderColor: '#b8b7b5' }}
        >
          <Plug size={16} color="#293239" />
          <span className="text-[14px] font-semibold" style={{ color: '#293239' }}>Connect a tool to add</span>
        </button>
      )}
      {pickerOpen && !integration.connected && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setPickerOpen(false)} />
          <div className="absolute left-6 right-6 top-[150px] z-[61] rounded-xl border border-solid bg-white py-1.5 shadow-[0px_16px_24px_0px_rgba(10,13,14,0.16)]" style={{ borderColor: BORDER }}>
            {PM_TOOLS.map((t) => (
              <button key={t.key} onClick={() => connect(t.key)} className="flex w-full items-center gap-2 px-3 py-2 text-left outline-none hover:bg-[#f5f5f4]">
                <Plug size={14} color={MUTED} />
                <span className="text-[13px] font-normal" style={{ color: INK }}>{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <button className="flex h-10 w-full items-center justify-center rounded-full outline-none" style={{ backgroundColor: '#313131' }}>
        <span className="text-[14px] font-semibold text-white">Generate fix</span>
      </button>
    </div>
  )
}

function LinkedItems({ d }: { d: OpportunityDetail }) {
  const [dismissed, setDismissed] = useState(false)
  const show = d.linkedSuggestion && !dismissed
  return (
    <div className={`${CARD} p-6`} style={{ borderColor: '#f2f4f7' }}>
      <p className="text-[14px] font-semibold" style={{ color: '#000' }}>Linked items</p>
      {show ? (
        <div className="relative mt-4 rounded-[12px] p-5" style={{ backgroundColor: '#fff3e4' }}>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full outline-none"
          >
            <X size={14} color="#293239" />
          </button>
          <p className="text-[14px] font-semibold" style={{ color: '#293239' }}>Possible related issue</p>
          <p className="mt-2 text-[14px] leading-[20px]" style={{ color: '#293239' }}>
            {d.linkedSuggestion!.ref} {d.linkedSuggestion!.text}
          </p>
          <button className="mt-1 text-[14px] font-semibold underline outline-none" style={{ color: '#293239' }}>Link to it</button>
        </div>
      ) : (
        <p className="mt-10 text-center text-[14px]" style={{ color: '#848f99' }}>No issues linked yet</p>
      )}
    </div>
  )
}

function LifecycleTimeline({ d }: { d: OpportunityDetail }) {
  return (
    <div className={`${CARD} p-6`} style={{ borderColor: '#f2f4f7' }}>
      <p className="text-[14px] font-semibold" style={{ color: '#000' }}>Lifecycle</p>
      <div className="relative mt-4 flex flex-col gap-6 pl-2">
        {d.timeline.map((node) => {
          const current = node.stage === d.opp.stage
          const done = node.dateLabel !== null
          const dot = current || done ? GREEN : '#d2d3d8'
          return (
            <div key={node.stage} className="flex items-center gap-5">
              <span
                className="size-4 shrink-0 rounded-lg border-2 border-white"
                style={{ backgroundColor: dot }}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-medium" style={{ color: current ? '#313131' : '#706f6e' }}>
                  {LIFECYCLE_LABEL[node.stage]}
                </span>
                <span className="text-[11px]" style={{ color: '#313131' }}>{node.dateLabel ?? '--'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Root --------------------------------------------------------------------
export function OpportunityDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const detail = getOpportunityDetail(id)

  if (!detail) {
    return (
      <div data-testid="screen-opportunity-detail" className="flex h-full flex-col items-center justify-center gap-3 rounded-[26px] bg-white">
        <p className="text-[16px] font-semibold" style={{ color: INK }}>Opportunity not found</p>
        <Link to="/" className="text-[14px] font-semibold underline" style={{ color: BLUE }}>Back to Home</Link>
      </div>
    )
  }

  const { opp } = detail

  return (
    <div data-testid="screen-opportunity-detail" className="h-full overflow-y-auto rounded-[26px] bg-white">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-solid px-10" style={{ borderColor: '#f3f1ef' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 outline-none"
        >
          <ArrowLeft size={20} color="#01567a" />
          <span className="text-[14px] font-semibold" style={{ color: '#01567a' }}>Product recommendations</span>
        </button>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-10 py-8">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-semibold" style={{ color: '#000' }}>{opp.title}</h1>
            <TypeTag type={opp.type} />
            <StageBadge stage={opp.stage} />
          </div>

          <div className="mt-4">
            <StatsStrip d={detail} />
          </div>

          <Divider />
          <Narrative d={detail} />
          <Divider />
          <Conversations d={detail} />
          <Divider />
          <CustomerSegment d={detail} />
        </div>

        {/* Right rail */}
        <div className="flex w-[320px] shrink-0 flex-col gap-3">
          <SuggestedAction d={detail} />
          <LinkedItems d={detail} />
          <LifecycleTimeline d={detail} />
        </div>
      </div>
    </div>
  )
}
```

Note on unused import guard: ensure every icon imported at the top is actually used (`ArrowLeft, ArrowUpRight, ArrowDownRight, Check, Clock, Lightbulb, MessageSquare, Plug, Sparkles, TrendingUp, TrendingDown, User, X`). If `tsc` flags any as unused, remove it. `Clock`, `Sparkles`, `TrendingUp`, `TrendingDown` may be unused in the code above — **remove any icon the final code does not reference** before running tsc. Likewise `INK_SOFT`/`PURPLE` from `pm-ui` — drop from the import if unreferenced.

- [ ] **Step 4: Register the route in `routes.tsx`**

Add the import near the other home import:

```tsx
import { OpportunityDetailScreen } from '@/features/home/OpportunityDetailScreen'
```

Add the route as a child of `AppLayout` (next to the `tools` route, before `...placeholderRoutes`):

```tsx
{ path: 'opportunity/:id', element: <OpportunityDetailScreen /> },
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/features/home/OpportunityDetailScreen.test.tsx && npx tsc --noEmit`
Expected: PASS, tsc exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/OpportunityDetailScreen.tsx src/features/home/OpportunityDetailScreen.test.tsx src/routes.tsx
git commit -m "feat(pm): opportunity detail (L3) screen + /opportunity/:id route"
```

---

### Task 5: Wire feed cards + spotlight rows to the detail route

Make the dashboard entry points navigate to the detail page.

**Files:**
- Modify: `src/features/home/PmDashboard.tsx`
- Test: `src/features/home/PmDashboard.test.tsx`

**Interfaces:**
- Consumes: `Link` from `react-router`; `oppId` (Task 2); `/opportunity/:id` route (Task 4).
- Produces: feed `OpportunityCard` title/donut region and mapped spotlight rows render as `<Link>`s.

- [ ] **Step 1: Update `PmDashboard.test.tsx` to render inside a router + assert links**

At the top, add the router import and wrap `renderPm`:

```tsx
import { MemoryRouter } from 'react-router'
```

Change `renderPm` to wrap the tree:

```tsx
function renderPm(editing = false) {
  const onMove = vi.fn()
  const onRemove = vi.fn()
  render(
    <MemoryRouter>
      <DndProvider backend={HTML5Backend}>
        <PmDashboard pmLayout={[...DEFAULT_PM_LAYOUT]} editing={editing} onMove={onMove} onRemove={onRemove} />
      </DndProvider>
    </MemoryRouter>,
  )
  return { onMove, onRemove }
}
```

Add two new tests:

```tsx
it('feed cards link to the opportunity detail route', () => {
  renderPm()
  const feed = screen.getByTestId('pm-feed')
  const samlLink = within(feed).getByRole('link', { name: /SAML SSO drops users/i })
  expect(samlLink).toHaveAttribute('href', '/opportunity/o1')
})

it('mapped spotlight rows link to detail; unmapped rows do not', async () => {
  const user = userEvent.setup()
  renderPm()
  const spotlight = screen.getByTestId('pm-spotlight')
  // Trending default: SCIM row (t3 → o2) is a link; Android crash (t1) is not.
  const scimLink = within(spotlight).getByRole('link', { name: /SCIM auto-provisioning/i })
  expect(scimLink).toHaveAttribute('href', '/opportunity/o2')
  expect(within(spotlight).queryByRole('link', { name: /Android 15 app crashes/i })).toBeNull()
})
```

- [ ] **Step 2: Run to confirm the new tests fail**

Run: `npx vitest run src/features/home/PmDashboard.test.tsx`
Expected: the two new tests FAIL (no links yet); existing tests PASS (router wrapper is benign).

- [ ] **Step 3: Make the feed card link**

In `PmDashboard.tsx`, add `Link` to the `react-router` imports (add a new import line near the top — there is no existing `react-router` import in this file yet):

```tsx
import { Link } from 'react-router'
```

In `OpportunityCard`, wrap the **content region** (donut + tags + title + description + quote + metrics) in a `<Link>` while leaving the action-button row (`Connect`/`Add`/`View`/`Generate fix`) as a sibling. Concretely, the current structure is:

```
<div card>
  <div donut />
  <div content>
     ...tags/title/desc/quote/metrics...
     <div action-buttons />
  </div>
</div>
```

Restructure so the action row is NOT inside the link. Replace the `OpportunityCard` return with:

```tsx
  return (
    <div className={`rounded-2xl border border-solid p-4 ${viewMode === 'grid' ? '' : 'flex gap-4'}`} style={{ borderColor: BORDER, backgroundColor: '#fff' }}>
      <Link
        to={`/opportunity/${opp.id}`}
        className={`group block outline-none ${viewMode === 'grid' ? '' : 'flex flex-1 gap-4'}`}
      >
        <div className={viewMode === 'grid' ? 'mb-3 flex items-center gap-3' : 'shrink-0'}>
          <ImpactDonut value={opp.impact} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeTag type={opp.type} />
            <StageBadge stage={opp.stage} />
          </div>
          <p className="mt-2 text-[14px] font-semibold leading-[19px] group-hover:underline" style={{ color: INK }}>{opp.title}</p>
          <p className="mt-1 text-[12px] font-normal leading-[17px]" style={{ color: INK_SOFT }}>{opp.description}</p>
          <div className="mt-2.5 rounded-lg border-l-2 py-1.5 pl-2.5" style={{ borderColor: BORDER, backgroundColor: '#faf9f8' }}>
            <p className="text-[12px] font-normal italic leading-[17px]" style={{ color: MUTED }}>“{opp.quote}”</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold" style={{ color: INK }}>{opp.revenue}</span>
              <span className="flex h-[18px] items-center rounded-full px-1.5" style={{ backgroundColor: `${revColor}18` }}>
                <span className="text-[10px] font-semibold" style={{ color: revColor }}>{opp.revenueState === 'at-risk' ? 'At risk' : 'Asking'}</span>
              </span>
            </span>
            <span className="flex items-center gap-0.5" style={{ color: volColor }}>
              {opp.volumeUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span className="text-[12px] font-semibold">{opp.volumePct}</span>
            </span>
            <span className="flex items-center gap-1" style={{ color: MUTED }}>
              <Users size={13} />
              <span className="text-[12px] font-normal">{opp.customers} customers</span>
            </span>
            {opp.plans.map((p) => (
              <span key={p} className="flex h-[18px] items-center rounded-md px-1.5" style={{ backgroundColor: '#f2f1ef' }}>
                <span className="text-[11px] font-normal" style={{ color: INK }}>{p}</span>
              </span>
            ))}
            <span className="text-[11px] font-normal" style={{ color: MUTED }}>{opp.firstSeenLabel}</span>
          </div>
        </div>
      </Link>
      {/* Action row — sibling of the link so its buttons don't trigger navigation */}
      <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-3' : 'mt-3 basis-full'}`}>
        {integration.connected && toolLabel ? (
          <button
            onClick={() => onAdd(opp.id)}
            disabled={added}
            className="flex h-8 items-center gap-1.5 rounded-full px-3.5 outline-none disabled:opacity-70"
            style={{ backgroundColor: added ? `${GREEN}18` : INK }}
          >
            {added ? <Check size={13} color={GREEN} /> : <Plug size={13} color="#fff" />}
            <span className="text-[12px] font-semibold" style={{ color: added ? GREEN : '#fff' }}>
              {added ? 'Added ✓' : `Add to ${toolLabel}`}
            </span>
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="flex h-8 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none"
            style={{ borderColor: BORDER }}
          >
            <Plug size={13} color={INK} />
            <span className="text-[12px] font-semibold" style={{ color: INK }}>Connect a tool to add</span>
          </button>
        )}
        <button className="flex h-8 items-center rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }}>
          <span className="text-[12px] font-semibold" style={{ color: INK }}>View in {toolLabel ?? 'Jira'}</span>
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }}>
          <Sparkles size={13} color={PURPLE} />
          <span className="text-[12px] font-semibold" style={{ color: INK }}>Generate fix</span>
        </button>
      </div>
    </div>
  )
```

(The outer flex `${viewMode === 'grid' ? '' : 'flex gap-4'}` on the card now wraps a link that itself carries the row layout; the action row uses `basis-full` in list mode so it drops below. This preserves the two visual modes without regressing the existing view-toggle test.)

- [ ] **Step 4: Make mapped spotlight rows link**

`SpotlightRowShell` currently renders a `<div>`. Give it an optional `oppId` and render a `<Link>` wrapper around the whole row when present. Update its signature and body:

```tsx
function SpotlightRowShell({
  rank, title, meta, right, first, oppId,
}: {
  rank: number; title: string; meta: string; right: ReactNode; first: boolean; oppId?: string
}) {
  const inner = (
    <div className="flex items-center gap-3 py-3" style={{ borderTop: first ? 'none' : `1px solid ${BORDER}` }}>
      <span className="w-6 shrink-0 text-[15px] font-semibold" style={{ color: MUTED }}>{rank}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-[18px]" style={{ color: INK }}>{title}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium" style={{ color: MUTED }}>{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{right}</div>
    </div>
  )
  if (oppId) {
    return <Link to={`/opportunity/${oppId}`} className="block outline-none hover:bg-[#faf9f8]">{inner}</Link>
  }
  return inner
}
```

Then thread `oppId={item.oppId}` through `TrendingRows`, `AtRiskRows`, and `AskingRows` (each maps `item` → `<SpotlightRowShell ... oppId={item.oppId} />`).

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/features/home/PmDashboard.test.tsx && npx tsc --noEmit`
Expected: PASS (including the two new link tests + all existing tab/filter/connect/edit tests), tsc exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/PmDashboard.tsx src/features/home/PmDashboard.test.tsx
git commit -m "feat(pm): link feed cards and spotlight rows to opportunity detail"
```

---

### Task 6: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full suite (scoped to real source, excluding sibling worktrees)**

Run: `npx vitest run --exclude '**/.claude/**' --exclude '**/node_modules/**' && npx tsc --noEmit`
Expected: all test files pass, tsc exit 0.

- [ ] **Step 2: Manual smoke (optional, if a dev server is running)**

Generate a PM view → click the SCIM feed card → confirm `/opportunity/o2` renders with Impact 78, Volume 164, connect flow, dismissable alert, and the back button returns to Home.

- [ ] **Step 3: No commit** (verification task). If any regression surfaced, fix under the owning task and re-commit there.

---

## Self-Review

**Spec coverage:** route (T4) ✓, both triggers (T5) ✓, all 3 opportunities with full data (T3) ✓, SCIM Figma-exact (T3) ✓, Add-to-Jira reuse + dismiss + back working / others no-op (T4) ✓, shared-primitive extraction (T1) ✓, spotlight `oppId` (T2) ✓, tests wrap in router (T4/T5) ✓, copy-mismatch resolved by SCIM-coherent narrative (T3) ✓.

**Placeholder scan:** no TBD/TODO; every code step shows complete code; test code is concrete.

**Type consistency:** `OpportunityDetail`/`DetailSegment`/`AffectedCustomer`/`DetailConversation`/`NarrativeRun`/`TimelineNode` defined in T3 and consumed unchanged in T4; `getOpportunityDetail`/`LIFECYCLE_ORDER` names match; `oppId` added in T2 and read in T5; `ImpactDonut`/`StageBadge`/`TypeTag` signatures identical across T1 producers and T4/T5 consumers.
