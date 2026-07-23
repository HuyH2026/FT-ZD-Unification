// The block canvas below the policy prose. Accepts step drops (append a block
// card), supports reordering existing cards, removing them, and — for
// condition-type blocks — an expandable body of editable/removable rows.
import { useRef } from 'react'
import { X, GripVertical, ChevronDown, ChevronUp, CircleAlert, Plus } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import {
  appendBlock, moveBlock, removeBlock, nextId,
  addConditionRow, editConditionRow, removeConditionRow, toggleBlockCollapse,
  type CanvasBlock, type ConditionRow,
} from '../agent-store'
import { STEP_ICON, STEP_BADGE } from './editor-data'
import { EDITOR_DND_TYPE, type StepDragItem } from './StepsPalette'

const REORDER_TYPE = 'editor-block'
type ReorderItem = { index: number }

const isOtherwise = (label: string) => label.trim().toLowerCase().startsWith('otherwise')

function ConditionRowView({
  row, number, onEdit, onRemove,
}: {
  row: ConditionRow
  number: number | null
  onEdit: (label: string) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-surface-border bg-white px-4 py-2.5">
      {number !== null && (
        <span className="text-[14px] font-semibold text-ink">{number}.</span>
      )}
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent ?? '')}
        className="flex-1 text-[14px] outline-none"
        style={{ color: number === null ? '#8b8e89' : '#2f3130' }}
      >
        {row.label}
      </span>
      {number !== null && <CircleAlert size={20} className="shrink-0" style={{ color: '#feca63' }} aria-hidden />}
      <button
        type="button"
        aria-label={`Remove ${row.label}`}
        onClick={onRemove}
        className="shrink-0 text-ink-muted hover:text-ink"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}

function ConditionBody({
  block, onEditRow, onRemoveRow, onAddRow,
}: {
  block: CanvasBlock
  onEditRow: (rowId: string, label: string) => void
  onRemoveRow: (rowId: string) => void
  onAddRow: () => void
}) {
  const rows = block.rows ?? []
  const HeaderIcon = STEP_ICON.condition
  const badge = STEP_BADGE.condition

  // Number only the non-"Otherwise…" rows, in order.
  let n = 0
  return (
    <div className="rounded-lg border border-surface-border bg-white">
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="flex size-8 items-center justify-center rounded-2xl" style={{ backgroundColor: badge.bg, color: badge.fg }}>
          <HeaderIcon size={16} aria-hidden />
        </span>
        <span className="text-[11px] font-semibold tracking-tight text-grey-700">{block.header ?? 'Conditions'}</span>
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4 pt-2">
        {block.subtitle && <p className="text-[14px] font-medium text-ink">{block.subtitle}</p>}
        {rows.map((row) => {
          const number = isOtherwise(row.label) ? null : ++n
          return (
            <ConditionRowView
              key={row.id}
              row={row}
              number={number}
              onEdit={(label) => onEditRow(row.id, label)}
              onRemove={() => onRemoveRow(row.id)}
            />
          )
        })}
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-[13px] font-medium text-blue-700 hover:bg-[#f4f3f1]"
        >
          <Plus size={14} aria-hidden /> Add condition
        </button>
      </div>
    </div>
  )
}

function BlockCard({
  block, index, onMove, onRemove, onToggleCollapse, onEditRow, onRemoveRow, onAddRow,
}: {
  block: CanvasBlock; index: number
  onMove: (from: number, to: number) => void
  onRemove: (id: string) => void
  onToggleCollapse: (id: string) => void
  onEditRow: (blockId: string, rowId: string, label: string) => void
  onRemoveRow: (blockId: string, rowId: string) => void
  onAddRow: (blockId: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const Icon = STEP_ICON[block.stepType]
  const badge = STEP_BADGE[block.stepType]
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

  const expandable = block.stepType === 'condition'
  const expanded = expandable && !block.collapsed
  const Chevron = block.collapsed ? ChevronDown : ChevronUp

  return (
    <div ref={ref} className="rounded-2xl border border-surface-border bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={16} className="cursor-grab text-ink-muted" aria-hidden />
        <span className="flex size-7 items-center justify-center rounded-full" style={{ backgroundColor: badge.bg, color: badge.fg }}>
          <Icon size={16} aria-hidden />
        </span>
        <span className="flex-1 text-[14px] font-medium text-ink">{block.title}</span>
        {expandable && (
          <button
            type="button"
            aria-label={block.collapsed ? `Expand ${block.title}` : `Collapse ${block.title}`}
            aria-expanded={expanded}
            onClick={() => onToggleCollapse(block.id)}
            className="text-ink-muted hover:text-ink"
          >
            <Chevron size={18} aria-hidden />
          </button>
        )}
        <button type="button" aria-label={`Remove ${block.title}`} onClick={() => onRemove(block.id)} className="text-ink-muted hover:text-ink">
          <X size={16} aria-hidden />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <ConditionBody
            block={block}
            onEditRow={(rowId, label) => onEditRow(block.id, rowId, label)}
            onRemoveRow={(rowId) => onRemoveRow(block.id, rowId)}
            onAddRow={() => onAddRow(block.id)}
          />
        </div>
      )}
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
          onToggleCollapse={(id) => onChange(toggleBlockCollapse(blocks, id))}
          onEditRow={(blockId, rowId, label) => onChange(editConditionRow(blocks, blockId, rowId, label))}
          onRemoveRow={(blockId, rowId) => onChange(removeConditionRow(blocks, blockId, rowId))}
          onAddRow={(blockId) => onChange(addConditionRow(blocks, blockId, { id: nextId('r'), label: 'Condition description' }))}
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
