// Top card on the Tool Detail screen: Endpoint URL + a request tab strip
// (Params/Header/Body/Authorization/Code — the only live piece) alongside a
// static Action name/description panel. Everything else is presentational.
import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

type RequestTab = 'Params' | 'Header' | 'Body' | 'Authorization' | 'Code'
const REQUEST_TABS: RequestTab[] = ['Params', 'Header', 'Body', 'Authorization', 'Code']

export function ToolRequestCard() {
  const [tab, setTab] = useState<RequestTab>('Params')

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-6 rounded-[20px] border border-surface-border bg-white p-5">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-[14px] font-semibold text-black">Endpoint URL</div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-black"
            >
              GET
              <ChevronDown size={14} className="text-ink-muted" aria-hidden />
            </button>
            <div className="flex-1 rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
              Select method, enter endpoint then sent
            </div>
            <button
              type="button"
              className="rounded-[20px] px-4 py-2 text-[12px] font-semibold text-grey-400"
              style={{ backgroundColor: '#f2f4f7' }}
            >
              Send
            </button>
          </div>
        </div>

        <div role="tablist" className="flex items-center gap-4 border-b border-surface-border">
          {REQUEST_TABS.map((t) => {
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
                    ? '-mb-px border-b border-ink px-1 pb-2 text-[12px] text-black'
                    : 'px-1 pb-2 text-[12px] text-grey-500'
                }
              >
                {t}
              </button>
            )
          })}
        </div>

        {tab === 'Params' ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-grey-700">
              <span>Key</span>
              <span>Value</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
                Key
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
                  Enter value or select CV from the list
                </div>
                <button type="button" aria-label="Remove parameter" className="text-ink-muted">
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </div>
            <button type="button" className="flex w-fit items-center gap-1.5 px-1 py-2 text-[12px] font-semibold text-grey-400">
              <Plus size={14} aria-hidden />
              Add
            </button>
          </div>
        ) : (
          <div data-testid={`request-tab-${tab}`} className="flex h-24 items-center justify-center text-[13px] text-ink-muted">
            {tab}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-l border-surface-border pl-6">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-black">Action name and description *</span>
          <button type="button" aria-label="Collapse action panel">
            <ChevronUp size={16} className="text-ink-muted" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-black">Action name*</label>
          <div className="rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
            Provide a name for the action
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-black">Description*</label>
          <div className="rounded-[20px] border border-surface-border bg-white px-3 py-2 text-[12px] text-grey-500">
            Provide information about the purpose and function of the API endpoint you are utilizing.
          </div>
        </div>
      </div>
    </div>
  )
}
