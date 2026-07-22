# Orchestrator Automation Detail Screen

**Date:** 2026-07-22
**Status:** Approved (design)
**Figma:** `LMPNsX1T3nwkueIRUCDktm`, node `747:86037` ("07 Orchestrator")

## Purpose

Add the **automation detail screen** reached by selecting a row in the existing
Orchestrator table (`OrchestratorScreen`). The detail screen shows a single
automation's **journey** — a node-based flow graph (Start → branch/action/End
nodes, connected by edges) — plus a categorized node palette for adding nodes.

This phase builds a **real flow editor**: pan/zoom, draggable nodes,
drag-to-connect edges, and drag-from-palette node creation, backed by
`@xyflow/react` (React Flow v12). Edits persist per-automation to
`localStorage`. The `Analytic` and `Log` tabs render a lightweight "Coming
soon" placeholder — the Figma frame only details `Journey`, and the project
convention is not to fabricate metrics.

## Scope decisions (confirmed)

- **Canvas fidelity:** full flow editor (not presentational).
- **Graph engine:** `@xyflow/react` (React Flow v12) — new runtime dependency.
  React 18.3.1 satisfies its `react >=17` peer range.
- **Tabs:** `Journey` fully built; `Analytic` / `Log` are in-tab placeholders.
- **Persistence:** `localStorage` per automation, seeded from mock data.
- **Routing:** nested route `/orchestrator/:id`, deep-linkable.
- **Seed graphs:** one rich (`a1`, the "abandoned cart" flow from the frame),
  two smaller valid graphs (`a2`, `a3`).

## Routing

`src/routes.tsx` — add a nested child under the existing `orchestrator` route:

```tsx
{
  path: 'orchestrator',
  element: <OrchestratorScreen />,   // unchanged; still index at /orchestrator
},
{ path: 'orchestrator/:id', element: <AutomationDetailScreen /> },
```

- The `BUILT` set already contains `/orchestrator`; no change needed there.
- `AutomationDetailScreen` reads `:id` via `useParams`, looks it up in
  `AUTOMATIONS`. **Unknown id → `<Navigate to="/orchestrator" replace />`.**
- `OrchestratorScreen` table rows become clickable (row `onClick` +
  `useNavigate` to `/orchestrator/${a.id}`), with `role`/keyboard affordance.
  The existing On/Off toggle must **stop propagation** so toggling doesn't
  navigate.

## Component: `AutomationDetailScreen`

Layout: the same white rounded surface used by other screens
(`rounded-[26px] bg-white`), containing a top bar and the tab body.

**Top bar** (`DetailTopBar`, may be inline):
- Left: back arrow button (`ArrowLeft`, → `/orchestrator`), the automation
  `name` as an editable-looking title, a kebab menu button (`MoreHorizontal`,
  inert).
- Center: segmented tab group **Journey · Analytic · Log**. Real tab state via
  `useState<'journey' | 'analytic' | 'log'>('journey')`.
- Right: "Run A/B Test" pill button (dark `bg-ink`, inert).

**Tab body:**
- `journey` → `<JourneyCanvas automationId={id} />`.
- `analytic` / `log` → a small centered "Coming soon" block (reuse the tone of
  `PlaceholderScreen`; does not need to be that component).

## The flow editor (Journey tab)

### `JourneyCanvas`

Hosts `<ReactFlow>` from `@xyflow/react` inside a `ReactFlowProvider`. Imports
`@xyflow/react/dist/style.css` once (in this module or the styles entry).

Responsibilities:
- Load `{ nodes, edges }` from `useJourneyStorage(automationId)`.
- Wire `onNodesChange` / `onEdgesChange` / `onConnect` (React Flow helpers
  `applyNodeChanges` / `applyEdgeChanges` / `addEdge`) and persist on change.
- Register `nodeTypes` (start, rule, action, end) and `edgeTypes` (addButton).
- Render `<Background>` (subtle), `<Controls>` (bottom-left zoom +/- and
  fit-view, matching the frame). No minimap (not in the frame).
- Handle palette drag-drop: `onDragOver` (allow) + `onDrop` (read the dragged
  `PaletteItem` id from `dataTransfer`, project the drop point via
  `screenToFlowPosition`, append a new node of the mapped type).
