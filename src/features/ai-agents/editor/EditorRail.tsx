// The slim far-right tool rail (per Figma). A selectable set of glyphs; the
// "layers" item shows the Steps palette, any other selection hides it. Panels
// beyond Steps are not specced in the design, so they are intentionally empty.
import {
  ListTree, BadgeCheck, Layers, Zap, FileText, Route,
  Rows3, Wand2, Table2, Sparkles, type LucideIcon,
} from 'lucide-react'

export type RailKey =
  | 'outline' | 'checks' | 'steps' | 'triggers' | 'notes'
  | 'routing' | 'cards' | 'enhance' | 'data' | 'ai'

const TOP: { key: RailKey; label: string; Icon: LucideIcon }[] = [
  { key: 'outline', label: 'Outline', Icon: ListTree },
  { key: 'checks', label: 'Checks', Icon: BadgeCheck },
]

const MID: { key: RailKey; label: string; Icon: LucideIcon }[] = [
  { key: 'steps', label: 'Steps', Icon: Layers },
  { key: 'triggers', label: 'Triggers', Icon: Zap },
  { key: 'notes', label: 'Notes', Icon: FileText },
  { key: 'routing', label: 'Routing', Icon: Route },
  { key: 'cards', label: 'Cards', Icon: Rows3 },
]

const BOTTOM: { key: RailKey; label: string; Icon: LucideIcon }[] = [
  { key: 'enhance', label: 'Enhance', Icon: Wand2 },
  { key: 'data', label: 'Data', Icon: Table2 },
  { key: 'ai', label: 'AI', Icon: Sparkles },
]

function RailButton({
  item, selected, onSelect,
}: {
  item: { key: RailKey; label: string; Icon: LucideIcon }
  selected: boolean
  onSelect: (k: RailKey) => void
}) {
  const { Icon } = item
  return (
    <button
      type="button"
      aria-label={item.label}
      aria-pressed={selected}
      onClick={() => onSelect(item.key)}
      className="flex size-8 items-center justify-center rounded-lg"
      style={{
        backgroundColor: selected ? '#ebf5f7' : 'transparent',
        color: selected ? '#1f73b7' : '#545767',
      }}
    >
      <Icon size={16} aria-hidden />
    </button>
  )
}

export function EditorRail({ selected, onSelect }: { selected: RailKey; onSelect: (k: RailKey) => void }) {
  return (
    <aside
      aria-label="Editor tools"
      className="flex w-14 shrink-0 flex-col items-center gap-2 border-l border-surface-border bg-white py-5"
    >
      {TOP.map((item) => (
        <RailButton key={item.key} item={item} selected={selected === item.key} onSelect={onSelect} />
      ))}
      <span className="my-1 h-px w-8 bg-surface-border" aria-hidden />
      {MID.map((item) => (
        <RailButton key={item.key} item={item} selected={selected === item.key} onSelect={onSelect} />
      ))}
      <span className="my-1 h-px w-8 bg-surface-border" aria-hidden />
      {BOTTOM.map((item) => (
        <RailButton key={item.key} item={item} selected={selected === item.key} onSelect={onSelect} />
      ))}
    </aside>
  )
}
