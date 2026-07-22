import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Split } from 'lucide-react'
import { CARD, type JourneyNodeData } from './shared'

function ConditionChip({ label, tokens }: { label: string; tokens?: string[] }) {
  return (
    <div className="flex-1 rounded-[4px] p-2 text-[12px]" style={{ background: '#f2f4f7' }}>
      {tokens?.map((t) => (
        <span key={t} className="mr-1 font-medium" style={{ color: '#01567a' }}>{t}</span>
      ))}
      {label && <span className="font-medium text-black">{label}</span>}
    </div>
  )
}

export function RuleNode({ data }: NodeProps) {
  const d = data as JourneyNodeData
  const conditions = d.conditions ?? []
  return (
    <div className={CARD}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: '#ffd483' }}>
          <Split size={16} className="text-black" aria-hidden />
        </span>
        <span className="text-[12px] font-medium text-black">If/Otherwise</span>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-black">{d.title}</p>
      <div className="mt-3 flex flex-col gap-1">
        {conditions.map((c, i) => (
          <div key={i} className="relative flex items-center gap-2">
            <span className="text-[12px] font-medium text-black">{i + 1}</span>
            <ConditionChip label={c.label} tokens={c.tokens} />
            <Handle type="source" id={`c${i}`} position={Position.Bottom} style={{ left: '75%' }} />
          </div>
        ))}
        <div className="relative flex items-center justify-end">
          <div className="w-[243px] rounded-[4px] p-2 text-[12px] font-medium text-black" style={{ background: '#f2f4f7' }}>
            Otherwise
          </div>
          <Handle type="source" id="otherwise" position={Position.Bottom} style={{ left: '90%' }} />
        </div>
      </div>
    </div>
  )
}
