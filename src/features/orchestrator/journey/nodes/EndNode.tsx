import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Square } from 'lucide-react'
import { type JourneyNodeData } from './shared'

export function EndNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  return (
    <div className="w-[280px] overflow-hidden rounded-[16px] bg-white shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 border-b p-2.5" style={{ background: '#f2f4f7', borderColor: '#d2d3d8' }}>
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: '#d2d9e5' }}>
          <Square size={16} className="text-black" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">{d.title}</span>
      </div>
      {d.ticketTags && d.ticketTags.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3">
          <span className="text-[12px] font-medium" style={{ color: '#545767' }}>Ticket Tags:</span>
          {d.ticketTags.map((t) => (
            <span key={t} className="w-fit rounded-[12px] px-2 py-1 text-[12px] font-medium text-black" style={{ background: '#e8e9eb' }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
