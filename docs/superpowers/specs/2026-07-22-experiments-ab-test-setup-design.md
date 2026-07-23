# Experiments — A/B Test Setup Screen — Design Spec

**Date:** 2026-07-22
**Figma frame:** `756:86465` ("06 Experiments expanded" — Setup tab)
**Status:** Approved (design), pending implementation

## Goal

Wire the existing inert "Create new" button on the Experiments → A/B Test list
(`/experiments`) to a full-page **A/B Test Setup** screen at `/experiments/new`,
where a user configures a new A/B test. The screen is presentational (local input
state only; no backend, no shared store) — it matches the current Experiments
feature architecture, where `EXPERIMENTS` is a static module constant.

## Scope decisions (confirmed with user)

- **Entry:** full-page route `/experiments/new`, rendered like
  `AutomationDetailScreen` (`/orchestrator/:id`) — a full-height rounded card,
  NOT a modal. "Create new" navigates there; a back arrow + "Close" returns to
  `/experiments`.
- **Tabs:** Setup only. The header's four tabs (Setup / Results / Agents /
  Conversations) render as a pill tab group with **Setup** active; the other
  three are inert (non-navigating, muted). No tab bodies for the other three.
- **Behavior:** Presentational. Inputs are controlled local state. Save / "Run
  A/B Test" / Close all just `navigate('/experiments')`. The list stays the
  static mock — no new row is added.
- **Summary panel:** Include as shown — the right-side Summary (Control / Variant
  A descriptions with badges + "View version" links) and Recommendations card
  ("Test duration: 2 weeks" + rationale + "Apply"), all static/presentational.

## Architecture

React 19 + Vite + TS (strict). React Router v7 (`react-router`). Tailwind v4
semantic token classes + inline hex for one-off brand colors (matching the
existing Experiments components — `StatusBadge`, `TrafficSplitBar` use inline
hex). lucide-react icons. No new dependencies.

New route is a sibling of the existing `{ path: 'experiments' }` entry, added to
the `BUILT` set so it does not fall through to `PlaceholderScreen`.

## File structure

```
src/features/experiments/
  experiments-data.ts          MODIFY — add Setup screen static constants + types
  ExperimentsScreen.tsx        MODIFY — wire "Create new" → navigate('/experiments/new')
  setup/
    ExperimentSetupScreen.tsx  CREATE — screen shell: top bar (back, title, tabs, Run), two-column body
    SetupSection.tsx           CREATE — collapsible section wrapper (icon + title + subtitle + chevron + children)
    VariantRow.tsx             CREATE — one variant row (badge + description + agent dropdown + Traffic field)
    SummaryPanel.tsx           CREATE — right-side Summary + Recommendations (static)
    Field.tsx                  CREATE — shared labeled text input / textarea / static dropdown primitives
src/routes.tsx                 MODIFY — import + BUILT + route entry for /experiments/new
```

Tests (Vitest + RTL, jsdom) alongside each new component, plus a route test.

## Data model (experiments-data.ts additions)

```ts
// Static, presentational seed data for the A/B Test Setup screen.

export type SetupVariant = {
  key: string          // 'control' | 'variant-a' | ...
  badge: string        // 'Control' | 'Variant A'
  badgeColor: string   // '#01567a' | '#e05c34'
  description: string  // helper text beside the badge
  agent: string        // selected agent dropdown value
  traffic: number      // percent, e.g. 50
}

export type SummaryVariant = {
  badge: string
  badgeColor: string
  title: string        // 'Manual login'
  body: string         // long description paragraph
}

export type Recommendation = {
  title: string        // 'Test duration: 2 weeks'
  body: string
}

export const SETUP_VARIANTS: SetupVariant[]        // Control (#01567a, 50%), Variant A (#e05c34, 50%)
export const WINNER_METRICS: string[]              // ['Deflection', 'Sentiment'] (selected chips)
export const METRIC_OPTIONS: string[]              // dropdown option labels (presentational)
export const CHANNEL_OPTIONS: string[]             // ['Widget', ...]
export const TIME_ZONE = 'Pacific time GTM -8, Los Angeles'
export const SUMMARY_VARIANTS: SummaryVariant[]    // Control 'Manual login', Variant A 'Fully automated login assistance'
export const RECOMMENDATION: Recommendation        // 'Test duration: 2 weeks' + rationale
```

