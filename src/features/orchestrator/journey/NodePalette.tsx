import { useState } from 'react'
import {
  X, Search, GripVertical, MessageSquare, Mail, Phone, Split, Repeat,
  RefreshCw, CalendarCheck, Timer, Square, Activity, Languages, Smile, ShieldAlert,
} from 'lucide-react'
import { PALETTE, type PaletteIconName, type PaletteItem } from './journey-data'

export const PALETTE_DND_TYPE = 'application/journey-node'

const ICONS: Record<PaletteIconName, typeof Mail> = {
  MessageSquare, Mail, Phone, Split, Repeat, RefreshCw, CalendarCheck,
  Timer, Square, Activity, Languages, Smile, ShieldAlert,
}

function Card({ item }: { item: PaletteItem }) {
  const Icon = ICONS[item.icon]
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_DND_TYPE, item.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="flex cursor-grab items-center gap-2.5 rounded-md border bg-white p-3"
      style={{ borderColor: '#e4e7f0' }}
    >
      <GripVertical size={16} className="text-grey-400" aria-hidden />
      <span className="flex items-center justify-center rounded-[16px] p-1.5" style={{ background: item.color }}>
        <Icon size={16} className="text-white" aria-hidden />
      </span>
      <span className="text-[12px] font-semibold text-black">{item.label}</span>
    </div>
  )
}

export function NodePalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const categories = PALETTE
    .map((c) => ({ ...c, items: c.items.filter((i) => i.label.toLowerCase().includes(q)) }))
    .filter((c) => c.items.length > 0)

  return (
    <div className="flex w-[340px] flex-col gap-4 rounded-[21px] border bg-white/80 p-5 shadow-[0px_0px_13px_0px_rgba(0,0,0,0.04)]" style={{ borderColor: '#f2f4f7' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-black">Nodes</h2>
        <button type="button" aria-label="Close node palette" onClick={onClose}>
          <X size={17} className="text-ink" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#f2f4f7' }}>
        <Search size={16} className="text-grey-500" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-[12px] text-black outline-none placeholder:text-grey-500"
        />
      </div>
      {categories.map((c) => (
        <div key={c.title} className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-black">{c.title}</p>
          {c.items.map((item) => <Card key={item.id} item={item} />)}
        </div>
      ))}
    </div>
  )
}
