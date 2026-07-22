# Topics Treemap ("Heatmap") View — Design

**Date:** 2026-07-22
**Status:** Approved (brainstorming) — pending spec review
**Area:** `src/features/insights/cx-journey/topics/`
**Figma reference:** `CX Journey_01`, node `676:68668` (file `LMPNsX1T3nwkueIRUCDktm`). Screenshot committed at `docs/superpowers/specs/assets/2026-07-22-topics-treemap-heatmap.png`.

## Goal

Add a **treemap toggle** to the CX Journey → Topics toolbar. When enabled, the nested topics table is replaced by a squarified treemap: colored rectangles sized by ticket volume, one color per top-level topic, with a hover tooltip card and click-to-drill-down into sub-topics via a breadcrumb.

The user refers to this as a "heatmap toggle with hover interaction"; the Figma reference frame is a **treemap** (rectangles sized by volume, one color per topic), so that is what we build.

## Scope decisions (from brainstorming)

- **Viz type:** treemap matching the Figma frame (not a color-intensity table overlay).
- **Toggle control:** a **dedicated** treemap toggle added to the toolbar — the existing two inert view-toggle icons (grid, network) are left untouched.
- **Tooltip data:** **extend the mock data** so every cell has the full 7-metric tooltip (Volume, First contact resolution, Avg first resolution time, Avg full resolution time, Sentiment, Agent reply time, Agent replies).
- **Interaction:** **hover + drill-down**. Hovering a cell shows the tooltip; clicking a top-level cell drills into its sub-topics with a working breadcrumb to return.
- **Layout:** **computed squarified treemap** (a pure, unit-tested function), not a hand-tuned fixed layout.

## Precedent

`src/features/insights/ai-performances/FlowSankey.tsx` is the established pattern for a bespoke data-driven viz in this codebase: a `useMeasured()` ResizeObserver hook feeding a deterministic layout computed from data. The treemap mirrors this — measure the container, compute cell rectangles from ticket volumes, render.

## Architecture

### New files (under `src/features/insights/cx-journey/topics/`)

| File | Responsibility |
|------|---------------|
| `treemap-layout.ts` | Pure squarified-treemap function. No React. `squarify(items, { width, height }) → PlacedCell[]` where `items: { id, value }[]` and `PlacedCell: { id, x, y, w, h }`. |
| `treemap-layout.test.ts` | Unit tests for `squarify` (see Testing). |
| `TopicTreemap.tsx` | Renders placed cells as absolutely-positioned `<div>`s in a measured container. Owns hover state (hovered cell) and drill state (drilled topic id). Renders breadcrumb + tooltip. |
| `TreemapTooltip.tsx` | Presentational hover card: topic color swatch + name, then 7 metric rows. |
| `TopicTreemap.test.tsx` | Behavioral tests: cell-per-topic, hover shows tooltip, click drills, breadcrumb resets. |

### Changed files

- **`topics-data.ts`**
  - Extend `TopicLeaf` (and therefore `TopicSub`) and `TopicRow` with the tooltip metric fields not yet present: `avgFirstResTime: string`, `avgFullResTime: string`, `agentReplyTime: string`, `agentReplies: string`, `csat: string`. `TopicRow` already has `tickets`, `firstContactResolution`, `sentiment`; `TopicLeaf` already has `tickets`/`ticketsPct` and `fullResTime`.
  - Add a per-top-level-topic `color: string`.
  - Add a `TOPIC_COLORS` palette (reuse the existing `BLUE/TEAL/AMBER/RED/GREY/DEEP_TEAL` from `cx-journey-data.ts` plus a few additional distinct hues to cover 8 top-level rows).
  - Populate the new fields with illustrative values for every row/sub/leaf. Existing numeric fields are unchanged so the table view is unaffected.

- **`TopicsTable.tsx`**
  - Lift a `view: 'table' | 'treemap'` state to the `TopicsTable` component.
  - Add a dedicated treemap toggle button to the `Toolbar` (active-state styling, `aria-pressed`). `Toolbar` gains `view`/`onViewChange` props.
  - When `view === 'treemap'`, render `<TopicTreemap>` in place of the column-header strip + topic cards. The header strip only shows in table view.

## Data flow & interaction

```
TopicsTable (owns `view` + `drillTopicId`)
  ├─ Toolbar: treemap toggle → setView('table' | 'treemap')
  └─ view === 'treemap':
       TopicTreemap
         ├─ breadcrumb: "All topics / <drilled topic name>" → click "All topics" resets drill
         ├─ useMeasured() → { width, height }
         ├─ items = drillTopicId ? topic.children : TOPIC_ROWS   (sized by `tickets`)
         ├─ squarify(items, size) → placed cells
         ├─ cell onMouseEnter → setHovered(cell); onMouseLeave → clear
         ├─ cell onClick (top level only) → setDrillTopicId(cell.id)
         └─ hovered && <TreemapTooltip> anchored to the hovered cell
```

- **Sizing:** each cell's area ∝ its `tickets`. Squarified keeps rectangles near-square for readability.
- **Color:** top level → each topic its own `TOPIC_COLORS` entry. Drilled level → tints/shades of the parent topic's color so the sub-topic group reads as one family.
- **Labels:** topic name + `volume (pct)` painted in white in the cell; hidden when the cell is below a `minLabelSize` threshold (matches the reference, where tiny cells show no label).
- **Tooltip position:** anchored to the hovered cell, offset so it doesn't cover the pointer, clamped to stay inside the measured container (same measured-container approach as `FlowSankey`).
- **Degenerate cases:** a level with a single item fills the whole area; zero items cannot occur (every topic has children).

## Testing

Vitest + RTL (jsdom), following `TopicsView.test.tsx` conventions.

- **`treemap-layout.test.ts`** (primary): union of cell areas ≈ container area (full tiling, no gaps); no two cells overlap; each cell area is proportional to its value; deterministic output for identical input; single-item input fills the box.
- **`TopicTreemap.test.tsx`**: renders one cell per top-level topic; hovering a cell shows the tooltip with that topic's metrics; clicking a top-level cell drills in (breadcrumb updates, children render); clicking "All topics" in the breadcrumb resets. jsdom has no layout — inject/stub a non-zero measured size so the `squarify` math runs.
- **`TopicsTable` toggle**: clicking the treemap toggle swaps table ↔ treemap; toggle reflects active state via `aria-pressed`.

## Non-goals

- No backend — all data remains mocked in `topics-data.ts`.
- No animated transition between table and treemap views.
- No treemap for the top-movers panel or other zones.
- Table view layout is unchanged.
- The existing grid/network toolbar icons remain inert (untouched).

## Verification gates

Per CLAUDE.md, the reliable gates (lint is a known-broken TS7 toolchain gap):

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
