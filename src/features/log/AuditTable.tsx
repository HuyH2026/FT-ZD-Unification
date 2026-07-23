// Audit tab table. Columns: Timestamp (active desc sort) · Product · Action ·
// User email. A fixed grid template is shared by the header and every row so
// dividers line up (pattern from ToolsTable). All sort carets are inert.
import { ArrowDown, ArrowUpDown } from 'lucide-react'
import { AUDIT_ENTRIES } from './log-data'

const COLS = 'grid-cols-[minmax(220px,1fr)_minmax(140px,0.6fr)_minmax(260px,1fr)_minmax(200px,0.8fr)]'

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

export function AuditTable() {
  return (
    <div className="overflow-hidden rounded-t-[20px] border border-surface-border">
      <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
        <HeaderCell label="Timestamp" active />
        <HeaderCell label="Product" />
        <HeaderCell label="Action" />
        <HeaderCell label="User email" />
      </div>
      {AUDIT_ENTRIES.map((e) => (
        <div
          key={e.id}
          data-testid={`audit-row-${e.id}`}
          className={`grid ${COLS} border-b border-surface-border last:border-b-0`}
        >
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.timestamp}</div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.product}</div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.action}</div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3.5 text-[12px] text-black last:border-r-0">{e.userEmail}</div>
        </div>
      ))}
    </div>
  )
}
