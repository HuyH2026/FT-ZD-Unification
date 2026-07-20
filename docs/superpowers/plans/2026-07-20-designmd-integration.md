# DESIGN.md Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `DESIGN.md` at repo root that describes the FT Unification visual identity (anchored to the canonical Zendesk Flora/Garden theme), plus the `@google/design.md` CLI as a validator/drift-detector — without touching runtime rendering.

**Architecture:** `DESIGN.md` is a *description* layer (YAML front-matter tokens + markdown rationale). `src/styles/theme.css` remains the runtime source of truth. The `@google/design.md` CLI is wired one-directionally — it lints the doc and can export a scratch Tailwind theme for diffing, but never writes `theme.css`.

**Tech Stack:** Markdown + YAML front matter; `@google/design.md@0.3.0` (alpha, devDependency); pnpm scripts. Canonical token values sourced from `zendesk/ui` (Flora/Garden v10 bridge) and `@zendeskgarden/react-theming@9.15.6` `DEFAULT_THEME`.

## Global Constraints

- **Do NOT modify** `src/styles/theme.css`, the Vite/Tailwind build, routing, or any feature/component code. New files + `package.json`/`.gitignore` additions only.
- **TypeScript pinned to 5.9** — do not bump (breaks eslint). This task adds no TS, but do not touch the pin.
- **No fabricated values.** Every token in DESIGN.md front matter must trace to a cited source: `zendesk/ui` palette/theme, or `@zendeskgarden/react-theming` `DEFAULT_THEME`, or the app's `theme.css`.
- `@google/design.md` is **alpha** — pin the exact version. If the CLI cannot install or run cleanly, fall back to shipping `DESIGN.md` + documenting the commands in prose, and note the fallback. Never couple it into `pnpm build`.
- Package manager is **pnpm** (npx equivalents acceptable if pnpm absent).

---

## Canonical Token Reference (verified from source)

Use these exact values when authoring DESIGN.md. Do not re-derive.

**Garden `DEFAULT_THEME` (`@zendeskgarden/react-theming@9.15.6`), BASE = 4:**
- `fontSizes`: xs `10px`, sm `12px`, md `14px`, lg `18px`, xl `22px`, xxl `26px`, xxxl `36px`
- `fontWeights`: thin 100, extralight 200, light 300, regular 400, medium 500, semibold 600, bold 700, extrabold 800, black 900
- `lineHeights`: sm `16px`, md `20px`, lg `24px`, xl `28px`, xxl `32px`, xxxl `44px`
- `space`: base 4, xxs `4px`, xs `8px`, sm `12px`, md `20px`, lg `32px`, xl `40px`, xxl `48px`
- `fonts.system`: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif`
- `fonts.mono`: `SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace`
- `iconSizes`: sm `12px`, md `16px`, lg `26px`
- Semantic hues: `primaryHue: blue`, `dangerHue: red`, `warningHue: yellow`, `successHue: green`, `neutralHue: grey`, `chromeHue: kale`
- light `foreground.default` = `grey.900`; light `foreground.subtle` = `grey.700`; light `border.default` = `grey.300`; light `background.default` = `white`

**Flora `borderRadii` override (from `zendesk/ui` `.../theming/elements/theme/index.ts`):**
- xs `2px`, sm `4px`, md `8px`, lg `12px`, xl `16px`, xxl `24px`, full `9999px`

**Garden palette scales the app uses (from `zendesk/ui` `.../theming/elements/palette/index.ts`):**
- `grey`: 100 `#f7f7f7`, 200 `#eae9e8`, 300 `#dcdcda`, 400 `#b7b7b3`, 500 `#999b97`, 600 `#8b8e89`, 700 `#646864`, 800 `#404241`, 900 `#2f3130`, 1000 `#202121`, 1100 `#19191a`, 1200 `#0c0c0d`
- `blue`: 100 `#f3f6fb`, 200 `#e4eaf6`, 300 `#d4ddf0`, 400 `#a3b7df`, 500 `#7f9bd3`, 600 `#698cd3`, 700 `#406cc4`, 800 `#284173`, 900 `#1f335a`, 1000 `#14213b`, 1100 `#0c1322`, 1200 `#080c16`
- `red`: 100 `#fbf3f3`, 300 `#f3d7d9`, 700 `#c63f46`, 800 `#792428` (danger)
- `green`: 100 `#eff9e6`, 300 `#c6e8a1`, 700 `#4b7d04` (success)
- `product`: support `#00a656`, explore `#30aabc`, guide `#eb4962`, chat `#f79a3e`, talk `#efc93d`, sell `#c38f00`, gather `#f6c8be`

