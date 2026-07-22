# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **greenfield React + Vite + TypeScript front end** for the FT Unification console — an AI platform for customer support automation. This is the **foundation layer**: persistent chrome (navigation rail, expanded sidebar, top bar, org switching), real routing, design tokens, and feature screens (Home dashboard, Insights, Organization). It was rebuilt from a Figma Make prototype; all Figma Make artifacts have been removed, but the prototype is still used as a visual/behavioral reference (its source can be read via the Figma MCP `get_design_context` on the Make file, then `ReadMcpResourceTool`).

The **Home screen is a full mock dashboard** (`src/features/home/`): agent-health, notifications, approvals, knowledge gaps, QA, cost, activity, intents, and improved-policies widgets, with a Platform/Organization level toggle and drag-and-drop customization (react-dnd) persisted to `localStorage`. All data is mocked in `src/features/home/dashboard-data.ts` (no backend). The **Organization screen** has an `AiStudioPanel` (right-side assistant shell, header-toggled) and a decorative `OrgIllustration` (flora-glow SVG).

Product logic for the five planned products — **Solve, Triage, Assist, Discover, AI Studio** — is out of scope for this phase. Those nav destinations currently render a shared "Coming soon" placeholder. (The `AiStudioPanel` on the Organization screen is a small assistant-shell mock, not the full AI Studio product.)

## Commands

```bash
pnpm install
pnpm dev        # Vite dev server
pnpm build      # tsc -b && vite build
pnpm test       # vitest run
pnpm test:watch # vitest (watch mode)
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint  (see caveat below)
pnpm format     # prettier --write
```

If `pnpm` is not on PATH, the `npx` equivalents work: `npx vitest run`, `npx tsc --noEmit`, `npx vite build`.

**Lint caveat:** the project uses TypeScript **7.0.2**, which the installed `typescript-eslint` does not yet support — `pnpm lint` currently crashes with a parser error (`Cannot read properties of undefined (reading 'Cjs')`). This is an upstream toolchain gap, not a code issue. `typecheck`, `test`, and `build` are the reliable gates until `typescript-eslint` ships TS7 support (or the project pins TypeScript to a 5.x line).

## Architecture

### Navigation is URL-driven from a single source of truth
`src/app/nav-config.ts` is the one place nav is defined. It exports:
- `NAV_ITEMS: NavItem[]` — every item in order (`Home, Insights, AI Agents, Knowledge, Tools, Experiments, Orchestrator, Integrations, Log, Settings, Organization`), each `{ label, path, icon (NavIcon), submenu: string[] }`. The nav `icon`s are pixel-exact custom SVG components in `src/components/nav-icons.tsx` (ported from the Figma design for fidelity), not lucide — their shared prop type is `NavIcon`/`NavIconProps` in `src/types/index.ts`.
- `PRIMARY_NAV` = `NAV_ITEMS.slice(0, 10)`, `SECONDARY_NAV` = `NAV_ITEMS.slice(10)` (Organization).
- `findNavItemByPath(pathname)` — resolves the active item from the URL, including nested routes (e.g. `/insights/ai-performances` → Insights). Active nav state is **always derived from the URL**, never held in a `useState` string.

