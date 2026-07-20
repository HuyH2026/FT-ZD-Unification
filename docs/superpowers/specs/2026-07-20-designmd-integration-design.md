# DESIGN.md Integration — Design Spec

**Date:** 2026-07-20
**Status:** Approved (brainstorming)
**Scope:** Add a `DESIGN.md` design-system description at repo root, anchored to the canonical Zendesk "Flora"/Garden theme, plus the `@google/design.md` CLI as a validator/drift-detector. Foundation for expanding product UI later.

## Goal

Give coding agents (and humans) a persistent, structured description of the FT Unification visual identity so future UI — the five planned products (Solve, Triage, Assist, Discover, AI Studio) — is generated consistently against the real design system.

[DESIGN.md](https://github.com/google-labs-code/design.md) is a Google Labs (alpha) format: YAML front matter (machine-readable tokens) + markdown prose (human-readable rationale).

## Decisions

### Approach: doc + reference (not source-of-truth)
- `DESIGN.md` is authored at repo root as a **description** of the design system.
- `src/styles/theme.css` (Tailwind v4 `@theme inline`) **remains the runtime source of truth** — the thing the app renders from.
- **Rejected:** making `@google/design.md` generate `theme.css`. Rationale: the tool is explicitly **alpha** ("spec and tooling expected to change"), and the app already sits on top of a mature, versioned design system (Zendesk Garden). We do not want an alpha codegen step coupled into `pnpm build`, nor an alpha tool acting as authority above Garden.

### Canonical value source: `zendesk/ui`
The authoritative token values come from the private/internal repo **`zendesk/ui`**, package `packages/alpha/ReactComponents/src/theming/` — a "Flora"-flavored Zendesk Garden **v9** theme. Accessed via the `gh` CLI (account has INTERNAL access).

Key files:
- `.../theming/elements/palette/index.ts` — raw `PALETTE`: primary scales `grey, blue, red, yellow, green, purple`; secondary scales `fuschia, pink, crimson, orange, lemon, lime, mint, teal, azure, royal, kale`; each `100`–`1200`. Plus `product` brand colors (`support #00a656`, `explore #30aabc`, `guide #eb4962`, `chat #f79a3e`, `talk #efc93d`, `sell #c38f00`, `gather #f6c8be`).
- `.../theming/elements/theme/index.ts` — semantic mapping: `primaryHue: blue`, `dangerHue: red`, `warningHue: yellow`, `successHue: green`, `neutralHue: grey`, `chromeHue: kale`; full **light + dark** semantic variables (`background`/`border`/`foreground` × `default/raised/recessed/subtle/emphasis/success/warning/danger/...`); Flora `borderRadii` — `xs 2px, sm 4px, md 8px, lg 12px, xl 16px, xxl 24px, full 9999px`. Base theme is `@zendeskgarden/react-theming` `DEFAULT_THEME` (v9).

**During implementation**, exact `fontSizes`, `fontWeights`, `lineHeights`, and `space` scales must be read from `@zendeskgarden/react-theming` `DEFAULT_THEME` (or the `zendesk/ui` source) rather than guessed.

## Deliverables

New/changed files only — **no changes to `theme.css`, the build, routing, or feature code.**

1. **`DESIGN.md`** (repo root)
2. **`.design/`** — gitignored scratch dir for CLI export output (`.gitignore` entry added)
3. **`package.json`** — one devDependency + two scripts
4. **This spec** (committed)

### 1. `DESIGN.md` contents

**YAML front matter (machine-readable):**
- `name: FT Unification (Flora / Zendesk Garden v9)`
- `colors` — semantic tokens the app actually uses, each annotated with its canonical Garden palette ref:
  - `primary` / `accent-blue`, `ink`, `ink-muted`, `nav-active`, `app-backdrop`, `surface-border`, `destructive`, `success`
- `palette` — **only the Garden scales the app draws from now** (grey, blue, red, green). The other 13 scales are documented in prose as "available in `zendesk/ui`, pull per-product" — NOT dumped into front matter.
- `typography`, `spacing`, `radius` — from Garden `DEFAULT_THEME` / Flora `borderRadii`, **verified against source during implementation**.

**Markdown prose (the primary value):**
- **Overview** — what Unification is, that it's Garden/Flora-based, desktop-fluid.
- **Colors** — the *why*: `nav-active` vs `ink`, when to use `accent-blue`, semantic hue mapping.
- **Typography** — SF system stack (`--font-sans`), heading scale.
- **Layout** — desktop-fluid, `min-w-[1024px]` floor, no fixed canvas.
- **Components** — channel chips, nav rail conventions (custom SVG icons vs lucide), sidebar states.
- **Known deltas** — where the running app differs from canonical Garden (see below).
- **Expansion** — how to pull more Garden tokens per-product (Solve/Triage/Assist/Discover/AI Studio) from `zendesk/ui`.

### 2. Tooling — `@google/design.md` CLI

- Add `@google/design.md` as a **pinned devDependency**.
- `package.json` scripts:
  - `design:lint` → `npx @google/design.md lint DESIGN.md`
  - `design:export` → `npx @google/design.md export --format css-tailwind DESIGN.md > .design/theme.generated.css`
- **One-directional:** the CLI validates and emits a scratch theme for diffing. It **never** writes the real `theme.css`.
- **Alpha fallback:** if `@google/design.md` fails to install or run cleanly, ship `DESIGN.md` + document the commands in prose instead, and note it. No build coupling either way.

### 3. Drift handling

DESIGN.md front matter and `theme.css` are two representations of the same tokens and can diverge.
- Front matter authored to **canonical Garden** values.
- A **"Known deltas"** prose subsection records intentional/accidental differences in the running app. Seed entries (already found):
  - `accent-blue` = `#1f73b7` (old Garden accent) vs Flora `blue.700` = `#406cc4`.
  - `surface-border` = `#d8dcde` vs Garden `grey.300` = `#dcdcda`.
  - (Confirmed matches: `ink #2f3130` = `grey.900`; `ink-muted #8b8e89` = `grey.600`.)
- **No CI gate now** — the project's `pnpm lint` is already broken (TS7/typescript-eslint gap per CLAUDE.md); we won't add a fragile gate. `design:export` diffing is available manually. A CI check is a possible one-line follow-up.

## Non-goals

- Not changing `theme.css` or any runtime rendering.
- Not importing all 17 Garden palette scales now.
- Not generating the Tailwind theme from DESIGN.md.
- Not building any product UI (Solve/Triage/Assist/Discover/AI Studio remain "Coming soon").
- Not fabricating metrics/values — every token traces to `zendesk/ui` or `@zendeskgarden/react-theming`.

## Verification

- `DESIGN.md` exists at repo root; front-matter values trace to `zendesk/ui` sources cited above.
- `pnpm design:lint` passes (or documented fallback if the alpha CLI can't run).
- `pnpm typecheck` / `pnpm test` / `pnpm build` unaffected (no code touched).
- `.design/` is gitignored.