**App tokens (from `src/styles/theme.css`) and their Garden mapping:**
- `--color-ink: #2f3130` = grey.900 ✓ (match)
- `--color-ink-muted: #8b8e89` = grey.600 ✓ (match)
- `--color-nav-active: #293239` — chrome/dark neutral, no exact palette match (documented as-is)
- `--color-app-backdrop: #f1efed` — near grey.100/200, app-specific (documented as-is)
- `--color-accent-blue: #1f73b7` — **DELTA:** old Garden accent, vs Flora `blue.700 #406cc4`
- `--color-surface-border: #d8dcde` — **DELTA:** vs Garden `grey.300 #dcdcda`
- `--destructive: #d4183d` — app value, near red.700
- `--font-sans: -apple-system, system-ui, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', sans-serif`
- `--radius: 0.625rem` (10px) — shadcn base radius (app uses shadcn radii, not Flora borderRadii, at runtime)

---

## Task 1: Wire the `@google/design.md` CLI and scratch dir

**Files:**
- Modify: `package.json` (add devDependency + two scripts)
- Modify: `.gitignore` (add `.design/`)

**Interfaces:**
- Produces: pnpm scripts `design:lint` and `design:export`; gitignored `.design/` dir. Task 2 relies on `design:lint` existing.

- [ ] **Step 1: Inspect current package.json scripts and devDependencies**

Run: `cat package.json`
Note the existing `"scripts"` block and `"devDependencies"` block formatting (indentation, trailing commas) so additions match style.

- [ ] **Step 2: Add `.design/` to `.gitignore`**

Append to `.gitignore` (create the line if the file exists; the repo already has one):

```gitignore
# design.md CLI scratch output (not source of truth)
.design/
```

- [ ] **Step 3: Add the devDependency (pinned, alpha)**

Run:

```bash
pnpm add -D @google/design.md@0.3.0
```

Expected: `@google/design.md` appears under `devDependencies` in `package.json` at `0.3.0` (or `^0.3.0` — pin exact by editing to `"@google/design.md": "0.3.0"` if pnpm writes a caret).

**Fallback (if install fails):** the package is alpha. If `pnpm add` errors, skip the dependency, do NOT block — record in DESIGN.md prose (Task 2, Tooling section) that the CLI must be run via `npx @google/design.md@0.3.0 ...` on demand, and continue. Note the failure in your task report.

- [ ] **Step 4: Add the two scripts to `package.json`**

Add to the `"scripts"` object:

```json
"design:lint": "design.md lint DESIGN.md",
"design:export": "design.md export --format css-tailwind DESIGN.md > .design/theme.generated.css"
```

(If the devDependency install failed in Step 3, use `npx @google/design.md@0.3.0 lint DESIGN.md` and the `npx ... export ...` equivalent instead, so the scripts work without a local install.)

- [ ] **Step 5: Verify scripts are registered and nothing else broke**

Run:

```bash
pnpm run 2>&1 | grep -E "design:(lint|export)"
pnpm typecheck
```

Expected: both `design:lint` and `design:export` listed; `pnpm typecheck` passes (unchanged — no TS touched). `design:lint` itself is exercised in Task 2 once DESIGN.md exists.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "chore: add @google/design.md CLI scripts and .design scratch dir"
```

---

## Task 2: Author `DESIGN.md`

**Files:**
- Create: `DESIGN.md` (repo root)

**Interfaces:**
- Consumes: `design:lint` script from Task 1.
- Produces: the design-system doc. No later task depends on it.

- [ ] **Step 1: Write the front matter**

Create `DESIGN.md` starting with this YAML front matter. Values are the verified canonical ones from the Canonical Token Reference above; each app-semantic color carries an inline comment tracing its Garden origin.

```markdown
---
name: FT Unification
description: >-
  Console for an AI customer-support automation platform. Built on the Zendesk
  "Flora" flavor of Garden v10 (Garden v9 theming base). Desktop-fluid, light-mode.
