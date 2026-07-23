// Inert toolbar for the Error tab: a "Conversation ID" field selector adjoined
// to a keyword search, a "Filter by" dropdown, a "Show muted alerts" button,
// then right-aligned "Alert management" + columns/rows icon buttons.
import { Bell, BellOff, ChevronDown, Columns3, ListFilter, Menu, Search } from 'lucide-react'

export function ErrorToolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-[20px] border border-surface-border bg-white">
          <button type="button" className="flex items-center gap-1 border-r border-surface-border px-3 py-1.5 text-[12px] font-medium text-black">
            Conversation ID
            <ChevronDown size={14} className="text-ink-muted" aria-hidden />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Search size={16} className="text-ink-muted" aria-hidden />
            <input
              type="text"
              placeholder="Enter keyword"
              className="w-40 bg-transparent text-[12px] text-ink outline-none placeholder:text-grey-500"
            />
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <ListFilter size={15} className="text-ink-muted" aria-hidden />
          Filter by
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <BellOff size={15} className="text-ink-muted" aria-hidden />
          Show muted alerts
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] px-3 py-1.5 text-[12px] font-medium text-ink"
          style={{ backgroundColor: '#eaf1f4' }}
        >
          <Bell size={15} className="text-ink-muted" aria-hidden />
          Alert management
        </button>
        <div className="flex items-center gap-2 text-ink-muted">
          <button type="button" aria-label="Choose columns"><Columns3 size={18} aria-hidden /></button>
          <button type="button" aria-label="Row density"><Menu size={18} aria-hidden /></button>
        </div>
      </div>
    </div>
  )
}
