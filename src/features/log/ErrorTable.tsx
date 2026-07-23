// Error tab table. Columns: Timestamp (active desc sort) · Product · Channel ·
// Conversation Id · Error Message · Severity. Fixed shared grid template; wide
// content scrolls horizontally. All sort carets inert.
import { ArrowDown, ArrowUpDown } from 'lucide-react'
import { ERROR_ENTRIES } from './log-data'
import { SeverityBadge } from './SeverityBadge'

const COLS = 'grid-cols-[minmax(170px,0.8fr)_minmax(100px,0.5fr)_minmax(110px,0.5fr)_minmax(320px,1.2fr)_minmax(280px,1.2fr)_minmax(110px,0.5fr)]'

function HeaderCell({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-1 border-r border-surface-border px-3.5 py-3 text-[12px] font-semibold text-grey-700 last:border-r-0">
      {label}
      {active ? (
        <ArrowDown size={13} className="text-ink-muted" aria-hidden />
      ) : (
        <ArrowUpDown size={13} className="text-ink-muted" aria-hidden />
      )}
    </div>
  )
}

export function ErrorTable() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1100px] overflow-hidden rounded-t-[20px] border border-surface-border">
        <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
          <HeaderCell label="Timestamp" active />
          <HeaderCell label="Product" />
          <HeaderCell label="Channel" />
          <HeaderCell label="Conversation Id" />
          <HeaderCell label="Error Message" />
          <HeaderCell label="Severity" />
        </div>
        {ERROR_ENTRIES.map((e) => (
          <div
            key={e.id}
            data-testid={`error-row-${e.id}`}
            className={`grid ${COLS} border-b border-surface-border last:border-b-0`}
          >
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.timestamp}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.product}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.channel}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.conversationId}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.message}</div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 last:border-r-0"><SeverityBadge severity={e.severity} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
