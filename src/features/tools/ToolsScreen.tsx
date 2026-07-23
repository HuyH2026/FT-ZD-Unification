// Tool Builder surface: title + inert gear, a tab strip (Available /
// Recommended / Authentication / History), and the active tab body. Tab
// switching is the only live interaction (local state); the Available tab shows
// the toolbar + table, the other three show titled empty regions (no fabricated
// data). No backend.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Settings } from 'lucide-react'
import { TOOL_TABS, type ToolTab } from './tools-data'
import { ToolsToolbar } from './ToolsToolbar'
import { ToolsTable } from './ToolsTable'

export function ToolsScreen() {
  const [tab, setTab] = useState<ToolTab>('Available')
  const navigate = useNavigate()

  return (
    <div
      data-testid="screen-tools"
      className="h-full overflow-y-auto rounded-[26px] bg-white px-10 py-4"
    >
      {/* Title row + tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-[22px] text-ink">Tool Builder</h1>
          <div className="h-7 w-px bg-surface-border" aria-hidden />
          <div className="flex items-center gap-2" role="tablist">
            {TOOL_TABS.map((t) => {
              const active = t === tab
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                  className={
                    active
                      ? '-mb-px border-b border-[#01567a] px-4 pb-2.5 pt-3 text-[22px] text-ink'
                      : 'px-4 pb-2.5 pt-3 text-[22px] text-grey-500'
                  }
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
        <button type="button" aria-label="Tool settings" className="text-ink-muted">
          <Settings size={20} aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div className="mt-6">
        {tab === 'Available' ? (
          <div className="flex flex-col gap-4">
            <ToolsToolbar />
            <ToolsTable onOpen={(id) => navigate(`/tools/${id}`)} />
          </div>
        ) : (
          <div
            data-testid={`tools-tab-${tab}`}
            className="flex h-64 items-center justify-center text-[14px] text-ink-muted"
          >
            {tab}
          </div>
        )}
      </div>
    </div>
  )
}