Exact copy from the frame:
- Control summary title `Manual login`; body: "All login-related tickets are
  routed to the Authentication Support queue and handled entirely by human
  agents. They manually verify user identities, reset passwords, and resolve
  access issues. Automation is limited to basic confirmation messages."
- Variant A summary title `Fully automated login assistance`; body: "An AI-driven
  system identifies and resolves most login issues automatically through chat or
  self-service. Users can reset passwords, unlock accounts, or recover
  credentials without agent help. Only complex or security-sensitive cases are
  escalated to support."
- Recommendation title `Test duration: 2 weeks`; body: "This duration captures
  both weekday and weekend user behavior, ensuring enough data to reach
  statistically meaningful results for deflection and CSAT metrics."
- Control variant helper: "The current live agent that acts as the baseline."
  Variant A helper: "The new agent you want to test against the control."
- Section subtitles: "Define the test's purpose and context." / "Set up your
  control and test variants." / "Define how success is measured and when the
  test ends."

## Screen layout (ExperimentSetupScreen.tsx)

Root: `data-testid="screen-experiment-setup"`, `flex h-full flex-col
overflow-hidden rounded-[26px] bg-white` (mirrors `AutomationDetailScreen`).

**Top bar** — `flex items-center gap-3 border-b border-surface-border px-6 py-3`:
- Back arrow (`ArrowLeft`, 18, `aria-label="Back to Experiments"`, → `/experiments`)
- Title: the current Test name value (default "Login fix method comparison"),
  `text-[15px] font-semibold text-ink`
- Overflow `⋯` (`MoreHorizontal`, muted, inert, `aria-label="Test options"`)
- Centered pill tab group (`mx-auto ... rounded-full bg-[#f5f6f7] p-1`), tabs
  Setup / Results / Agents / Conversations; Setup active
  (`bg-white font-medium text-ink shadow-sm`), rest muted + inert
- Right: **Run A/B Test** dark pill (`rounded-full bg-ink px-4 py-2 text-[14px]
  font-medium text-white`, → `/experiments`)

**Body** — `min-h-0 flex-1 overflow-y-auto`, inner `flex gap-6 px-8 py-6`:
- Left column (`flex-1 max-w-[620px]`) — the three form sections, separated by
  `<hr className="border-surface-border" />`.
- Right column (`w-[360px] shrink-0`) — `<SummaryPanel />`.

### Section 1 — A/B Test detail (SetupSection)
- Test name — text input, default "Login fix method comparison", controlled;
  editing updates the top-bar title.
- Description — textarea, default "Explore which login troubleshooting experience
  leads to the highest user satisfaction."
- Channel — static dropdown field, placeholder/value "Widget".

### Section 2 — Agent and variants (SetupSection)
- Total Traffic field (value "100", suffix "%") + a presentational track/highlight
  slider bar with 0% / 100% end labels (static, non-interactive — reuse the
  stacked-bar visual language; a simple two-div track + highlight is sufficient).
- `SETUP_VARIANTS.map` → `<VariantRow />` (Control, Variant A).
- "Add variant" button — pill `bg-[#ebf5f7] text-[#193d50]` with a plus icon;
  inert (presentational).

### Section 3 — Winner & Test end (SetupSection)
- "Choose the metric used to determine the winner" — static dropdown field.
- Selected metric chips: Deflection, Sentiment (`bg-[#f2f4f7] border-[#d2d9e5]`).
- Time zone — static dropdown, value = `TIME_ZONE`.
- End condition — two-option toggle: **Fixed duration** (active,
  `bg-[#ebf5f7] border-[#01567a]`, stopwatch icon) / **Conversation count**
  (inactive, muted, messages icon). Local state toggle.
- Start date (`Sep 25, 2025`) + start time (`6:00 AM`) — static dropdown fields
  with a calendar glyph on the date.
- End date (`Oct 23, 2025`) + end time (`12:00 AM`) — same.

## SetupSection.tsx

```
props: { icon: ReactNode; title: string; subtitle: string; children: ReactNode;
         defaultOpen?: boolean }
```
Header row: icon + (title `text-[15px] font-semibold text-ink` / subtitle
`text-[12px] text-ink-muted`) on the left, collapse chevron (`ChevronDown`,
rotates when closed) on the right. Body renders `children` when open. Local
`open` state, `defaultOpen = true`. Chevron button has
`aria-expanded` + `aria-label`.

