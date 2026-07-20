# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **greenfield React + Vite + TypeScript front end** for the FT Unification console — an AI platform for customer support automation. This is the foundation layer: persistent chrome (navigation, org switching, top bar), routing, design tokens, and placeholder feature screens. Product logic (ticket triage, agent configuration, analytics) is out of scope for this phase.

## Commands

```bash
pnpm install
pnpm dev        # Vite dev server
pnpm build      # tsc -b && vite build (typecheck + production build)
pnpm test       # vitest run
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint
pnpm format     # prettier --write
```

If `pnpm` is not on PATH, use `npx` equivalents (e.g. `npx tsc --noEmit`, `npx vitest run`, `npx vite build`).

## Architecture

### Routing
React Router v7 with `createBrowserRouter`. Route definitions live in `src/routes.tsx`, and the single source of truth for navigation structure is `src/app/nav-config.ts` (`NavItem[]`), which exports:
- `navItems` — flat nav structure with `path`, `label`, `icon`, `subItems` (for 2-level menus).
- `findNavItemByPath(path)` — lookup helper to resolve active nav state from URL.

All nav chrome (Sidebar, ExpandedSidebar, TopBar) renders from `navItems` — there is no duplication.

### App Layout
- `src/App.tsx` — router entry, renders routes.
- `src/app/AppLayout.tsx` — persistent chrome wrapping all feature routes: Sidebar (collapsed left rail), ExpandedSidebar (wide nav panel with org switching + sections), TopBar (breadcrumb + controls).
- Layout is **desktop-fluid, min-width 1024px** (no mobile or tablet). Collapsible sidebar toggles between 64px collapsed and 280px expanded via `useSidebarCollapse()` hook.

### Feature Screens
Live under `src/features/`:
- `home/HomeScreen.tsx` — root landing (empty placeholder).
- `insights/` — insights hub + sub-routes (Insights, Metrics, Reporting, Experiments) as placeholders.
- `organization/OrganizationDashboard.tsx` — org settings stub.
- `organization/CreateOrgFlow.tsx` — multi-step org-creation dialog via shadcn Dialog + Stepper.

Future features (Solve, Triage, Assist, Discover, AI Studio) are stubbed in `nav-config.ts` but have no screens yet.

### Org Context
`src/app/org-context.tsx` provides `OrgProvider` + `useOrgs()` hook. Holds the list of orgs and `currentOrg`; surfaces `switchOrg(id)`. The mock implementation lives in `src/app/mock-orgs.ts`. `OrgProvider` wraps the entire app in `src/main.tsx`.

### Styles
- `src/styles/index.css` — entry (imports theme + fonts + Tailwind layers).
- `src/styles/theme.css` — CSS variable design tokens (colors, typography, spacing, radii) as `--color-*`, `--font-*`, `--radius-*`.
- `src/styles/fonts.css` — SF Pro system font stack.
- **Tailwind v4** via `@tailwindcss/vite` — no `tailwind.config`. Design tokens are used via `text-[var(--color-neutral-600)]`, etc. or mapped to Tailwind utilities.

### Component Library
- `src/components/ui/` — full shadcn/ui kit (Button, Dialog, Select, Tabs, etc.) + Radix primitives. `src/components/ui/utils.ts` exports `cn()` (clsx + tailwind-merge).
- `src/components/figma/ImageWithFallback.tsx` — generic image-error-fallback helper.
- Icons via `lucide-react`.

### Lib
- `src/lib/cn.ts` — re-exports `cn` from `@/components/ui/utils` for convenience.
- `src/lib/channel-meta.ts` — centralized channel display metadata (label → color/icon); import `getChannelMeta(label)`.

### Type Definitions
- `src/types/org.ts` — `Org` interface.
- `src/types/nav.ts` — `NavItem` interface.

## Conventions

- **Path alias:** `@` → `src/`. Never add `baseUrl` to `tsconfig.json` — TypeScript v7 already supports it.
- **TypeScript strict mode** — all code is fully typed.
- **ESLint + Prettier** — code is linted and formatted. Run `pnpm lint` and `pnpm format` before committing.
- **Tests** via Vitest. `src/test/setup.ts` configures the harness. Run `pnpm test`.
- **Channel metadata:** use `getChannelMeta(label)` from `@/lib/channel-meta` rather than hardcoding colors/icons per-component.

## Scope Notes

- This is the **foundation only**. Feature logic (ticket data, AI agent config, analytics queries) is out of scope.
- The app is **desktop-fluid (min-width 1024px)**. No mobile or tablet support.
- There is **no backend** in this repo. Org data is mocked. Future integration points TBD.
- **Solve, Triage, Assist, Discover, AI Studio** are stubbed in nav but have no screens yet — they are future work.
