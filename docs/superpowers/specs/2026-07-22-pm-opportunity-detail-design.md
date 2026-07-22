# PM Opportunity Detail View (L3) — Design

**Date:** 2026-07-22
**Status:** Approved (pending spec review)
**Figma reference:** `Hackathon-2026` file, node `79:21469` (`https://www.figma.com/design/UUy67blU4SHOkM8EIlclSa/Hackathon-2026?node-id=79-21469`)

## Goal

When a PM selects an opportunity — from an Opportunity-feed card or a Spotlight row on the PM dashboard — open a full-page **L3 detail view** (`/opportunity/:id`) that explains a single product signal in depth: an Impact/Revenue/Volume/Customer-segment stats strip, a "What's happening" narrative (with reproduction steps for bugs), the customer conversations behind it, a per-tier customer-segment breakdown with the affected accounts, and a right rail (Suggested action with a mock Add-to-Jira flow, Linked items, and a lifecycle timeline).

## Context & constraints

- **Frontend-only.** No backend. All detail data is an in-memory deterministic mock (`pm-detail-data.ts`), same convention as `pm-data.ts`.
- **Determinism.** No `Date.now()` / `Math.random()`. Dates are literal display labels; anything relative reuses `PM_NOW` from `pm-data.ts`. Ids are literal.
- **TypeScript strict**, TS pinned to 5.9 (do not bump). No `baseUrl` in `tsconfig.json`.
- **React Router v7** — import from `react-router` (NOT `react-router-dom`). The route table is `src/routes.tsx`.
- **Tests:** Vitest + RTL (jsdom). Real-behavior assertions scoped with `within(getByTestId(...))`. Because the feed cards and spotlight rows become `<Link>`s, `PmDashboard` tests must render inside a router (`MemoryRouter`); the detail-screen test uses `createMemoryRouter` seeded with the `:id` param.
- **Tokens/palette:** reuse the inline dashboard hues already defined at the top of `PmDashboard.tsx` (`INK`, `INK_SOFT`, `MUTED`, `BORDER`, `BLUE`, `GREEN`, `AMBER`, `RED`, `PURPLE`). Do NOT reintroduce `font-['...']` arbitrary font-family classes — the Figma's `Plus_Jakarta_Sans` / `IBM_Plex_Mono` / `SF_Pro_Text` families map to the app's existing font stack; match sizes/weights, not the family.
- **Icons:** `lucide-react` (dashboard convention).

## Figma copy mismatch (resolved)

The Figma frame is a **composite**: its title, BUG/Detected tags, Impact donut (78), Revenue ($455K, At risk), and Volume (164) are the **SCIM** opportunity (feed `o2`), but the "What's happening" paragraph, the "Suggested reproduction steps", and the "Possible related issue" (PAY-1423 "Promo validation errors") are copy from an unrelated **promo-code billing bug**. We keep the **exact layout and all numeric values** shown in the frame, but author **SCIM-coherent copy** for the narrative/steps/linked-item so the page reads as one opportunity. This mirrors how `pm-data.ts` was transcribed. The other two opportunities (o1 SAML, o3 Bulk CSV) get coherent equivalents in the same shapes.

## How it integrates

### Route

A real route (mirrors the existing `orchestrator/:id → AutomationDetailScreen` precedent), added to `src/routes.tsx` inside the `AppLayout` children:

```tsx
{ path: 'opportunity/:id', element: <OpportunityDetailScreen /> },
```

- URL: `/opportunity/o2`. Not a `NAV_ITEM`, so the `placeholderRoutes` derivation (which maps over `NAV_ITEMS`) ignores it — same as `orchestrator/:id`.
- The screen reads `useParams<{ id: string }>()`, looks the id up in `PM_OPPORTUNITY_DETAILS`, and renders. It does **not** require the PM view to be the active Home view — deep-link safe.
- **Unknown id** → an "Opportunity not found" state with a back-to-Home link (no crash).
- **Back button** (`←` + "Product recommendations" breadcrumb) → `useNavigate()` → `navigate('/')`. Home restores the persisted active view (the PM view) from `localStorage`.

### Triggers (both resolve to the same opportunity id)