- Render `<NodePalette>` as an absolutely-positioned right drawer with
  open/close state owned here.

### Custom node components (`journey/nodes/`)

All match the Figma node cards: `bg-white rounded-[16px]`, shadow
`0 2px 6px rgba(3,17,38,0.11), 0 0 1px rgba(0,12,32,0.04)`, `w-[280px]`,
`p-[12px]`. Each declares React Flow `<Handle>`s.

- **`StartNode`** — teal (`#8dcac6`) rounded icon chip + `Play` (lucide) +
  "Start" title; below, an event sub-row: `bg-[#f2f4f7] rounded-[4px]` with a
  small teal (`#079db7`) icon and the event text (`On Event: Cart abandoned`).
  Source handle (bottom). No target handle.
- **`RuleNode`** — yellow (`#ffd483`) icon chip + `GitBranch`/`Split` (lucide) +
  "If/Otherwise" title; bold title line (e.g. `Cart abandoned for > 24 hours`);
  then condition rows: a numbered row (`1`) with a `bg-[#f2f4f7]` condition
  chip (supports `$variable` fragments rendered in `#01567a`), and an
  "Otherwise" row. **Each branch (numbered + otherwise) is its own source
  handle** so edges can leave per-branch. Target handle (top).
- **`ActionNode`** — colored channel icon chip + kind label (Voice/Email/…) +
  bold description. Colors reuse `channel-meta.ts` where they match (Email
  `#247acb`, Voice `#be297b`). Target (top) + source (bottom) handles.
- **`EndNode`** — grey header band (`bg-[#f2f4f7]`, bottom border `#d2d3d8`)
  with a slate (`#d2d9e5`) icon chip + `Square` (lucide) + "End"; body shows
  "Ticket Tags:" (`text-[#545767]`) and a tag chip (`bg-[#e8e9eb]`,
  `rounded-[12px]`). Target handle only.

### Edges (`journey/edges/AddButtonEdge.tsx`)

- Smoothstep path, grey stroke, matching the frame's routing.
- Optional **branch label** ("1" / "Otherwise") rendered as a small pill at the
  label position (`bg-[#ebe8e6] border-[#f9f8f7] rounded-[4px] text-[11px]`).
- A centered **"+" add button** (white circle, subtle shadow) via
  `EdgeLabelRenderer`. Clicking it **opens the palette** (calls a handler
  passed through edge `data`). Not a no-op — it's the natural "insert node"
  gesture.

## Node palette (`journey/NodePalette.tsx`)

Right drawer matching the "Nodes" panel:
`bg-white/80 border-[#f2f4f7] rounded-[21px]` shell,
`shadow-[0_0_13px_rgba(0,0,0,0.04)]`.

- Header: "Nodes" title + close (`X`) button that toggles the drawer closed
  (parent state).
- Search input (`bg-[#f2f4f7] rounded-full`, `Search` icon) that
  **case-insensitively filters** palette cards by label; empty categories hide.
- Categorized cards from `PALETTE`: **Channel Agents** (Widget, Email, Voice),
  **Logic** (If/Otherwise, Human in the loop, Loop over items, On Schedule,
  Delay, End), **Triage models** (Injury severity, Language Detection,
  Sentiment Detection, Spam Detection). Each card: drag handle (`GripVertical`),
  colored icon chip, label. Cards are `draggable`; `onDragStart` writes the
  item id to `dataTransfer` for `JourneyCanvas.onDrop`.

Icons: **lucide-react** throughout (Play, Phone, Mail, Split/GitBranch, Square,
Plus, X, Search, GripVertical, Repeat, RefreshCw, CalendarCheck, Timer, etc.).
No remote Figma assets are committed. Do **not** introduce the `Plus Jakarta
Sans` font — the project deliberately uses the SF system stack.

## Data & persistence

### `journey/journey-data.ts`

Types and mock data. No backend.