colors:
  # Semantic tokens the app actually renders (source: src/styles/theme.css),
  # annotated with canonical Garden palette origin.
  primary: "#030213"          # shadcn base primary (app chrome)
  accent-blue: "#1f73b7"      # DELTA: legacy Garden accent; canonical Flora = blue.700 #406cc4
  ink: "#2f3130"              # grey.900
  ink-muted: "#8b8e89"        # grey.600
  nav-active: "#293239"       # app-specific dark chrome neutral
  app-backdrop: "#f1efed"     # app-specific warm neutral (~grey.100)
  surface-border: "#d8dcde"   # DELTA: app value; canonical Garden = grey.300 #dcdcda
  destructive: "#d4183d"      # app value (~red.700 #c63f46)
  success: "#4b7d04"          # green.700
palette:
  # Only the Garden scales the app currently draws from. Others (fuschia, pink,
  # crimson, orange, lemon, lime, mint, teal, azure, royal, purple, yellow, kale)
  # live in zendesk/ui and are pulled per-product as needed (see Expansion).
  grey:
    "100": "#f7f7f7"
    "200": "#eae9e8"
    "300": "#dcdcda"
    "400": "#b7b7b3"
    "500": "#999b97"
    "600": "#8b8e89"
    "700": "#646864"
    "800": "#404241"
    "900": "#2f3130"
    "1000": "#202121"
    "1100": "#19191a"
    "1200": "#0c0c0d"
  blue:
    "100": "#f3f6fb"
    "200": "#e4eaf6"
    "300": "#d4ddf0"
    "400": "#a3b7df"
    "500": "#7f9bd3"
    "600": "#698cd3"
    "700": "#406cc4"
    "800": "#284173"
    "900": "#1f335a"
    "1000": "#14213b"
    "1100": "#0c1322"
    "1200": "#080c16"
  red:
    "100": "#fbf3f3"
    "300": "#f3d7d9"
    "700": "#c63f46"
    "800": "#792428"
  green:
    "100": "#eff9e6"
    "300": "#c6e8a1"
    "700": "#4b7d04"
typography:
  fontFamily: "-apple-system, system-ui, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', sans-serif"
  # Garden DEFAULT_THEME fontSizes (px)
  sizes:
    xs: "10px"
    sm: "12px"
    md: "14px"
    lg: "18px"
    xl: "22px"
    xxl: "26px"
    xxxl: "36px"
  weights:
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
  # Garden DEFAULT_THEME lineHeights (px)
  lineHeights:
    sm: "16px"
    md: "20px"
    lg: "24px"
    xl: "28px"
    xxl: "32px"
    xxxl: "44px"
spacing:
  # Garden DEFAULT_THEME space scale (BASE=4)
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "40px"
  xxl: "48px"
radius:
  # Flora borderRadii (zendesk/ui). NOTE: app runtime currently uses shadcn
  # radii (--radius: 0.625rem); these are the design-system target.
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "24px"
  full: "9999px"
---
```

- [ ] **Step 2: Write the prose body**

Immediately after the front matter, append this markdown. Do not invent metrics or values beyond what is stated.

```markdown
# FT Unification Design System

## Overview

FT Unification is the console for an AI customer-support automation platform.
Its visual identity is the Zendesk **"Flora"** flavor of **Garden v10** (built on
the Garden v9 theming base). The app is **desktop-fluid** (min width 1024px, no
mobile/tablet states) and **light-mode** in this phase.

The canonical token source is the internal `zendesk/ui` repo, package
`packages/alpha/ReactComponents/src/theming/` — specifically `palette/index.ts`
(raw color scales) and `theme/index.ts` (semantic hue mapping + Flora
`borderRadii`). Base scales (fontSizes, space, lineHeights, fontWeights) come
from `@zendeskgarden/react-theming` `DEFAULT_THEME`.