- **Feed cards** (`OpportunityCard` in `PmDashboard.tsx`): the donut + tags + title + description + quote + metrics region becomes a `<Link to={\`/opportunity/${opp.id}\`}>`. The **action-button row** (Add to {Tool} / View in {Tool} / Generate fix) is rendered as a **sibling outside** the `<Link>`, so those buttons keep working without needing `stopPropagation`.
- **Spotlight rows** (`SpotlightRowShell`): spotlight items gain an optional `oppId?: string`. A row whose item has an `oppId` renders as a `<Link to={\`/opportunity/${oppId}\`}>`; rows without one (Android 15, Salesforce sync, Dark mode — no matching feed opportunity) stay non-interactive `<div>`s. Mapping by product: Bulk CSV → `o3`, SCIM → `o2`, SAML SSO → `o1`.

## Data model (`pm-detail-data.ts`, new)

```ts
import { PM_NOW, type Opportunity, type LifecycleStageKey } from './pm-data'

// A revenue-weighted customer tier row (drives the stats-strip mini bars AND the
// big Customer-segment bars — the same three tiers, two visual densities).
export type DetailSegment = {
  key: string            // 'enterprise' | 'pro' | 'team'
  label: string          // 'Enterprise'
  convoCount: number     // 104
  pct: number            // 0-100, the horizontal bar fill
  revenue: string        // '$815K'
}

// An affected account row at the bottom of the customer-segment section.
export type AffectedCustomer = {
  id: string; name: string; plan: string   // 'Enterprise' | 'Pro' | ...
  renewalDate: string                        // 'Aug 15, 2026'
  arrLabel: string                           // '$140K ARR'
}

// A single customer conversation (quote card in the Conversations section).
export type DetailConversation = {
  id: string; quote: string
  customer: string; revenueLabel: string; plan: string   // 'Lime' / '$210K revenue' / 'Enterprise'
}

// One flowing run of the "What's happening" paragraph; bold runs are emphasized.
export type NarrativeRun = { text: string; bold?: boolean }

// A lifecycle timeline node in the right rail (4 nodes, ordered detected→shipped).
export type TimelineNode = { stage: LifecycleStageKey; dateLabel: string | null }

export type OpportunityDetail = {
  opp: Opportunity              // the base record (title, type, impact, revenue, stage, …)
  volumeCount: number           // 164 — the big Volume number (base Opportunity has only the trend array + pct)
  narrative: NarrativeRun[]     // "What's happening"
  reproSteps?: string[]         // bugs only
  suggestedAction: string       // right-rail body copy
  linkedSuggestion?: { ref: string; text: string }   // 'PAY-1423' / '"…" already exists.'
  timeline: TimelineNode[]      // 4 nodes; the node whose stage === opp.stage is "current"
  segments: DetailSegment[]     // Enterprise / Pro / Team
  affectedCustomers: AffectedCustomer[]
  totalConversations: number    // 142 ("View all 142 conversations")
  conversations: DetailConversation[]
}

export const PM_OPPORTUNITY_DETAILS: Record<string, OpportunityDetail>
```

- Keyed by `o1`, `o2`, `o3`. Each detail's `.opp` is the **same object** imported/derived from `PM_DATA.opportunities` (single source of truth for title/impact/revenue/stage) — the detail record carries only the *extra* fields. (Implementation: import `PM_DATA` and index its opportunities by id, then attach the extra fields, OR duplicate the base — the plan will pick one; single-source-by-lookup preferred to avoid drift.)
- **SCIM (`o2`)** values transcribed from the Figma: Impact 78, Revenue $455K At-risk, Volume 164 (+80% up, red/bad), segments Enterprise (104 convo, 80%, $815K) / Pro (54 convo, 55%, $710K) / Team (35 convo, 40%, $650K), affected customers Active Campaign (Enterprise, renewal Aug 15 2026, $140K ARR) / Lime (Pro, Sep 15 2026, $86K) / Acorns (Pro, Aug 1 2026, $60K), 3 customers affected · churn risk, 142 total conversations, two quote cards (Lime "Every 60 minutes our whole org gets kicked back to login. Killing adoption with 400 seats." · $210K · Enterprise; Acorns "Refresh silently fails and we lose unsaved work." · $60K · Pro), timeline Detected=Jun 15, Planned/In development/Shipped = `--` (null), suggested-action copy about connecting an identity provider and syncing with Jira, linked suggestion PAY-1423-style "possible related issue". Narrative + repro steps rewritten to be SCIM-coherent.

