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

type Cell = TopicRow | TopicSub

function tooltipData(cell: Cell): TreemapTooltipData {
  const volume = cell.tickets.toLocaleString('en-US')
  // Top-level rows carry firstContactResolution + numeric sentiment; sub-topics
  // reuse their leaf metrics with representative fallbacks.
  const isTop = 'firstContactResolution' in cell
  return {
    name: cell.name,
    color: 'color' in cell ? cell.color : '#8b8e89',
    volume,
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
  const hovered = hoverId ? byId[hoverId] : null

  return (
    <section data-testid="topics-treemap" className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        <button
          type="button"
          onClick={() => setDrillId(null)}
          className={drilled ? 'text-ink-muted underline-offset-2 hover:underline' : 'font-medium text-ink'}
        >
          All topics
        </button>
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
          const color = 'color' in cell ? cell.color : (drilled?.color ?? '#8b8e89')
          const isTop = !drilled
          return (
            <button
              type="button"
              key={p.id}
              aria-label={cell.name}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId((h) => (h === p.id ? null : h))}
              onClick={isTop ? () => setDrillId(p.id) : undefined}
              className="absolute overflow-hidden border border-white/40 text-left"
              style={{ left: p.x, top: p.y, width: p.w, height: p.h, backgroundColor: color }}
            >
              {showLabel && (
                <span className="block p-2 text-[13px] font-medium leading-tight text-white">
                  {cell.name}
                  <span className="block font-normal text-white/80">
                    {cell.tickets.toLocaleString('en-US')} ({cell.ticketsPct})
                  </span>
                </span>
              )}
            </button>
          )
        })}

        {/* Hover tooltip, anchored top-left of the canvas (clamped by overflow-hidden). */}
        {hovered && (
          <div className="absolute left-3 top-3 z-10">
            <TreemapTooltip data={tooltipData(hovered)} />
          </div>
        )}
      </div>
    </section>
  )
}