```ts
export type JourneyNodeKind = 'start' | 'rule' | 'action' | 'end'
export type ActionChannel = 'voice' | 'email' | 'widget'

export type JourneyNodeData = {
  kind: JourneyNodeKind
  title: string
  // start
  event?: string
  // rule
  conditions?: { label: string; tokens?: string[] }[]
  // action
  channel?: ActionChannel
  actionLabel?: string       // "Voice" / "Email"
  description?: string
  // end
  ticketTags?: string[]
}

export type JourneyNode = { id; type; position: {x,y}; data: JourneyNodeData }
export type JourneyEdge = { id; source; target; sourceHandle?; label?: string }

export type PaletteItem = { id: string; label: string; color: string; icon: string }
export type NodeCategory = { title: string; items: PaletteItem[] }

export const PALETTE: NodeCategory[]                       // drawer catalog
export const SEED_JOURNEYS: Record<string, { nodes: JourneyNode[]; edges: JourneyEdge[] }>
```

- `SEED_JOURNEYS.a1` = the full "abandoned cart" graph transcribed from the
  frame (Start → Rule → [Voice branch → Rule → [Email → End] / [End]] /
  [Otherwise → End]). Positions taken/adapted from the frame coordinates.
- `a2`, `a3` = smaller valid graphs (e.g. Start → Rule → Action → End) so each
  row opens something coherent without authoring three elaborate flows.

### `journey/useJourneyStorage.ts`

```ts
function useJourneyStorage(automationId: string):
  { nodes; edges; setNodes; setEdges }
```

- Key: `orchestrator-journey-<automationId>-v1`.
- On mount: read from `window.localStorage?.` (guarded). If present and
  parseable, use it; else fall back to `SEED_JOURNEYS[automationId]` (or an
  empty graph if the id is unknown — though unknown ids redirect before this
  mounts).
- On change: write JSON back, guarded so jsdom (no localStorage) degrades to
  in-memory state without throwing. Mirrors the Home dashboard pattern
  (`home-dashboard-layout-v2`).

## Tokens

Map Figma hex → existing tokens where they exist; inline the genuinely one-off
values with an explanatory comment (consistent with the project's existing
inline colors in `AutomationTable.tsx`).

| Figma | Use | Mapping |
|-------|-----|---------|
| `#f2f4f7` | condition/search chip bg | inline (one-off slate) |
| `#ebe8e6` | branch label pill bg | inline (beige) |
| `#01567a` | `$variable` token text | inline (brand teal) |
| `#8dcac6` | Start icon chip | inline (`journey` color map) |
| `#ffd483` | Rule icon chip | inline (`journey` color map) |
| `#d2d9e5` | End icon chip | inline (`journey` color map) |
| `#247acb` / `#be297b` | Email / Voice chips | reuse `channel-meta.ts` |
| card shadow | node cards | inline shadow literal |
| `text-ink`, `text-ink-muted`, `border-surface-border` | text/borders | existing tokens |

## File layout

```
src/features/orchestrator/
  OrchestratorScreen.tsx            (edit: rows navigate)
  AutomationDetailScreen.tsx        (new) (+ .test)
  journey/
    JourneyCanvas.tsx               (new) (+ .test)
    NodePalette.tsx                 (new) (+ .test)
    journey-data.ts                 (new) (+ .test)
    useJourneyStorage.ts            (new) (+ .test)
    nodes/
      StartNode.tsx
      RuleNode.tsx
      ActionNode.tsx
      EndNode.tsx
    edges/
      AddButtonEdge.tsx
```

## Testing (Vitest + RTL, jsdom)

React Flow relies on DOM measurement; canvas tests wrap the subtree in
`ReactFlowProvider` and assert **structure/behavior**, not pixel layout.

- **Routing** (`orchestrator.routes` / detail test): clicking an automation row
  navigates to `/orchestrator/:id`; an unknown id redirects to `/orchestrator`.
- **Tabs:** default `Journey`; clicking `Analytic` / `Log` shows the
  placeholder and hides the canvas.
- **Row click vs toggle:** toggling On/Off does not navigate
  (stop-propagation).
- **Palette:** renders the three categories; typing in search filters cards;
  the `X` button toggles the drawer closed.
- **Custom nodes:** each node renderer shows its expected text given seed data
  (Start event, Rule title/conditions, Action description, End tags).
- **Storage hook:** returns the seed graph for a known id on first load;
  degrades to in-memory when `localStorage` is unavailable.

## Non-goals

- No backend; all data mocked/in-memory + localStorage.
- No `Analytic` / `Log` content (placeholders only).
- No A/B test, kebab menu, or title-edit behavior (inert affordances).
- No minimap.
