import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'

export function AddButtonEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data } = props
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  })
  const onAdd = (data as { onAdd?: () => void } | undefined)?.onAdd
  return (
    <>
      <BaseEdge id={props.id} path={path} style={{ stroke: '#c9c7c3' }} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute flex flex-col items-center gap-1"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
        >
          {label && (
            <span
              className="rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold text-black"
              style={{ background: '#ebe8e6', borderColor: '#f9f8f7' }}
            >
              {label}
            </span>
          )}
          <button
            type="button"
            aria-label="Add node"
            onClick={onAdd}
            className="flex size-6 items-center justify-center rounded-full bg-white shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]"
          >
            <Plus size={14} className="text-ink" aria-hidden />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
