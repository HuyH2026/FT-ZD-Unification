// Zone 3 + 4 of the Topics tab: a presentational toolbar (search, date,
// audience, view toggles, group-topics checkbox) over a nested, expandable
// topics table. Two independent accordion Sets drive expansion — top-level
// rows and level-2 sub-topic rows. Everything else is inert.
import { useState } from 'react'
import {
  Calendar, Check, ChevronDown, ChevronRight, Download, List, MoreVertical,
  Network, Search, Settings2, Table as TableIcon,
} from 'lucide-react'
import { RED, TEAL } from '../cx-journey-data'
import { type TopicRow, type TopicSub, TOPIC_ROWS, sentimentBand } from './topics-data'

// Signed-percentage cell: green when negative (improvement), red when positive.
function ChangeCell({ pct, abs }: { pct: number; abs: string }) {
  return (
    <span className="text-[12px] font-medium" style={{ color: pct < 0 ? TEAL : RED }}>
      {pct > 0 ? '+' : ''}
      {pct}% <span className="font-normal text-ink-muted">({abs})</span>
    </span>
  )
}

function Toolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-ink-muted" />
        <input
          className="w-40 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
          placeholder="Search by topic"
        />
      </div>
      <button type="button" className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-[13px] text-ink">
        <Calendar className="h-3.5 w-3.5 text-ink-muted" />
        May 2, 2025 – Jun 1, 2025
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <button type="button" className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-[13px] text-ink">
        Human only
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Table view">
        <TableIcon className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Flow view">
        <Network className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <label className="flex items-center gap-1.5 text-[13px] text-ink">
        <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-nav-active">
          <Check className="h-3 w-3 text-white" />
        </span>
        Group topics
      </label>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Export">
          <Download className="h-3.5 w-3.5 text-ink-muted" />
        </button>
        <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="List options">
          <List className="h-3.5 w-3.5 text-ink-muted" />
        </button>
        <button type="button" className="rounded-lg border border-surface-border bg-white p-1.5" aria-label="Settings">
          <Settings2 className="h-3.5 w-3.5 text-ink-muted" />
        </button>
      </div>
    </div>
  )
}

// Level-3 leaf row inside an expanded sub-topic.
function LeafRow({ leaf }: { leaf: TopicSub['children'][number] }) {
  return (
    <tr className="border-t border-surface-border text-[12px]">
      <td className="py-2 pl-16 text-ink">{leaf.name}</td>
      <td className="py-2 text-ink">
        {leaf.tickets.toLocaleString('en-US')} <span className="text-ink-muted">({leaf.ticketsPct})</span>
      </td>
      <td className="py-2"><ChangeCell pct={leaf.ticketsChangePct} abs={leaf.ticketsChangeAbs} /></td>
      <td className="py-2 text-ink">{leaf.fullResTime}</td>
      <td className="py-2"><ChangeCell pct={leaf.fullResChangePct} abs={leaf.fullResChangeAbs} /></td>
    </tr>
  )
}

// Level-2 sub-topic row (itself expandable to leaf rows).
function SubRow({ sub }: { sub: TopicSub }) {
  const [open, setOpen] = useState(sub.id === 'pm-refund')
  return (
    <>
      <tr className="border-t border-surface-border text-[12px]">
        <td className="py-2 pl-10">
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-left font-medium text-ink">
            {open ? <ChevronDown className="h-3.5 w-3.5 text-ink-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />}
            {sub.name} <span className="font-normal text-ink-muted">({sub.count})</span>
          </button>
        </td>
        <td className="py-2 text-ink">
          {sub.tickets.toLocaleString('en-US')} <span className="text-ink-muted">({sub.ticketsPct})</span>
        </td>
        <td className="py-2"><ChangeCell pct={sub.ticketsChangePct} abs={sub.ticketsChangeAbs} /></td>
        <td className="py-2 text-ink">{sub.fullResTime}</td>
        <td className="py-2"><ChangeCell pct={sub.fullResChangePct} abs={sub.fullResChangeAbs} /></td>
      </tr>
      {open && sub.children.map((leaf) => <LeafRow key={leaf.id} leaf={leaf} />)}
    </>
  )
}

// The nested sub-table revealed when a top-level row expands.
function NestedTable({ row }: { row: TopicRow }) {
  return (
    <tr>
      <td colSpan={4} className="p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-ink-muted">
              <th className="py-2 pl-10 font-medium">Topic ({row.count})</th>
              <th className="py-2 font-medium">Tickets</th>
              <th className="py-2 font-medium">% of tickets change</th>
              <th className="py-2 font-medium">Full resolution time (hrs)</th>
              <th className="py-2 font-medium">% of full resolution time (hrs) change</th>
            </tr>
          </thead>
          <tbody>
            {row.children.map((sub) => <SubRow key={sub.id} sub={sub} />)}
          </tbody>
        </table>
      </td>
    </tr>
  )
}

// Top-level topic row.
function TopicRowView({ row, open, onToggle }: { row: TopicRow; open: boolean; onToggle: () => void }) {
  const band = sentimentBand(row.sentiment)
  return (
    <>
      <tr className="border-t border-surface-border">
        <td className="py-3.5">
          <button type="button" aria-expanded={open} onClick={onToggle} className="flex items-center gap-2 text-left text-[13px] font-medium text-ink">
            {open ? <ChevronDown className="h-4 w-4 text-ink-muted" /> : <ChevronRight className="h-4 w-4 text-ink-muted" />}
            {row.name} <span className="font-normal text-ink-muted">({row.count})</span>
          </button>
        </td>
        <td className="py-3.5 text-[13px] text-ink">
          {row.tickets.toLocaleString('en-US')} <span className="text-ink-muted">({row.ticketsPct})</span>
        </td>
        <td className="py-3.5 text-[13px] text-ink">{row.firstContactResolution}</td>
        <td className="py-3.5">
          <span className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: band.color }}>
            {row.sentiment}
            <MoreVertical className="ml-2 h-4 w-4 text-ink-muted" />
          </span>
        </td>
      </tr>
      {open && <NestedTable row={row} />}
    </>
  )
}

export function TopicsTable() {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['payment']))
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  return (
    <section className="flex flex-col gap-4">
      <Toolbar />
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[12px] font-medium text-ink-muted">
            <th className="pb-2">Topic ({TOPIC_ROWS.length})</th>
            <th className="pb-2">Tickets</th>
            <th className="pb-2">First contact resolution</th>
            <th className="pb-2">Sentiment</th>
          </tr>
        </thead>
        <tbody>
          {TOPIC_ROWS.map((row) => (
            <TopicRowView key={row.id} row={row} open={expanded.has(row.id)} onToggle={() => toggle(row.id)} />
          ))}
        </tbody>
      </table>
    </section>
  )
}
