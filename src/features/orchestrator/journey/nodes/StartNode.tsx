import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play, Zap } from 'lucide-react'
import { CARD, type JourneyNodeData } from './shared'

export function StartNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: '#8dcac6' }}>
          <Play size={16} className="text-white" fill="currentColor" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">{d.title}</span>
      </div>
      {d.event && (
        <div className="mt-3 flex items-center gap-2 rounded-[4px] p-2" style={{ background: '#f2f4f7' }}>
          <span className="flex items-center justify-center rounded-full p-1" style={{ background: '#079db7' }}>
            <Zap size={12} className="text-white" aria-hidden />
          </span>
          <span className="text-[12px] font-medium text-black">{d.event}</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