The rail, flyover, and expanded sidebar all render from this config — there is no duplicated nav list, and no fragile `nth-child` index math (the prototype's approach, now gone).

### Routing
React Router **v7** (`createBrowserRouter`). Everything imports from `react-router` (not `react-router-dom`). Route table: `src/routes.tsx`.
- `/` → Home (index)
- `/insights` → Insights, with nested `/insights/cx-journey` and `/insights/ai-performances` (index defaults to AI Performances)
- `/organization` → Organization dashboard; `/organization/new` → create-org flow
- Every other nav item (`/ai-agents`, `/knowledge`, `/tools`, `/experiments`, `/orchestrator`, `/integrations`, `/log`, `/settings`) → shared `PlaceholderScreen` ("Coming soon"). Placeholder routes are derived from `NAV_ITEMS` minus a `BUILT` set, so adding a real screen is a one-line change.

### App shell
`src/App.tsx` is thin: just `<RouterProvider>`. The persistent chrome lives in the layout route:
- `src/app/layout/AppLayout.tsx` — wraps the subtree in **one** `<OrgProvider>`, renders `TopBar` above `<Outlet/>`, and swaps between `Sidebar` (collapsed) and `ExpandedSidebar` based on local `isExpanded` state. Holds `selectedSub` state for expanded-sidebar submenu highlighting.
- `src/app/layout/Sidebar.tsx` — collapsed 64px icon rail + hover-intent flyover (via `useHoverIntent`) + expand toggle.
- `src/app/layout/ExpandedSidebar.tsx` — 234px expanded drawer with inline submenus and a collapse toggle.
- `src/app/layout/TopBar.tsx` — slim top bar hosting `OrgSwitcher` (left) and a static avatar/actions placeholder (right).
- `src/app/layout/OrgSwitcher.tsx` — org dropdown; "Add organization" navigates to `/organization/new`.
- `src/app/layout/useHoverIntent.ts` — open/close-with-delay hook shared by the flyover and the org dropdown.

**Provider placement matters:** `OrgProvider` is rendered inside `AppLayout` (the persistent layout route), so org state survives child-route navigation (e.g. create-org → dashboard). Do NOT add a second `OrgProvider` in `App.tsx` or `main.tsx` — that would shadow the layout's context.

### Org state
`src/app/org-context.tsx` exports `OrgProvider` and `useOrgs()` → `{ orgs, currentOrg, setCurrentOrg, addOrg(name, channels) }`. Seeded with SpaceX and Tesla. `addOrg` mints a **deterministic** id from a module `seq` counter (not `Date.now()`/`Math.random()`, which are unavailable/nondeterministic here) and sets the new org current.

### Feature screens (`src/features/`)
- `home/HomeScreen.tsx` — the full mock dashboard (widgets, level toggle, react-dnd edit mode). Mock data + widget/layout types live in `home/dashboard-data.ts`. Layout is persisted to `localStorage` (key `home-dashboard-layout-v2`); access is guarded (`window.localStorage?.`) so it degrades gracefully where the API is absent (e.g. jsdom tests).
- `insights/InsightsScreen.tsx` — surface with a nested `<Outlet/>`; sub-views `CxJourneyView.tsx` and `AiPerformancesView.tsx` are titled empty regions (the prototype had no real chart data — do not fabricate metrics).
- `organization/OrganizationScreen.tsx` — org table built from `useOrgs().orgs` (`OrgRow.tsx`, `ChannelChip.tsx`), with `OrgIllustration.tsx` (decorative flora-glow SVG) and a header-toggled `AiStudioPanel.tsx` (right-side assistant shell — presentational, no backend). `CreateOrgFlow.tsx` is the create form (`useOrgs().addOrg` then navigate back).

### Layout model: desktop-fluid
There is **no fixed canvas / `ScaledStage` / transform-scale** (the prototype's approach, removed). `AppLayout` is a full-height flex layout with a `min-w-[1024px]` floor; content fills available width fluidly. Target range is desktop (≥ ~1024px) — no mobile/tablet states.

### Styles & tokens
- `src/styles/index.css` — entry (imports fonts, Tailwind, `tw-animate-css`, theme).
- `src/styles/theme.css` — design tokens as CSS variables, exposed to Tailwind via `@theme inline`. Product tokens: `--color-app-backdrop`, `--color-nav-active`, `--color-ink`, `--color-ink-muted`, `--color-accent-blue`, `--color-surface-border`, plus a subset of raw Garden palette scales exposed as classes (`grey-200/400/500/700/800/1200`, `blue-700` — the canonical Flora accent) and the shadcn base tokens. Fonts use the system SF stack via `--font-sans` (no committed font files).
- **Tailwind v4** via `@tailwindcss/vite` — no `tailwind.config`, no PostCSS plugins needed.
- Use semantic token classes (`bg-nav-active`, `text-ink`, `border-surface-border`) or the exposed Garden palette classes (`text-grey-700`, `border-grey-400`, `text-blue-700`, …) rather than raw hex — if a hex exactly equals a palette value, use the token. Some genuinely one-off grays/surface tints (e.g. `#f5f6f7`) and per-channel brand colors have no token and are inline — that's expected. Do **not** reintroduce `font-['SF_Pro_*']` arbitrary font-family classes (carried over from the prototype and deliberately removed).
- **`DESIGN.md`** (repo root) — describes the design system (Zendesk Flora/Garden v10) as machine-readable tokens + rationale, for agent/human reference. `src/styles/theme.css` remains the runtime source of truth; DESIGN.md does not generate it. Validate with `pnpm design:lint`; `pnpm design:export` emits a scratch theme (`.design/`, gitignored) for drift-checking against `theme.css`. Canonical token values come from the internal `zendesk/ui` repo (`packages/alpha/ReactComponents/src/theming/`).

### Components & lib
- `src/components/ui/` — the full shadcn/ui kit + Radix primitives, retained as a toolkit for future products even where currently unused. `src/components/ui/utils.ts` exports `cn()`.
- `src/components/figma/ImageWithFallback.tsx` — a generic image-error fallback helper (the only remaining "figma"-named file; it is not Figma Make tooling).
- `src/lib/cn.ts` — `cn()` (clsx + tailwind-merge). `src/lib/channel-meta.ts` — `channelMeta(label)` and `CHANNEL_META` mapping a channel label to its display name, brand color, and Lucide icon; extend `CHANNEL_META` there rather than hardcoding per component.
- `src/types/index.ts` — shared types: `Org`, `Channel`, `NavItem`, `NavIcon`, `NavIconProps`.
- `src/components/nav-icons.tsx` — custom SVG nav icons (see Navigation above). `src/components/ZendeskLogo.tsx` — the header logomark.
- Icons: **nav rail** uses the custom SVGs in `nav-icons.tsx`; **canonical Garden glyphs** come from `@zendeskgarden/svg-icons` via `src/components/garden-icon.tsx` (`<GardenIcon name="…" />`, rendered inline from `?raw` SVGs so they inherit size/color) — use these where a design frame names a specific Garden icon (e.g. the AI Agents → Configuration screen); everywhere else (chrome, header, dashboard widgets, channel chips) uses `lucide-react`.

## Conventions

- **Path alias:** `@` → `src/`. Do **not** add `baseUrl` to `tsconfig.json` — it was removed in TypeScript 7 and the `@/*` alias resolves without it (adding it back breaks `tsc`).
- **TypeScript strict mode**; keep new code fully typed.
- **Tests** use Vitest + React Testing Library (jsdom); setup in `src/test/setup.ts`. Foundation-level coverage: nav-config, routing/active-state, sidebar flyover, org switcher, org context, and the screens. Prefer tests that assert real behavior (e.g. scope org-list assertions with `within(getByTestId('screen-organization'))` rather than a bare page-wide text match).

## Scope notes

- **No backend** — org data, the Home dashboard, and the AI Studio panel are all in-memory/mocked; the AI Studio composer is presentational.
- The Home dashboard and the Organization `AiStudioPanel` are **mock UI ported from the Figma Make prototype at the user's request** — richer than a pure "foundation" layer, but still frontend-only.
- **Solve / Triage / Assist / Discover** (and the standalone AI Studio product) remain placeholders rendering "Coming soon"; each will be its own future spec (see `docs/superpowers/specs/`). Note: the `AiStudioPanel` on the org screen is a small assistant shell, distinct from the full AI Studio *product*.
