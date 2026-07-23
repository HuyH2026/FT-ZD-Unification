// The History tab's run log. Columns: Run date · Name (looked up from
// TOOL_ACTIONS by toolId, same avatar/title/description cell as ToolsTable)
// · Type · Channel · Conversation ID · Status. Fully presentational — no
// sorting, filtering, or row click-through. Mirrors ToolsTable's fixed
// grid-template-columns approach so header and rows align.
import { ArrowDown, Bolt } from 'lucide-react'
import { channelMeta } from '@/lib/channel-meta'
import { TOOL_ACTIONS, TOOL_RUNS, RUN_COUNT, type RunStatus } from './tools-data'

const COLS = 'grid-cols-[150px_minmax(280px,1.4fr)_100px_160px_220px_120px]'

function RunStatusBadge({ status }: { status: RunStatus }) {
  // Colors reuse StateBadge's existing greys/greens; "Failed" uses the
  // project's --destructive token (no inline hex needed).
  if (status === 'Completed') {
    return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#048c80' }}>Completed</span>
  }
  if (status === 'Failed') {
    return <span className="rounded-xl bg-destructive px-2 py-0.5 text-[11px] font-semibold text-white">Failed</span>
  }
  return <span className="rounded-xl px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: '#9194a0' }}>In progress</span>
}

function ChannelPill({ label }: { label: string }) {
  const { display, color, Icon } = channelMeta(label)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-2 py-1">
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <Icon size={9} className="text-white" aria-hidden />
      </span>
      <span className="text-[11px] font-medium text-grey-700">{display}</span>
    </span>
  )
}

function HeaderCell({ label, sortable = true }: { label: string; sortable?: boolean }) {
  return (
    <div className="flex items-center gap-1 border-r border-surface-border px-3.5 py-3 text-[12px] font-semibold text-grey-700 last:border-r-0">
      {label}
      {sortable && <ArrowDown size={13} className="text-ink-muted" aria-hidden />}
    </div>
  )
}

// Avatar mirrors ToolsTable's Avatar exactly (blue for API/live-ish rows,
// slate for imported), duplicated locally since ToolsTable doesn't export it.
function Avatar({ tint }: { tint: 'blue' | 'slate' }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: tint === 'blue' ? '#3492ef' : '#acbdd5' }}
    >
      <Bolt size={15} className="text-white" aria-hidden />
    </span>
  )
}

export function ToolsHistoryTable() {
  return (
    <div data-testid="tools-history-table" className="overflow-hidden rounded-t-[20px] border border-surface-border">
      <div className={`grid ${COLS} border-b border-surface-border bg-[#fbfbfb]`}>
        <HeaderCell label={`Run (${RUN_COUNT})`} />
        <HeaderCell label="Name" />
        <HeaderCell label="Type" />
        <HeaderCell label="Channel" sortable={false} />
        <HeaderCell label="Conversation ID" sortable={false} />
        <HeaderCell label="Status" />
      </div>

      {TOOL_RUNS.map((run) => {
        const action = TOOL_ACTIONS.find((a) => a.id === run.toolId)
        if (!action) return null
        return (
          <div key={run.id} className={`grid ${COLS} border-b border-surface-border last:border-b-0`}>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
              {run.runAt}
            </div>
            <div className="flex items-center gap-3 border-r border-surface-border px-3.5 py-3 last:border-r-0">
              <Avatar tint={action.iconTint} />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-black">{action.name}</div>
                <div className="truncate text-[12px] text-grey-700">{action.description}</div>
              </div>
            </div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] text-black last:border-r-0">
              {run.type}
            </div>
            <div className="flex items-center border-r border-surface-border px-3.5 py-3 last:border-r-0">
              <ChannelPill label={run.channel} />
            </div>
            <div className={`flex items-center border-r border-surface-border px-3.5 py-3 text-[11px] last:border-r-0 ${run.conversationId ? 'text-black' : 'text-grey-400'}`}>
              {run.conversationId ?? 'n/a'}
            </div>
            <div className="flex items-center px-3.5 py-3">
              <RunStatusBadge status={run.status} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
