// The Autoflow policy editor: a formatting toolbar over a document of prose
// segments (editable) interleaved with static entity chips. A react-dnd drop
// zone at the end of the prose inserts a chip derived from the dragged step.
import {
  Undo2, Redo2, Bold, Italic, Underline, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Code2, Link2, Plus,
} from 'lucide-react'
import { useDrop } from 'react-dnd'
import {
  chipVariantForStep, nextId, removeChip, insertChip, STEP_TITLE,
  type PolicyDoc, type PolicySegment,
} from '../agent-store'
import { PolicyChipView } from './PolicyChipView'
import { EDITOR_DND_TYPE, type StepDragItem } from './StepsPalette'

const TOOLBAR = [Undo2, Redo2, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, Quote, Code2, Link2]

export function PolicyEditor({ doc, onChange }: { doc: PolicyDoc; onChange: (doc: PolicyDoc) => void }) {
  const editProse = (id: string, text: string) =>
    onChange({ ...doc, segments: doc.segments.map((s) => (s.kind === 'prose' && s.id === id ? { ...s, text } : s)) })

  const [{ isOver }, drop] = useDrop<StepDragItem, void, { isOver: boolean }>({
    accept: EDITOR_DND_TYPE,
    collect: (m) => ({ isOver: m.isOver() }),
    drop: (item) => {
      const chip = { kind: 'chip' as const, id: nextId('c'), variant: chipVariantForStep(item.stepType), label: STEP_TITLE[item.stepType] }
      onChange(insertChip(doc, doc.segments.length, chip))
    },
  })

  return (
    <div className="flex flex-1 flex-col">
      {/* Formatting toolbar */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-surface-border bg-white px-3 py-2">
        {TOOLBAR.map((Icon, i) => (
          <button key={i} type="button" className="rounded p-1.5 text-ink-muted hover:bg-[#f4f3f1]" tabIndex={-1}>
            <Icon size={18} aria-hidden />
          </button>
        ))}
        <button type="button" className="ml-2 flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-[14px] text-ink">
          <Plus size={16} aria-hidden /> Insert
        </button>
      </div>

      <h2 className="mb-4 text-[20px] font-medium text-ink">{doc.title}</h2>

      {/* Document: prose segments (editable) + inline chips */}
      <div className="text-[16px] leading-8 text-ink">
        {doc.segments.map((seg: PolicySegment) =>
          seg.kind === 'prose' ? (
            <span
              key={seg.id}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => editProse(seg.id, e.currentTarget.textContent ?? '')}
              className="whitespace-pre-wrap outline-none"
            >
              {seg.text}
            </span>
          ) : (
            <PolicyChipView key={seg.id} chip={seg} onRemove={(id) => onChange(removeChip(doc, id))} />
          ),
        )}
      </div>

      {/* Inline drop zone */}
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className="mt-4 flex h-10 items-center justify-center rounded-lg border-2 border-dashed text-[13px] transition-colors"
        style={{ borderColor: isOver ? '#1f73b7' : '#e2e0dd', color: '#8b8e89', backgroundColor: isOver ? '#1f73b70a' : 'transparent' }}
      >
        Drop it here
      </div>
    </div>
  )
}
