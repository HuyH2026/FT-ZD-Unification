// Treemap view for the Topics tab. Measures its container, lays out cells with
// `squarify` sized by ticket volume, and renders colored rectangles with a hover
// tooltip. Clicking a top-level cell drills into that topic's sub-topics; a
// breadcrumb returns to the top level. Mirrors FlowSankey's measured-viz pattern.
import { useEffect, useRef, useState } from 'react'
import { squarify } from './treemap-layout'
import { TOPIC_ROWS, type TopicRow, type TopicSub } from './topics-data'
import { TreemapTooltip, type TreemapTooltipData } from './TreemapTooltip'

// Below this cell area (px²) the in-cell label is hidden — matches the reference
// where thin cells carry no text.
const MIN_LABEL_AREA = 5000
// Grey fallback for a cell with no resolvable color (defensive — all top-level
// rows carry a color and drilled cells derive one from their parent).
const FALLBACK_COLOR = '#8b8e89'
// Approximate tooltip footprint, used to clamp it inside the canvas so it never
// spills past the edges. The card itself is a fixed 273px wide (TreemapTooltip).
const TOOLTIP_W = 273
const TOOLTIP_H = 224
// How far the deepest sub-topic tint is lightened toward white (0 = parent hue).
const MAX_TINT = 0.55

function useMeasured(seed: { width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(seed)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, size }
}

// Mix a #rrggbb hex toward white by `amount` (0 → unchanged, 1 → white). Used to
// tint a topic's sub-cells into a readable one-family ramp.
function tint(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const channel = (i: number) => parseInt(h.slice(i, i + 2), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const to2 = (n: number) => n.toString(16).padStart(2, '0')
  return `#${to2(mix(channel(0)))}${to2(mix(channel(2)))}${to2(mix(channel(4)))}`
}

type Cell = TopicRow | TopicSub

function tooltipData(cell: Cell, color: string): TreemapTooltipData {
  // Top-level rows carry firstContactResolution + numeric sentiment; sub-topics
  // reuse their leaf metrics with representative fallbacks.
  const isTop = 'firstContactResolution' in cell
  return {
    name: cell.name,
    color,
    volume: cell.tickets.toLocaleString('en-US'),
    volumePct: cell.ticketsPct ?? '',
    firstContactResolution: isTop ? (cell as TopicRow).firstContactResolution : '—',
    avgFirstResTime: cell.avgFirstResTime,
    avgFullResTime: cell.avgFullResTime,
    sentiment: isTop ? (cell as TopicRow).sentiment : 50,
    agentReplyTime: cell.agentReplyTime,
    agentReplies: cell.agentReplies,
  }
}

export function TopicTreemap({ initialSize = { width: 0, height: 0 } }: { initialSize?: { width: number; height: number } }) {
  const { ref, size } = useMeasured(initialSize)
  const [drillId, setDrillId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const drilled = drillId ? TOPIC_ROWS.find((r) => r.id === drillId) ?? null : null
  const cells: Cell[] = drilled ? drilled.children : TOPIC_ROWS
  const placed = squarify(cells.map((c) => ({ id: c.id, value: c.tickets })), size)
  const byId = Object.fromEntries(cells.map((c) => [c.id, c]))

  // Resolve each cell's color once: top-level cells use their own hue; drilled
  // sub-cells step through a lightening ramp of the parent's hue so the group
  // reads as one family.
  const colorById: Record<string, string> = {}
  cells.forEach((c, i) => {
    if (drilled) {
      const amount = cells.length > 1 ? (i / (cells.length - 1)) * MAX_TINT : 0
      colorById[c.id] = tint(drilled.color, amount)
    } else {
      colorById[c.id] = (c as TopicRow).color ?? FALLBACK_COLOR
    }
  })

  // In-cell percentage is derived from the cell's share of this level's volume so
  // the label matches the rectangle's actual area (rather than a hand-authored
  // figure that can drift from the geometry).
  const totalTickets = cells.reduce((s, c) => s + Math.max(c.tickets, 0), 0)
  const areaPct = (tickets: number) => (totalTickets > 0 ? ((Math.max(tickets, 0) / totalTickets) * 100).toFixed(1) : '0.0')

  const hovered = hoverId ? byId[hoverId] : null
  const hoveredPlaced = hoverId ? placed.find((p) => p.id === hoverId) ?? null : null
  // Anchor the tooltip to the hovered cell, offset slightly, clamped inside the canvas.
  const tipX = hoveredPlaced ? Math.min(Math.max(hoveredPlaced.x + 8, 0), Math.max(size.width - TOOLTIP_W, 0)) : 0
  const tipY = hoveredPlaced ? Math.min(Math.max(hoveredPlaced.y + 8, 0), Math.max(size.height - TOOLTIP_H, 0)) : 0

  return (
    <section data-testid="topics-treemap" className="flex flex-col gap-3">
      {/* Breadcrumb — "All topics" is only interactive while drilled in. */}
      <div className="flex items-center gap-1.5 text-[13px]">
        {drilled ? (
          <button
            type="button"
            onClick={() => setDrillId(null)}
            className="text-ink-muted underline-offset-2 hover:underline"
          >
            All topics
          </button>
        ) : (
          <span className="font-medium text-ink">All topics</span>
        )}
        {drilled && (
          <>
            <span className="text-ink-muted">/</span>
            <span className="font-medium text-ink">{drilled.name}</span>
          </>
        )}
      </div>

      {/* Measured treemap canvas */}
      <div ref={ref} className="relative h-[480px] w-full overflow-hidden rounded-xl border border-surface-border">
        {placed.map((p) => {
          const cell = byId[p.id]
          if (!cell) return null
          const showLabel = p.w * p.h >= MIN_LABEL_AREA
          const color = colorById[p.id] ?? FALLBACK_COLOR
          // Only top-level cells drill, so only they are interactive buttons;
          // sub-cells are plain (non-focusable) regions that still show a tooltip.
          const canDrill = !drilled
          const label = (
            showLabel && (
              <span className="block p-2 text-[13px] font-medium leading-tight text-white">
                {cell.name}
                <span className="block font-normal text-white/80">
                  {cell.tickets.toLocaleString('en-US')} ({areaPct(cell.tickets)}%)
                </span>
              </span>
            )
          )
          const commonProps = {
            'aria-label': cell.name,
            'data-treemap-cell': cell.id,
            onMouseEnter: () => setHoverId(p.id),
            onMouseLeave: () => setHoverId((h) => (h === p.id ? null : h)),
            style: { left: p.x, top: p.y, width: p.w, height: p.h, backgroundColor: color },
          }
          return canDrill ? (
            <button
              type="button"
              key={p.id}
              {...commonProps}
              onClick={() => setDrillId(p.id)}
              className="absolute cursor-pointer overflow-hidden border border-white/40 text-left"
            >
              {label}
            </button>
          ) : (
            <div
              key={p.id}
              {...commonProps}
              className="absolute overflow-hidden border border-white/40 text-left"
            >
              {label}
            </div>
          )
        })}

        {/* Hover tooltip, anchored to the hovered cell and clamped to the canvas. */}
        {hovered && hoveredPlaced && (
          <div className="pointer-events-none absolute z-10" style={{ left: tipX, top: tipY }}>
            <TreemapTooltip data={tooltipData(hovered, colorById[hovered.id] ?? FALLBACK_COLOR)} />
          </div>
        )}
      </div>
    </section>
  )
}
