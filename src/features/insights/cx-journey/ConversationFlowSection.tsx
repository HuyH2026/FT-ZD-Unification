// src/features/insights/cx-journey/ConversationFlowSection.tsx
import { useEffect, useRef, useState } from 'react'
import { Layer, Rectangle, Sankey } from 'recharts'
import { FLOW_HEADER, FLOW_SANKEY } from './cx-journey-data'
import { FilterRow } from './FilterRow'

// recharts Sankey requires explicit pixel dimensions; measure the container and
// only render once we have a real size (avoids zero-size warnings in tests).
function useMeasured() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, size }
}

// Colored ribbon between two nodes.
function FlowLink(props: any) {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index } = props
  const color = FLOW_SANKEY.links[index]?.color ?? '#9aa0a6'
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={color}
      strokeWidth={linkWidth}
      strokeOpacity={0.35}
    />
  )
}

// Node bar + label (name / value / pct) drawn to the right or left of the bar.
function FlowNode(props: any) {
  const { x, y, width, height, index, containerWidth } = props
  const node = FLOW_SANKEY.nodes[index]
  const isRightHalf = x + width / 2 > containerWidth / 2
  const labelX = isRightHalf ? x - 6 : x + width + 6
  const anchor = isRightHalf ? 'end' : 'start'
  return (
    <Layer>
      <Rectangle x={x} y={y} width={width} height={height} fill="#293239" fillOpacity={0.85} />
      <text x={labelX} y={y + height / 2 - 6} textAnchor={anchor} fontSize={11} fill="#8b8e89">
        {node?.name}
        {node?.pct ? ` ${node.pct}` : ''}
      </text>
      <text x={labelX} y={y + height / 2 + 9} textAnchor={anchor} fontSize={13} fontWeight={600} fill="#2f3130">
        {node?.value}
      </text>
    </Layer>
  )
}

export function ConversationFlowSection() {
  const { ref, size } = useMeasured()
  return (
    <section className="flex flex-col gap-4">
      <FilterRow title="Total conversations (AI + Human)" />
      <div className="rounded-2xl bg-app-backdrop p-6">
        <div className="mb-6 flex flex-wrap gap-x-20 gap-y-4">
          {FLOW_HEADER.map((stat) => (
            <div key={stat.label}>
              <p className="text-[13px] text-ink-muted">{stat.label}</p>
              <p className="text-[28px] font-semibold text-ink">
                {stat.value}
                {stat.pct ? <span className="ml-1 text-ink-muted">({stat.pct})</span> : null}
              </p>
            </div>
          ))}
        </div>
        <div ref={ref} className="h-[220px] w-full">
          {size.width > 0 && size.height > 0 && (
            <Sankey
              width={size.width}
              height={size.height}
              data={{
                nodes: FLOW_SANKEY.nodes.map((n) => ({ name: n.name })),
                links: FLOW_SANKEY.links.map((l) => ({ source: l.source, target: l.target, value: l.value })),
              }}
              node={<FlowNode containerWidth={size.width} />}
              link={<FlowLink />}
              nodePadding={28}
              margin={{ top: 10, bottom: 10, left: 90, right: 90 }}
            />
          )}
        </div>
      </div>
    </section>
  )
}
