# FT Unification — Front-End Foundation Design

**Date:** 2026-07-20
**Status:** Approved
**Scope:** Foundation only (first sub-project of a larger platform)

## Context

The repository currently holds a **Figma Make export** — a front-end-only prototype of the
"FT Unification" console (an AI customer-support platform). It renders a scaled 1440×920
canvas with a nav rail and a handful of screens (Home, Insights, Organization), built from
machine-generated, absolute-positioned markup and extracted SVG path data in `src/imports/`.

The long-term product vision is a platform of five products — **Solve, Triage, Assist,
Discover, and AI Studio**. That is far larger than one spec. This document covers only the
**first sub-project: turning the prototype into a clean, robust front-end foundation** that
those products can later be built into, each via its own spec.

## Goals

- Remove **all** Figma Make references and generated cruft; start clean and proper.
- Preserve the existing **navigation and look-and-feel** (rebuilt, not screenshot-identical).
- Rebuild the existing screens as clean, semantic, **responsive (desktop-fluid ≥ ~1024px)**
  React components.
- Keep the current stack (React 18, Vite 6, Tailwind v4, shadcn/ui, react-router, motion)
  and **add engineering rigor**: TypeScript config + typecheck, ESLint + Prettier,
  Vitest + React Testing Library.

## Non-Goals (future specs)

- Real product logic for Solve / Triage / Assist / Discover / AI Studio.
- Any backend, API, data layer, or AI integration.
- Authentication.
- Tablet / mobile layouts (design only defines ~1440px desktop).

## Key Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Depth | Foundation only — existing screens, no new product features |
| Generated markup | Rebuild screens as clean components; discard `src/imports/` |
| Layout model | Genuinely responsive |
| Responsive range | Desktop-fluid (≥ ~1024px); no invented mobile states |
| Stack | Keep stack, add rigor (typecheck, lint, tests) |
| Migration style | Greenfield scaffold within the same repo; delete old world at the end |
| Icons | `lucide-react` (visually-equivalent); custom marks as dedicated SVGs |
| Fonts | System SF stack (`-apple-system`/`system-ui`); no committed font files |
| shadcn/ui kit | Keep the **full** `components/ui/` library as a toolkit for future products |
| Non-ui unused deps | Prune (MUI, emotion, react-slick, masonry, dnd, confetti, popper) |

## Approach: Greenfield Scaffold (in the same git repo)

Not a second repository. We build a clean `src/` tree, port visuals across, and delete the
old artifacts at the end in a dedicated commit. Git history is preserved; the result is a
clean slate.

### Deleted entirely (all Figma Make traces)

- `src/imports/` — all 35 generated screen folders + SVG/PNG dumps
- `ScaledStage` fixed-canvas scaling and the old `src/app/App.tsx`
- The `figmaAssetResolver` Vite plugin and the `figma:asset/` import scheme
- `guidelines/Guidelines.md` (empty Figma Make template)
- Root scratch scripts: `parseNav.js`, `parseNav.cjs`, `test.js`, `test-compile.js`,
  `test-compile2.js`, `test-expand.js`
- `default_shadcn_theme.css` (stray root file)
- `pnpm-workspace.yaml` (unnecessary single-package workspace)
- Figma Make naming/comments in `package.json` (`@figma/my-make-file`), `index.html`,
  and `vite.config.ts`

### Kept and re-homed

The visual design (colors, type, spacing), the nav structure, the Home / Insights /
Organization screens, and the interactive behaviors (collapsed rail, hover flyover,
expanded sidebar, org switcher, create-org flow) — all rebuilt as clean components.

## Project Structure

```
src/
  main.tsx                 # entry
  App.tsx                  # router + providers only (thin)
  routes.tsx               # route table
  app/
    layout/
      AppLayout.tsx        # persistent chrome: sidebar + top bar + <Outlet/>
      Sidebar.tsx          # collapsed rail + hover flyover + expand toggle
      ExpandedSidebar.tsx  # expanded nav drawer
      OrgSwitcher.tsx      # org dropdown in the top bar
    nav-config.ts          # nav items, sub-menus, icons, route paths (single source of truth)
  features/
    home/                  # Home screen
    insights/              # Insights screen (CX Journey / AI Performances)
    organization/          # Organization dashboard + create-org flow
    _placeholder/          # shared "Coming soon" page for undesigned destinations
  components/ui/           # full shadcn/ui primitive kit (retained)
  lib/
    cn.ts                  # clsx + tailwind-merge helper
    channel-meta.ts        # channel label -> color/icon (ported)
  styles/
    index.css              # entry: imports theme + tailwind + fonts
    theme.css              # consolidated design tokens (single file)
    fonts.css
  types/                   # shared TS types (Org, Channel, NavItem, etc.)
  test/                    # Vitest + RTL setup
```

## Routing

Replace the prototype's `useState("Home")` string-switching with real `react-router`:

- `/` → Home
- `/insights` → Insights, with `/insights/cx-journey` and `/insights/ai-performances`
- `/organization` → Organization dashboard; `/organization/new` → create-org flow
- `/ai-agents`, `/knowledge`, `/tools`, `/experiments`, `/orchestrator`,
  `/integrations`, `/log`, `/settings` → shared **Placeholder** ("Coming soon"),
  matching today's look

