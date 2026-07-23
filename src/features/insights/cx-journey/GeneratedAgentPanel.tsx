// Right slide-over for a clicked Agent-gaps row. Header (title + topic chip +
// close), secondary tabs (Create Agent / Generate Policy / Ticket Sources),
// a scrollable body, and a sticky footer whose labels vary by tab. Selection of
// training-phrase rows (Create Agent) enables the footer Create button. Closes
// on X, scrim click, and Escape. Presentational — footer actions are no-ops.
import { useEffect, useState } from 'react'
import { RefreshCw, X, Zap, ChevronDown } from 'lucide-react'
import { AUTOMATION_DETAILS } from './automation-data'
import { CreateAgentTab } from './CreateAgentTab'
import { GeneratePolicyTab } from './GeneratePolicyTab'
import { TicketSourcesTab } from './TicketSourcesTab'

type PanelTab = 'Create Agent' | 'Generate Policy' | 'Ticket Sources'
const TABS: PanelTab[] = ['Create Agent', 'Generate Policy', 'Ticket Sources']

export function GeneratedAgentPanel({
  topic,
  onClose,
}: {
  topic: string
  onClose: () => void
}) {
  const detail = AUTOMATION_DETAILS[topic]
  const [tab, setTab] = useState<PanelTab>('Create Agent')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleRow = (i: number) =>
    setSelectedRows((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(i)) nextSet.delete(i)
      else nextSet.add(i)
      return nextSet
    })

  const isCreateAgent = tab === 'Create Agent'
  const assignLabel = isCreateAgent
    ? 'Assign this topic to an existing Agent'
    : 'Assign this topic to an existing Policy'
  const trailingLabel = isCreateAgent ? 'Create' : 'Create new Policy'
  const createDisabled = isCreateAgent && selectedRows.size === 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        data-testid="generated-agent-scrim"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Generated Agent"
        className="relative flex h-full w-[628px] flex-col bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 pt-6">
          <p className="text-[22px] text-black">Generated Agent</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 rounded-full bg-[#f5f5f7] px-2 py-1 text-[12px] font-semibold text-[#545767]">
              <Zap size={16} className="text-[#545767]" aria-hidden />
              {topic}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full border border-surface-border text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" className="flex items-center border-b border-[#e4e7f0] px-9 pt-4">
          {TABS.map((t) => {
            const active = t === tab
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className={
                  'px-4 pb-4 pt-4 text-[14px] ' +
                  (active
                    ? '-mb-px border-b border-[#01567a] text-[#193d50]'
                    : 'text-[#9194a0]')
                }
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-10 py-6">
          {tab === 'Create Agent' && (
            <CreateAgentTab detail={detail} selectedRows={selectedRows} onToggleRow={toggleRow} />
          )}
          {tab === 'Generate Policy' && <GeneratePolicyTab detail={detail} />}
          {tab === 'Ticket Sources' && <TicketSourcesTab detail={detail} />}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-[#e4e7f0] px-10 py-8">
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-1.5 rounded-[20px] bg-black text-[14px] font-semibold text-white"
          >
            <RefreshCw size={16} aria-hidden />
            Create with AutoFlow (recommended)
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-[20px] border border-[#bcbdc5] bg-white py-2.5 pl-4 pr-2.5 text-[14px] text-[#9194a0]"
          >
            {assignLabel}
            <ChevronDown size={20} aria-hidden />
          </button>
          <button
            type="button"
            disabled={createDisabled}
            className="h-[37px] rounded-[20px] bg-[#f2f4f7] text-[14px] font-semibold text-[#a6a9b2] disabled:cursor-not-allowed enabled:bg-black enabled:text-white"
          >
            {trailingLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
