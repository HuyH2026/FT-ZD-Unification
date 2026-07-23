// Inert toolbar for the Audit tab: search-by-user-email, a "Last 30 days" date
// dropdown, a "Filter by" dropdown, and right-aligned columns/rows icon buttons.
// Styled after ToolsToolbar. No backend.
import { Calendar, ChevronDown, Columns3, ListFilter, Menu, Search } from 'lucide-react'

export function AuditToolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-[20px] border border-surface-border bg-white px-3 py-1.5">
          <Search size={16} className="text-ink-muted" aria-hidden />
          <input
            type="text"
            placeholder="Search by user email"
            className="w-48 bg-transparent text-[12px] text-ink outline-none placeholder:text-grey-500"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <Calendar size={15} className="text-ink-muted" aria-hidden />
          Last 30 days
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-[20px] border border-surface-border bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          <ListFilter size={15} className="text-ink-muted" aria-hidden />
          Filter by
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2 text-ink-muted">
        <button type="button" aria-label="Choose columns"><Columns3 size={18} aria-hidden /></button>
        <button type="button" aria-label="Row density"><Menu size={18} aria-hidden /></button>
      </div>
    </div>
  )
}