**Runtime source of truth is `src/styles/theme.css`** (Tailwind v4 `@theme
inline`). This document *describes* the system; it does not generate the theme.

## Colors

Garden maps semantic roles onto named hues:

- **primary → blue**, **danger → red**, **warning → yellow**, **success →
  green**, **neutral → grey**, **chrome → kale**.

The app exposes a small set of product tokens (in `theme.css`) on top of these:

- **`ink` (`grey.900` #2f3130)** — primary text/foreground.
- **`ink-muted` (`grey.600` #8b8e89)** — secondary/subtle text. Use for labels,
  captions, and de-emphasized metadata; must remain legible (do not go lighter).
- **`nav-active` (#293239)** — the active navigation background in the rail/
  sidebar. A dark chrome neutral; distinct from `ink` (which is text).
- **`app-backdrop` (#f1efed)** — the warm neutral page background behind cards.
- **`accent-blue` (#1f73b7)** — the interactive/accent blue (links, primary
  actions). See **Known deltas** — this is a legacy Garden accent, not the
  current Flora `blue.700`.
- **`surface-border` (#d8dcde)** — default card/table border.

Full 100–1200 scales for grey/blue/red/green are in the front matter. Other
Garden hues are available in `zendesk/ui` and pulled in per-product.

## Typography

Runtime font is the SF/system stack via `--font-sans`
(`-apple-system, system-ui, 'SF Pro Text', 'SF Pro Display', 'Segoe UI',
sans-serif`); Garden's own default is the equivalent `system-ui` stack. No web
font files are committed. Do **not** reintroduce `font-['SF_Pro_*']` arbitrary
Tailwind classes (removed deliberately).

Heading scale (from `theme.css` base layer): h1 = text-2xl, h2 = text-xl, h3 =
text-lg, h4/label/button = text-base, all `font-weight-medium` (500), line-height
1.5. Garden's raw `fontSizes`/`lineHeights` scales are in the front matter for
reference when building denser product surfaces.

## Layout

Desktop-fluid flex layout with a `min-w-[1024px]` floor; content fills available
width. There is **no fixed canvas / scaled stage / transform-scale**. Target
range is desktop (≥ ~1024px) only. Spacing follows Garden's 4px base scale
(front matter `spacing`).

## Components

- **Navigation rail** uses pixel-exact custom SVG icons
  (`src/components/nav-icons.tsx`), not lucide. Everywhere else — chrome, header,
  dashboard widgets, channel chips — uses `lucide-react`.
- **Channel chips** map a channel to a brand color + icon via
  `src/lib/channel-meta.ts`. Per-channel brand colors are intentionally inline
  (no token). Garden `product` brand colors (support #00a656, explore #30aabc,
  guide #eb4962, chat #f79a3e, talk #efc93d, sell #c38f00, gather #f6c8be) are
  available for product-branded surfaces.
- **shadcn/ui kit** (`src/components/ui/`) is retained as a toolkit; it uses the
  shadcn base tokens (`--radius: 0.625rem`, etc.), which coexist with the Garden/
  Flora tokens. Prefer semantic token classes (`bg-nav-active`, `text-ink`,
  `border-surface-border`) over raw hex.

## Known deltas (app vs canonical Garden/Flora)

The running app intentionally or historically differs from canonical values.
These are tracked so the divergence is visible, not silent:

| Token | App value | Canonical | Note |
|-------|-----------|-----------|------|
| `accent-blue` | `#1f73b7` | Flora `blue.700` `#406cc4` | Legacy Garden accent blue |
| `surface-border` | `#d8dcde` | `grey.300` `#dcdcda` | Near-match, not identical |
| radii | shadcn `--radius: 0.625rem` | Flora `borderRadii` (md `8px`) | App runtime uses shadcn radii |

Confirmed matches (no delta): `ink` = grey.900, `ink-muted` = grey.600.

## Expansion

As the five products (Solve, Triage, Assist, Discover, AI Studio) are built,
pull additional Garden tokens from `zendesk/ui`
(`packages/alpha/ReactComponents/src/theming/`) into this document:

1. Add the needed palette scale(s) to the front-matter `palette` block, copied
   verbatim from `palette/index.ts`.
2. Add semantic tokens to `colors` with an inline comment tracing the origin.
3. Document usage and rationale in the relevant prose section.
4. If a value diverges from `theme.css`, add a row to **Known deltas**.

Keep the front matter scoped to what the app actually uses — do not dump all 17
Garden hue scales speculatively.

## Tooling

- `pnpm design:lint` — validate this file against the design.md format.
- `pnpm design:export` — emit a Tailwind v4 theme to `.design/theme.generated.css`
  (gitignored scratch) for **diffing against `src/styles/theme.css`**. This is a
  drift check only; it never overwrites the runtime theme.

`@google/design.md` is alpha (`0.3.0`); the format may change.
```

- [ ] **Step 3: Lint the doc**

Run: `pnpm design:lint`
Expected: PASS (no schema errors). If the alpha CLI reports a schema quibble (e.g. an unrecognized key), adjust the front matter to satisfy it — keeping the values — and note what changed. If the CLI could not be installed (Task 1 fallback), run `npx @google/design.md@0.3.0 lint DESIGN.md` instead.

- [ ] **Step 4: Confirm the export runs (drift-check smoke test)**

Run: `pnpm design:export && head -20 .design/theme.generated.css`
Expected: a Tailwind theme CSS is written to `.design/theme.generated.css` and prints. This confirms the one-directional export path works. (Do not diff-fix values here — drift is documented in Known deltas, not auto-corrected.)

- [ ] **Step 5: Confirm the runtime build is untouched**

Run:

```bash
pnpm typecheck && pnpm test && pnpm build
```

Expected: all pass exactly as before (this task added only `DESIGN.md`, which is not imported by any source). If any fail, you changed something you should not have — revert non-`DESIGN.md` changes.

- [ ] **Step 6: Commit**

```bash
git add DESIGN.md
git commit -m "docs: add DESIGN.md describing the Flora/Garden design system"
```

---

## Task 3: Update CLAUDE.md to point at DESIGN.md

**Files:**
- Modify: `CLAUDE.md` (Styles & tokens section)

**Interfaces:**
- Consumes: `DESIGN.md` (Task 2). No task depends on this.

- [ ] **Step 1: Add a DESIGN.md pointer to the "Styles & tokens" section**

In `CLAUDE.md`, within the `### Styles & tokens` bullet list, add a bullet:

```markdown
- **`DESIGN.md`** (repo root) — describes the design system (Zendesk Flora/Garden v10) as machine-readable tokens + rationale, for agent/human reference. `src/styles/theme.css` remains the runtime source of truth; DESIGN.md does not generate it. Validate with `pnpm design:lint`; `pnpm design:export` emits a scratch theme (`.design/`, gitignored) for drift-checking against `theme.css`. Canonical token values come from the internal `zendesk/ui` repo (`packages/alpha/ReactComponents/src/theming/`).
```

- [ ] **Step 2: Verify the doc still reads coherently**

Run: `grep -n "DESIGN.md" CLAUDE.md`
Expected: the new bullet appears in the Styles & tokens section.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: reference DESIGN.md from CLAUDE.md styles section"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** Approach (doc+reference) → Task 2 front matter/prose + CLAUDE note. Canonical source `zendesk/ui` → Canonical Token Reference + prose citations. CLI tooling → Task 1. Drift handling / Known deltas → Task 2 Step 2 table + `design:export`. `.design/` gitignored → Task 1 Step 2. No `theme.css`/build/code changes → Global Constraints + Task 2 Step 5 verification. All spec sections mapped.
- **Placeholder scan:** No TBDs; all token values are concrete and sourced; all code/markdown blocks are complete and copy-pasteable.
- **Type consistency:** Script names `design:lint`/`design:export` consistent across Task 1 (defined), Task 2 (used), Task 3 (referenced). Package version `0.3.0` consistent. Palette values consistent with the Canonical Token Reference.
