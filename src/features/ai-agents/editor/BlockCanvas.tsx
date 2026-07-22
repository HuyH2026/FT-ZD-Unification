// The block canvas below the policy prose. Accepts step drops (append a block
// card), supports reordering existing cards, and removing them.
import { useRef } from 'react'
import { X, GripVertical } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import {
  appendBlock, moveBlock, removeBlock, nextId,
  type CanvasBlock,
} from '../agent-store'
import { STEP_ICON } from './editor-data'
import { EDITOR_DND_TYPE, type StepDragItem } from './StepsPalette'

const REORDER_TYPE = 'editor-block'
type ReorderItem = { index: number }

function BlockCard({
  block, index, onMove, onRemove,
}: {
  block: CanvasBlock; index: number
  onMove: (from: number, to: number) => void
  onRemove: (id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const Icon = STEP_ICON[block.stepType]
  const [, drag] = useDrag({ type: REORDER_TYPE, item: (): ReorderItem => ({ index }) })
  const [, drop] = useDrop<ReorderItem>({
    accept: REORDER_TYPE,
    hover: (item) => {
      if (item.index === index) return
      onMove(item.index, index)
      item.index = index
    },
  })
  drag(drop(ref))
  return (
    <div ref={ref} className="flex items-center gap-3 rounded-2xl border border-surface-border bg-white px-4 py-3">
      <GripVertical size={16} className="cursor-grab text-ink-muted" aria-hidden />
      <Icon size={18} className="text-ink" aria-hidden />
      <span className="flex-1 text-[14px] font-medium text-ink">{block.title}</span>
      <button type="button" aria-label={`Remove ${block.title}`} onClick={() => onRemove(block.id)} className="text-ink-muted hover:text-ink">
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}

export function BlockCanvas({ blocks, onChange }: { blocks: CanvasBlock[]; onChange: (blocks: CanvasBlock[]) => void }) {
  const [{ isOver }, drop] = useDrop<StepDragItem, void, { isOver: boolean }>({
    accept: EDITOR_DND_TYPE,
    collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
    drop: (item) => {
      const n = blocks.length + 1
      const title = `Untitled classic block ${String(n).padStart(2, '0')}`
      onChange(appendBlock(blocks, { id: nextId('b'), stepType: item.stepType, title }))
    },
  })

  return (
    <div className="mt-6 flex flex-col gap-3">
      {blocks.map((b, i) => (
        <BlockCard
          key={b.id}
          block={b}
          index={i}
          onMove={(from, to) => onChange(moveBlock(blocks, from, to))}
          onRemove={(id) => onChange(removeBlock(blocks, id))}
        />
      ))}
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className="flex h-16 items-center justify-center rounded-2xl border-2 border-dashed text-[13px] transition-colors"
        style={{ borderColor: isOver ? '#1f73b7' : '#e2e0dd', color: '#8b8e89', backgroundColor: isOver ? '#1f73b70a' : 'transparent' }}
      >
        Drop a step here to add a block
      </div>
    </div>
  )
}
