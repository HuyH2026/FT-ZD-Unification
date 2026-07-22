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
  app-backdrop: "#f1efed"     # app-specific warm neutral (no exact palette match; near grey.100/200)
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
rounded:
  # Flora borderRadii (zendesk/ui). NOTE: app runtime currently uses shadcn
  # radii (--radius: 0.625rem); these are the design-system target.
  # Key is `rounded` (not `radius`) so the design.md CLI consumes it.
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "24px"
  full: "9999px"
---

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

On top of the product tokens, a subset of the raw **Garden palette scales** is
exposed directly as Tailwind classes (`theme.css`), so screens ported from Figma
use the exact design-system value instead of transcribing raw hex: `grey-200`
(#eae9e8), `grey-400` (#b7b7b3), `grey-500` (#999b97), `grey-700` (#646864),
`grey-800` (#404241), `grey-1200` (#0c0c0d), and `blue-700` (#406cc4 — the
canonical Flora accent, distinct from the legacy `accent-blue`; see **Known
deltas**). Reach for these before an arbitrary `text-[#…]`/`bg-[#…]`; extend the
set from the front-matter scales as new screens need more steps. Truly one-off
values with no palette match (e.g. a few `#f5f6f7` surface tints, per-channel
brand colors) stay inline — that's expected.

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
  (`src/components/nav-icons.tsx`), not lucide.
- **Canonical Garden glyphs** come from `@zendeskgarden/svg-icons`, rendered
  inline (they use `currentColor`) via `src/components/garden-icon.tsx`
  (`<GardenIcon name="…" />`). Use these where a design frame calls out a
  specific Garden icon — the AI Agents → Configuration screen sources all its
  glyphs this way. Add a glyph by importing its `?raw` SVG into `GARDEN_ICONS`.
- Everywhere else — general chrome, dashboard widgets, channel chips — uses
  `lucide-react`.
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
  drift check only; it never overwrites the runtime theme. Note the export is a
  **superset** of `theme.css` — it includes design-system tokens the app has not
  (yet) adopted (e.g. `--color-success`, the full `--spacing-*` scale), so expect
  those as additions in the diff, not drift.

`@google/design.md` is alpha (`0.3.0`); the format may change.