`AppLayout` holds the sidebar + top bar and renders the active route via `<Outlet/>`.
The **active nav item is derived from the URL**, so deep links and back/forward work.
Sidebar UI state (expanded/collapsed, hover-intent) is local state in the layout.

`nav-config.ts` is the single source of truth — an array of
`{ label, path, icon, submenu[] }` that drives the rail, flyover, expanded sidebar, **and**
the routes. This eliminates the prototype's fragile `nth-child` index math and separator
off-by-one.

## Visual Rebuild

**Icons.** Discard the extracted `svg-*.ts` path data. Use `lucide-react`, choosing the
closest match to each Figma glyph. Genuinely custom/brand marks become small dedicated SVG
components under `features/.../icons/`. Glyphs will be visually equivalent, not
byte-identical.

**Styling.** Keep Tailwind utility classes, but replace the prototype's hardcoded arbitrary
values (`text-[#2f3130]`, `left-[229px]`) with **semantic design tokens** in `theme.css`
(e.g. `--color-surface`, `--color-nav-active`, brand accent, channel brand colors),
referenced as Tailwind theme colors instead of raw hex.

**Fonts.** Reference the system SF stack (`-apple-system`, `system-ui`, San Francisco);
graceful degradation elsewhere. No proprietary font files committed.

**Layout: fixed canvas → desktop-fluid.** Drop `ScaledStage` and the 1440×920
transform-scale. `AppLayout` becomes a full-height flex layout: fixed-width sidebar
(collapsed ~64px / expanded ~234px) + fluid main content filling remaining width. Screen
content uses flex/grid with relative units, stretching to fill any width ≥ ~1024px, with a
`min-width` floor near 1024px. The rounded "framed card" aesthetic (`rounded-[26px]` white
panels on the `#f1efed` backdrop) is preserved as container styling; it fills fluidly rather
than being a fixed rectangle.

**Interactions.** The hover-intent flyover (open/close timers), expand/collapse toggle,
org-switcher dropdown, and create-org flow are rebuilt as real components with proper
handlers — no invisible overlay buttons on static art, no injected `<style>` strings
targeting Figma `data-name` attributes.

**Animation.** Keep `motion` for sidebar expand/collapse and flyover transitions.

## Tooling & Quality

- **TypeScript:** `tsconfig.json` + `tsconfig.node.json`, strict mode; `typecheck` = `tsc --noEmit`.
- **Lint/format:** ESLint flat config (`typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`) + Prettier.
- **Testing:** Vitest + React Testing Library + jsdom; `test/setup.ts`. Foundation-level
  tests: `nav-config` correctness, routing (right screen per URL, active state from URL),
  sidebar expand/collapse + flyover behavior, org switcher, `channel-meta` mapping. Not
  exhaustive visual tests.
- **Scripts:** `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`, `test:watch`.

### Dependencies

**Prune (confirmed unused, non-ui):** `@mui/material`, `@mui/icons-material`,
`@emotion/react`, `@emotion/styled`, `react-slick`, `react-responsive-masonry`, `react-dnd`,
`react-dnd-html5-backend`, `canvas-confetti`, `react-popper`, `@popperjs/core`.

**Keep:** React 18, Vite 6, Tailwind v4, `react-router`, `motion`, `lucide-react`, `clsx`,
`tailwind-merge`, `class-variance-authority`, the full Radix primitive set backing
`components/ui/`, and `recharts` (Insights/AI Performances charts).

The **full shadcn/ui kit is retained** as a ready toolkit for future products, even where
currently unused.

## Migration Sequence

Each step ends with the app running via `pnpm dev` for continuous verification.

1. **Scaffold tooling** — tsconfig, ESLint/Prettier, Vitest, scripts; clean `package.json`
   (rename off `@figma/my-make-file`, prune non-ui unused families). App still boots on old code.
2. **Styles + lib foundation** — consolidated `theme.css` tokens, `fonts.css`, `cn.ts`,
   ported `channel-meta.ts`; retain full `components/ui/`.
3. **App shell** — `nav-config.ts`, `AppLayout`, `Sidebar` (rail + flyover),
   `ExpandedSidebar`, `OrgSwitcher`, router + routes with Placeholder pages. Nav works
   end-to-end against placeholders.
4. **Rebuild screens** — Home, then Insights (CX Journey / AI Performances), then
   Organization + create-org flow. Each replaces its placeholder route as it lands.
5. **Delete the old world** — `src/imports/`, `ScaledStage`, old `App.tsx`, Figma asset
   plugin, `guidelines/`, root scratch scripts, `default_shadcn_theme.css`,
   `pnpm-workspace.yaml`; clean `index.html` + `vite.config.ts`.
6. **Final pass** — `typecheck` + `lint` + `test` + `build` green; rewrite `CLAUDE.md` and
   `README.md` to describe the real app (no Figma Make references).

## Verification

`pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass. Visual parity checked
against the current render at desktop widths.

## Risks & Caveats

- **Visual drift** — Lucide icons and hand-rebuilt layouts are *visually equivalent*, not
  byte-identical to the scaled prototype. Most noticeable at the icon and fine-spacing level.
- **Responsive is net-new** — the design only defines ~1440px. Fluid ≥1024px behavior
  involves reasonable judgment calls the design doesn't specify; expect iteration on how
  panels stretch.
- **Chart fidelity** — if Insights charts were baked as static SVG in the prototype,
  rebuilding them with `recharts` may look slightly different; matched as closely as the
  data allows.
