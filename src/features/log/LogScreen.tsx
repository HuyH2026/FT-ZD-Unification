// Log surface: title + a tab strip (Audit / Error) and the active tab body. Tab
// switching is the only live interaction (local state), mirroring ToolsScreen.
// No backend.
import { useState } from 'react'
import { LOG_TABS, type LogTab } from './log-data'
import { AuditView } from './AuditView'
import { ErrorView } from './ErrorView'

export function LogScreen() {
  const [tab, setTab] = useState<LogTab>('Audit')

  return (
    <div
      data-testid="screen-log"
      className="h-full overflow-y-auto rounded-[26px] bg-white px-10 py-4"
    >
      <div className="flex items-center gap-6">
        <h1 className="text-[22px] text-ink">Log</h1>
        <div className="h-7 w-px bg-surface-border" aria-hidden />
        <div className="flex items-center gap-2" role="tablist">
          {LOG_TABS.map((t) => {
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

      <div className="mt-6">{tab === 'Audit' ? <AuditView /> : <ErrorView />}</div>
    </div>
  )
}
