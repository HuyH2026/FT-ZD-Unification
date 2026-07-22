// Right-side palette of draggable step types. Each row is a react-dnd drag
// source; drops are handled by the policy inline zone and the block canvas.
import { X, GripVertical } from 'lucide-react'
import { useDrag } from 'react-dnd'
import { STEP_TYPES, type StepType } from '../agent-store'
import { STEP_ICON } from './editor-data'

export const EDITOR_DND_TYPE = 'editor-step'
export type StepDragItem = { stepType: StepType }

function PaletteRow({ stepType, label }: { stepType: StepType; label: string }) {
  const Icon = STEP_ICON[stepType]
  const [{ isDragging }, drag] = useDrag({
    type: EDITOR_DND_TYPE,
    item: (): StepDragItem => ({ stepType }),
    collect: (m) => ({ isDragging: m.isDragging() }),
  })
  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="flex cursor-grab items-center gap-3 rounded-xl border border-surface-border bg-white px-4 py-3 active:cursor-grabbing"
    >
      <GripVertical size={16} className="text-ink-muted" aria-hidden />
      <Icon size={18} className="text-ink" aria-hidden />
      <span className="text-[14px] text-ink">{label}</span>
    </div>
  )
}

export function StepsPalette({ onClose }: { onClose: () => void }) {
  return (
    <aside className="flex w-[380px] shrink-0 flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-medium text-ink">Steps</h2>
        <button type="button" aria-label="Close steps" onClick={onClose} className="text-ink-muted">
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {STEP_TYPES.map((s) => (
          <PaletteRow key={s.type} stepType={s.type} label={s.label} />
        ))}
      </div>
    </aside>
  )
}