## Layout (single scroll page)

Desktop two-region layout: a wide **main column** (~2fr) and a **fixed-ish right rail** (~320px), inside the app content area (no new chrome — the existing `AppLayout` top bar/rail stay). Sections top-to-bottom:

**Header row (main):** back arrow + "Product recommendations" breadcrumb (the whole thing is the back control). Below it: the opportunity **title** (24px semibold), a **type tag** (BUG red / REQUEST blue, reusing the feed's `TypeTag` idea) and the **stage badge** (reuse `StageBadge` from `PmDashboard` — see "Shared pieces").

**Stats strip (main):** a bordered rounded card, four cells separated by vertical rules:
1. **Impact donut** (reuse `ImpactDonut` from `PmDashboard`) with "Impact" caption.
2. **Revenue**: label + "At risk"/"Asking" chip, big value ($455K), and a two-segment proportional bar (filled = at-risk portion).
3. **Volume • 10 wk**: big count (164) + trend chip (↑ 80%, colored by `volumeGood`), plus small % gridline labels (80/50/30) — render as a compact stat, the sparkline detail is optional/decorative.
4. **Customer segment**: three small tier badges (Enterprise/Pro/Team) as a legend.

**What's happening (main):** a bulb icon + "What's happening" heading, the `narrative` paragraph (bold runs emphasized), then a bordered "Suggested reproduction steps" block (ordered list) **only when `reproSteps` present** (bugs).

**Conversations (main):** divider, a chat icon + "Conversations" heading + a "View all {totalConversations} conversations" pill (no-op). Then the `conversations` quote cards (light-blue `#f5faff` background, italic quote, customer • revenue • plan meta, "View conversation" link no-op).

**Customer segment (main):** divider, a user icon + "Customer segment" heading. Three tier rows (label + long two-tone proportional bar + "N convo · P% · $rev"). Below: an avatar stack + "3 customers affected · churn risk", then the affected-customer rows (logo/name + plan badge + renewal date + ARR, right-aligned).

**Right rail:**
- **Suggested action** card (subtle diagonal gradient background, matching the Figma's `linear-gradient(...rgba(255,179,147,.15) → rgba(171,213,250,.15) → rgba(18,166,180,.15))`): heading, `suggestedAction` body, an **Add to {Tool}** button (connect flow, see Interactivity) and a dark **Generate fix** button (no-op).
- **Linked items** card: heading; a dismissable warning alert (`linkedSuggestion`) — "Possible related issue", the `ref` + text, a "Link to it" no-op link, and a working ✕ dismiss. When dismissed (or no `linkedSuggestion`) show "No issues linked yet".
- **Lifecycle** card: heading + the 4-node vertical `timeline`; the current node (stage === `opp.stage`) is filled/emphasized, later nodes are hollow with `--` when `dateLabel` is null.

## Interactivity

- **Add to {Tool}** (right rail): reuses `pm-integration.ts` (`loadPmIntegration` / `persistPmIntegration` / `PM_TOOLS` / `PM_TOOL_LABEL`). Local component state seeded from `loadPmIntegration()`. Not connected → button opens the `PM_TOOLS` picker (same scrim + dropdown pattern as the feed); selecting a tool connects (persist) and marks this opportunity added. Connected & not added → "Add to {Tool}". Added → "Added ✓" (in-memory, not persisted — acceptable for a mock, same as the feed's added set).
- **Dismiss linked item**: the alert's ✕ sets local `linkedDismissed = true`, hiding the alert → "No issues linked yet".
- **Back button**: `navigate('/')`.
- **Presentational no-ops** (styled, no handler / no-op handler): Generate fix, View conversation, Link to it, "View all N conversations". Matches the `AiStudioPanel` composer convention.

## Shared pieces (avoid duplication)

`ImpactDonut`, `StageBadge` (+ `STAGE_COLOR`), and the type/`TypeTag` treatment currently live **inside** `PmDashboard.tsx` as module-private functions. The detail screen needs `ImpactDonut` and `StageBadge`. To reuse without a circular import or copy-paste, **extract `ImpactDonut`, `StageBadge`, `STAGE_COLOR`, and the palette constants into a small `pm-ui.tsx`** (or `pm-shared.tsx`) module that both `PmDashboard.tsx` and `OpportunityDetailScreen.tsx` import. The plan will do this extraction as its first task (pure move + re-import; existing `PmDashboard` tests stay green), so later tasks build on shared primitives rather than duplicating them. `TypeTag` is small; the detail can reuse it via the same module or re-derive a local tag — plan's choice, but prefer sharing.

## Files

- **Create** `src/features/home/pm-ui.tsx` — extracted shared primitives: palette consts, `ImpactDonut`, `StageBadge`, `STAGE_COLOR`, `TypeTag`.
- **Modify** `src/features/home/PmDashboard.tsx` — import the shared primitives from `pm-ui.tsx` (remove the local copies); wrap feed cards + eligible spotlight rows in `<Link>`; keep action buttons outside the card link.
- **Create** `src/features/home/pm-detail-data.ts` — `OpportunityDetail` types + `PM_OPPORTUNITY_DETAILS` (o1/o2/o3).
- **Create** `src/features/home/pm-detail-data.test.ts` — invariants (every feed opp id has a record; timeline is 4 ordered stages; the current node's stage === `opp.stage`; segments non-empty; well-formed).
- **Create** `src/features/home/OpportunityDetailScreen.tsx` — the L3 page.
- **Create** `src/features/home/OpportunityDetailScreen.test.tsx` — render by id (title/impact present), unknown id → not-found, back nav, Add-to-{Tool} connect→added, dismiss alert.
- **Modify** `src/features/home/pm-data.ts` — add optional `oppId?: string` to `TrendingItem` / `AtRiskItem` / `AskingItem`; populate `oppId` on the Bulk CSV / SCIM / SAML rows (trending t2→o3, t3→o2; atRisk r1→o1, r2→o3, r3→o2; asking a2→o2). Rows without a matching feed opportunity keep `oppId` undefined.
- **Modify** `src/features/home/pm-data.test.ts` — assert the mapped rows point at real opportunity ids.
- **Modify** `src/features/home/PmDashboard.test.tsx` — wrap renders in `MemoryRouter`; assert clicking a feed card / mapped spotlight row navigates to `/opportunity/:id` (e.g. via a `MemoryRouter` + a location-probe route, or asserting the rendered `href`).
- **Modify** `src/routes.tsx` — add `{ path: 'opportunity/:id', element: <OpportunityDetailScreen /> }`.

## Testing strategy

- **Pure data** (`pm-detail-data.test.ts`): every id in `PM_DATA.opportunities` has a detail; `timeline.length === 4` and ordered `detected, planned, in-dev, shipped`; exactly the node with `stage === opp.stage` is treated as current; `segments`/`affectedCustomers`/`conversations` non-empty; `volumeCount > 0`.
- **`pm-data.test.ts`**: each populated `oppId` exists in `PM_DATA.opportunities`.
- **Component** (`OpportunityDetailScreen.test.tsx`, `createMemoryRouter`): `/opportunity/o2` renders SCIM title + Impact 78; `/opportunity/bogus` → not-found; back link navigates to `/`; Add-to-tool picker → select Jira → button reads "Added ✓"; dismissing the linked-item alert hides it and shows "No issues linked yet".
- **`PmDashboard.test.tsx`**: rendered inside `MemoryRouter`; a feed card exposes `href="/opportunity/o1"` (or clicking navigates); a mapped spotlight row is a link, an unmapped one is not; existing spotlight-tab / feed-filter / connect tests stay green.
- Existing PM + grid + nav + org tests stay green.

## Out of scope

- Real Jira/Linear/Asana API or OAuth (mock only, reuses existing connect state).
- A real conversation viewer / "View all conversations" destination (no-op).
- Real "Generate fix" / "Link to it" behavior (no-ops).
- Editing/customizing the detail page (it is a fixed layout, not a widget grid).
- Persisting the per-opportunity "Added" state across reloads (in-memory, same as the feed).
- A volume sparkline chart on the stats strip (the Figma shows gridline labels; a decorative mini-line is optional, not required — a compact numeric stat is sufficient).
