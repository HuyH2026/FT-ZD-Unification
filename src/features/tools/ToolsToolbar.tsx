// Presentational toolbar for the Available tab: search, "Filter by", and the
// right-aligned "Import action" (outline) + "Create new..." (dark fill) buttons.
// Every control is inert (no backend).
import { ChevronDown, ListFilter, Search } from 'lucide-react'

export function ToolsToolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-[20px] border border-surface-border bg-white px-3 py-1.5">
          <Search size={16} className="text-ink-muted" aria-hidden />
          <input
            type="text"
            placeholder="Search"
            className="w-32 bg-transparent text-[12px] text-ink outline-none placeholder:text-grey-500"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <ListFilter size={15} className="text-ink-muted" aria-hidden />
          Filter by
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-grey-500 px-3 py-1.5 text-[11px] font-semibold text-ink"
        >
          Import action
        </button>
        <button
          type="button"
          className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white"
        >
          Create new...
        </button>
      </div>
    </div>
  )
}
