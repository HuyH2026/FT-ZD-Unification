// The Available-tab table. Columns: Name (checkbox + avatar + title/description)
// · Type · Agents in use · Revealed # of conversations · State · Last modified ·
// row actions. Everything is presentational — checkboxes, sort carets, and the
// ⋮ menu are inert. A fixed grid template is shared by the header and every row
// so the vertical dividers line up (pattern from insights TopicsTable).
import { ArrowDown, Bolt, Info, MoreVertical, User } from 'lucide-react'
import { TOOL_ACTIONS, NAME_COUNT, type ToolAction, type ToolState } from './tools-data'

const COLS =
  'grid-cols-[minmax(280px,1.4fr)_100px_150px_200px_120px_160px_56px]'

// State badge styling per Figma: Live = green fill, Read only = bordered
// neutral, Auto-saved = grey fill.
export function StateBadge({ state }: { state: ToolState }) {
  if (state === 'Live') {
    // #048c80 has no theme token — inline per the CLAUDE.md one-off convention.
    return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#048c80' }}>Live</span>
  }
  if (state === 'Auto-saved') {
    // #9194a0 has no exact token — inline per the CLAUDE.md one-off convention.
    return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#9194a0' }}>Auto-saved</span>
  }
  return (
    <span className="rounded-xl border border-surface-border px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
      Read only
    </span>
  )
}

// Slate-tinted pill naming the agents in use, with a "+N" suffix.
function AgentsChip({ agents }: { agents: ToolAction['agents'] }) {
  if (!agents) return <span className="text-[12px] text-grey-400">n/a</span>
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[12px] font-medium text-grey-700"
      style={{ backgroundColor: '#f2f4f7' }}  // slate-100, no token
    >
      <User size={13} aria-hidden />
      {agents.label} +{agents.extra}
    </span>
  )
}

// Round avatar; blue for API/live-ish rows, slate for imported (from Figma).
function Avatar({ tint }: { tint: ToolAction['iconTint'] }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: tint === 'blue' ? '#3492ef' : '#acbdd5' }}
    >
      <Bolt size={15} className="text-white" aria-hidden />
    </span>
  )
}

// Static, inert checkbox (presentational).
function CheckboxCell() {
  return (
    <span
      data-testid="tool-row-checkbox"
      onClick={(e) => e.stopPropagation()}
      className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-surface-border bg-white"
      aria-hidden
    />
  )
}

function HeaderCell({ label, sortable = true, info = false }: { label: string; sortable?: boolean; info?: boolean }) {
  return (
    <div className="flex items-center gap-1 border-r border-surface-border px-3.5 py-3 text-[12px] font-semibold text-grey-700 last:border-r-0">
      {label}
      {info && <Info size={13} className="text-ink-muted" aria-hidden />}
      {sortable && <ArrowDown size={13} className="text-ink-muted" aria-hidden />}
    </div>
  )
}

export function ToolsTable({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-t-[20px] border border-surface-border">
      {/* Header — unchanged */}
      <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
        <div className="flex items-center gap-2 border-r border-surface-border px-3.5 py-3">
          <CheckboxCell />
          <span className="flex items-center gap-1 text-[12px] font-semibold text-grey-700">
            Name ({NAME_COUNT})
            <ArrowDown size={13} className="text-ink-muted" aria-hidden />
          </span>
        </div>
        <HeaderCell label="Type" />
        <HeaderCell label="Agents in use" sortable={false} />
        <HeaderCell label="Revealed # of conversations" />
        <HeaderCell label="State" info />
        <HeaderCell label="Last modified" />
        <div aria-hidden />
      </div>

      {/* Rows */}
      {TOOL_ACTIONS.map((a) => (
        <div
          key={a.id}
          data-testid={`tool-row-${a.id}`}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(a.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(a.id)
            }
          }}
          className={`grid ${COLS} cursor-pointer border-b border-surface-border last:border-b-0`}
        >
          <div className="flex items-center gap-3 border-r border-surface-border px-3.5 py-3">
            <CheckboxCell />
            <Avatar tint={a.iconTint} />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-black">{a.name}</div>
              <div className="truncate text-[12px] text-grey-700">{a.description}</div>
            </div>
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
            {a.type}
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 last:border-r-0">
            <AgentsChip agents={a.agents} />
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
            {a.conversations.toLocaleString('en-US')}
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 last:border-r-0">
            <StateBadge state={a.state} />
          </div>
          <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
            {a.lastModified}
          </div>
          <div className="flex items-center justify-center bg-[#fbfbfb] px-2">
            <button
              type="button"
              aria-label={`${a.name} options`}
              onClick={(e) => e.stopPropagation()}
              className="text-ink-muted"
            >
              <MoreVertical size={16} aria-hidden />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
