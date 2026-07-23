// Agent Builder — the AI Agents landing screen. Owns two pieces of local
// state: the selected channel and the selected agent tab. Agent list and toggle
// state are read from the store (single source of truth). All search/filter/action
// affordances are inert (mock scope).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Calendar, ChevronDown, Code2, Globe, MessageSquare, Phone, Plus, Search, Trash2, X } from 'lucide-react'
import { CHANNELS, type ChannelKey } from './agent-builder-data'
import { MetricStrip } from './MetricStrip'
import { AgentsTable } from './AgentsTable'
import { useAgentStore } from './agent-store'
import { CreateAgentPanel } from './CreateAgentPanel'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

const INK = '#2f3130'

type AgentTab = 'all' | 'active' | 'subagents'

const AGENT_TABS: { key: AgentTab; label: string }[] = [
  { key: 'all', label: 'All agents' },
  { key: 'active', label: 'Active agents' },
  { key: 'subagents', label: 'Active subagents' },
]

const CHANNEL_ICON: Record<ChannelKey, typeof MessageSquare> = {
  widget: MessageSquare,
  voice: Phone,
  webcall: Globe,
  headless: Code2,
}

export function AgentBuilderScreen() {
  const navigate = useNavigate()
  const store = useAgentStore()
  const [channelKey, setChannelKey] = useState<ChannelKey>('widget')
  const [tab, setTab] = useState<AgentTab>('all')
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const channel = CHANNELS.find((c) => c.key === channelKey)!

  // Derive agents from store, filtered by current channel
  const channelAgents = store.agents.filter((a) => a.channel === channelKey)

  const visibleAgents = useMemo(() => channelAgents.filter((a) => {
    if (tab === 'active') return a.on
    if (tab === 'subagents') return a.isSubagent
    return true
  }), [channelAgents, tab])

  // Selection only ever references currently-visible rows, so reset it whenever
  // the channel or tab changes (which changes what's visible).
  const clearSelection = () => setSelected(new Set())
  const selectChannel = (key: ChannelKey) => { setChannelKey(key); clearSelection() }
  const selectTab = (key: AgentTab) => { setTab(key); clearSelection() }
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected((prev) => {
      const allSelected = visibleAgents.length > 0 && visibleAgents.every((a) => prev.has(a.id))
      return allSelected ? new Set() : new Set(visibleAgents.map((a) => a.id))
    })
  const confirmDelete = () => {
    store.deleteAgents([...selected])
    clearSelection()
    setConfirmingDelete(false)
  }

  return (
    // Nested view: the AiAgentsScreen shell already provides the white rounded
    // surface via its Outlet, so this view only supplies scroll + padding.
    <div
      data-testid="view-agent-builder"
      className="h-full overflow-y-auto p-10"
    >
      {/* Header: title + date caption (left), channel switcher (right) */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[26px] leading-8 text-ink">Agent Builder</h1>
          <span className="text-[14px] text-ink-muted">5/2/2026 - 6/1/2026</span>
        </div>
        <div role="tablist" aria-label="Channel" className="flex items-center gap-1 rounded-full bg-[#f4f3f1] p-1">
          {CHANNELS.map((c) => {
            const Icon = CHANNEL_ICON[c.key]
            const active = c.key === channelKey
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectChannel(c.key)}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  backgroundColor: active ? '#ffffff' : 'transparent',
                  color: active ? INK : '#8b8e89',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon size={14} aria-hidden />
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Metric strip */}
      <div className="mb-8">
        <MetricStrip metrics={channel.metrics} />
      </div>

      {/* Agent tabs + trailing add affordance */}
      <div className="mb-4 flex items-center gap-6 border-b border-surface-border">
        <div role="tablist" aria-label="Agents" className="flex items-center gap-6">
          {AGENT_TABS.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(t.key)}
                className={
                  active
                    ? '-mb-px border-b-2 border-ink pb-3 text-[14px] font-medium text-ink'
                    : 'pb-3 text-[14px] text-ink-muted'
                }
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <button type="button" aria-label="Add agent group" className="pb-3 text-ink-muted">
          <Plus size={16} aria-hidden />
        </button>
      </div>

      {/* Toolbar (inert affordances) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5">
            <Search size={14} className="text-ink-muted" aria-hidden />
            <input
              type="text"
              placeholder="Search"
              className="w-40 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-[13px] text-ink">
            <Calendar size={14} className="text-ink-muted" aria-hidden />
            May 02, 2026 - Jun 01, 2026
            <ChevronDown size={14} className="text-ink-muted" aria-hidden />
          </button>
          <button type="button" className="rounded-lg border border-surface-border px-3 py-1.5 text-[13px] text-ink">
            All filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-full border border-surface-border px-4 py-1.5 text-[13px] font-medium text-ink">
            Preview
          </button>
          <button type="button" onClick={() => setCreating(true)} className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-semibold text-white">
            New Agent
          </button>
        </div>
      </div>

      {/* Selection action bar (shown when ≥1 row selected) */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-surface-border bg-[#f4f3f1] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Clear selection" onClick={clearSelection} className="text-ink-muted hover:text-ink">
              <X size={16} aria-hidden />
            </button>
            <span className="text-[13px] font-medium text-ink">{selected.size} selected</span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white"
            style={{ backgroundColor: '#c0392b' }}
          >
            <Trash2 size={14} aria-hidden />
            Delete
          </button>
        </div>
      )}

      {/* Agents table */}
      <AgentsTable
        agents={visibleAgents}
        isOn={(a) => a.on}
        onToggle={(id) => store.toggleAgent(id)}
        onRowClick={(id) => navigate(`/ai-agents/${id}`)}
        selectedIds={selected}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
      />

      {confirmingDelete && (
        <ConfirmDeleteDialog
          count={selected.size}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDelete}
        />
      )}

      {creating && (
        <CreateAgentPanel
          channel={channelKey}
          onClose={() => setCreating(false)}
          onCreate={(fields) => {
            const id = store.createAgent(fields)
            setCreating(false)
            navigate(`/ai-agents/${id}`)
          }}
        />
      )}
    </div>
  )
}