## VariantRow.tsx

```
props: { variant: SetupVariant }
```
Row: badge pill (`style={{ backgroundColor: variant.badgeColor }}`, white text)
+ helper description (`text-[12px] text-ink-muted`), then an agent dropdown
(static field showing `variant.agent`) and a small Traffic field (value
`variant.traffic`, suffix "%"). Presentational.

## SummaryPanel.tsx

Static. `rounded-[24px] border border-surface-border bg-white/80 p-5`
(shadow per frame). "Summary" heading (`text-[18px]`). A gradient card
(`linear-gradient(137deg, rgba(255,179,147,.15) 0%, rgba(171,213,250,.15) 50%,
rgba(18,166,180,.15) 100%)`, `border-surface-border rounded-[16px]`) containing
`SUMMARY_VARIANTS.map` → badge + title + body + "View version" link
(`text-[#01567a] underline`, inert). Then "Recommendations" label and a
recommendation card (`border-[#ffb393] rounded-[16px]`) with
`RECOMMENDATION.title` (semibold) + body + an "Apply" pill button (bordered,
inert).

## Field.tsx (shared primitives)

Small presentational primitives to avoid repetition:
- `TextField` — label + `<input>` (controlled via value/onChange props).
- `TextArea` — label + `<textarea>`.
- `SelectField` — label + a static dropdown-styled div (value text + chevron).
  Not a real `<select>` (consistent with the mock; no menu behavior).

Styling matches the frame: `rounded-[20px] border border-[#bcbdc5] bg-white
px-3.5 py-2 text-[14px]`; labels `text-[12px] font-medium text-ink`.

## Colors → tokens

| Frame value | Use |
|---|---|
| `#01567a` | Control badge, active toggle border, links, teal accents |
| `#e05c34` | Variant A badge |
| `#ebf5f7` | active toggle bg, Add-variant bg |
| `#193d50` | Add-variant text |
| `#f2f4f7` / `#d2d9e5` | metric chips |
| `#ffb393` | recommendation card border |
| gradient | summary gradient card |
| `bg-ink` | Run A/B Test pill (token) |
| `border-surface-border`, `text-ink`, `text-ink-muted` | chrome (tokens) |

Prefer tokens for chrome; inline hex only for the per-brand/accent one-offs above
— exactly the convention the existing Experiments components already follow.

## routes.tsx changes

- Import `ExperimentSetupScreen` from `@/features/experiments/setup/ExperimentSetupScreen`.
- Add `'/experiments/new'` to the `BUILT` set (so it never falls through to
  `PlaceholderScreen` — though `/experiments` is already built, adding the child
  path keeps the derivation honest).
- Add route entry `{ path: 'experiments/new', element: <ExperimentSetupScreen /> }`
  as a sibling of `{ path: 'experiments', element: <ExperimentsScreen /> }`.

## ExperimentsScreen.tsx change

Import `useNavigate`; change the "Create new" button to
`onClick={() => navigate('/experiments/new')}`. No other change.

## Testing

- `ExperimentSetupScreen.test.tsx` — renders under a memory router; asserts
  title, the four tab labels, the three section titles, "Run A/B Test", and that
  editing Test name updates the top-bar title. Scope with `within(getByTestId(
  'screen-experiment-setup'))`.
- `SetupSection.test.tsx` — renders title/subtitle/children; toggling the chevron
  hides/shows children; `aria-expanded` reflects state.
- `VariantRow.test.tsx` — renders badge, description, agent value, traffic value.
- `SummaryPanel.test.tsx` — renders "Summary", both summary variant titles,
  "Recommendations", recommendation title, "Apply".
- `experiments.routes.test.tsx` — extend: `/experiments/new` renders
  `screen-experiment-setup` and not "Coming soon"; and clicking "Create new" on
  `/experiments` navigates to it (or a direct route-render assertion).

## Out of scope

- Real dropdown menus / date pickers (static fields only).
- Results / Agents / Conversations tab content.
- Persisting the new test to the list (no shared store this round).
- Functional traffic slider drag.
