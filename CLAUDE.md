# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **greenfield React + Vite + TypeScript front end** for the FT Unification console — an AI platform for customer support automation. This is the **foundation layer only**: persistent chrome (navigation rail, expanded sidebar, top bar, org switching), real routing, design tokens, and the initial feature screens (Home, Insights, Organization). It was rebuilt from a Figma Make prototype; all Figma Make artifacts have been removed.

Product logic for the five planned products — **Solve, Triage, Assist, Discover, AI Studio** — is out of scope for this phase. Those nav destinations currently render a shared "Coming soon" placeholder.

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
- `NAV_ITEMS: NavItem[]` — every item in order (`Home, Insights, AI Agents, Knowledge, Tools, Experiments, Orchestrator, Integrations, Log, Settings, Organization`), each `{ label, path, icon (LucideIcon), submenu: string[] }`.
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
- `home/HomeScreen.tsx` — fluid white content surface (intentionally minimal, matching the prototype).
- `insights/InsightsScreen.tsx` — surface with a nested `<Outlet/>`; sub-views `CxJourneyView.tsx` and `AiPerformancesView.tsx` are titled empty regions (the prototype had no real chart data — do not fabricate metrics).
- `organization/OrganizationScreen.tsx` — fluid org table built from `useOrgs().orgs`, using `OrgRow.tsx` and `ChannelChip.tsx`. `CreateOrgFlow.tsx` is the create form (`useOrgs().addOrg` then navigate back).

### Layout model: desktop-fluid
There is **no fixed canvas / `ScaledStage` / transform-scale** (the prototype's approach, removed). `AppLayout` is a full-height flex layout with a `min-w-[1024px]` floor; content fills available width fluidly. Target range is desktop (≥ ~1024px) — no mobile/tablet states.

### Styles & tokens
- `src/styles/index.css` — entry (imports fonts, Tailwind, `tw-animate-css`, theme).
- `src/styles/theme.css` — design tokens as CSS variables, exposed to Tailwind via `@theme inline`. Product tokens: `--color-app-backdrop`, `--color-nav-active`, `--color-ink`, `--color-ink-muted`, `--color-accent-blue`, `--color-surface-border`, plus the shadcn base tokens. Fonts use the system SF stack via `--font-sans` (no committed font files).
- **Tailwind v4** via `@tailwindcss/vite` — no `tailwind.config`, no PostCSS plugins needed.
- Use semantic token classes (`bg-nav-active`, `text-ink`, `border-surface-border`) rather than raw hex. Some one-off grays and per-channel brand colors have no token and are inline — that's expected. Do **not** reintroduce `font-['SF_Pro_*']` arbitrary font-family classes (carried over from the prototype and deliberately removed).

### Components & lib
- `src/components/ui/` — the full shadcn/ui kit + Radix primitives, retained as a toolkit for future products even where currently unused. `src/components/ui/utils.ts` exports `cn()`.
- `src/components/figma/ImageWithFallback.tsx` — a generic image-error fallback helper (the only remaining "figma"-named file; it is not Figma Make tooling).
- `src/lib/cn.ts` — `cn()` (clsx + tailwind-merge). `src/lib/channel-meta.ts` — `channelMeta(label)` and `CHANNEL_META` mapping a channel label to its display name, brand color, and Lucide icon; extend `CHANNEL_META` there rather than hardcoding per component.
- `src/types/index.ts` — shared types: `Org`, `Channel`, `NavItem`.
- Icons come from `lucide-react`.

## Conventions

- **Path alias:** `@` → `src/`. Do **not** add `baseUrl` to `tsconfig.json` — it was removed in TypeScript 7 and the `@/*` alias resolves without it (adding it back breaks `tsc`).
- **TypeScript strict mode**; keep new code fully typed.
- **Tests** use Vitest + React Testing Library (jsdom); setup in `src/test/setup.ts`. Foundation-level coverage: nav-config, routing/active-state, sidebar flyover, org switcher, org context, and the screens. Prefer tests that assert real behavior (e.g. scope org-list assertions with `within(getByTestId('screen-organization'))` rather than a bare page-wide text match).

## Scope notes

- **Foundation only** — no backend, no real product logic; org data is in-memory/mocked.
- **Solve / Triage / Assist / Discover / AI Studio** are placeholders; each will be its own future spec (see `docs/superpowers/specs/`).
