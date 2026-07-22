import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Phone, Mail, MessageSquare } from 'lucide-react'
import { CARD, type JourneyNodeData } from './shared'

const CHANNEL: Record<string, { color: string; Icon: typeof Phone }> = {
  voice: { color: '#be297b', Icon: Phone },
  email: { color: '#247acb', Icon: Mail },
  widget: { color: '#e05c34', Icon: MessageSquare },
}

export function ActionNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  const meta = CHANNEL[d.channel ?? 'widget'] ?? CHANNEL.widget
  const Icon = meta.Icon
  return (
    <div className={CARD}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: meta.color }}>
          <Icon size={16} className="text-white" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">{d.actionLabel}</span>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-black">{d.description}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
