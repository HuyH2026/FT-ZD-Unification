// CX Journey → Automation. Segmented control switches sub-views; only
// "Agent gaps" is designed (stats banner + toolbar + table). The search box and
// toolbar icon buttons are presentational (no backend); the other two sub-tabs
// render a "Coming soon" empty region.
import { Download, Info, List, Search, Sparkles, Table2 } from 'lucide-react'
import { useState } from 'react'
import {
  AUTOMATION_INTRO,
  AUTOMATION_ROWS,
  AUTOMATION_STATS,
  AUTOMATION_SUBTABS,
  type AutomationSubTab,
} from './automation-data'

const COLS = [
  'Topic for generated policy',
  'Autoflow policy',
  'Ticket coverage/year',
  'Potential savings/year',
  'Time created',
]

function SegmentedControl({
  value,
  onChange,
}: {
  value: AutomationSubTab
  onChange: (v: AutomationSubTab) => void
}) {
  return (
    <div role="tablist" className="flex items-center gap-1 rounded-full bg-app-backdrop p-1">
      {AUTOMATION_SUBTABS.map(({ label, icon: Icon }) => {
        const active = label === value
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(label)}
            className={
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ' +
              (active ? 'bg-white text-ink shadow-sm' : 'text-ink-muted')
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function StatsBanner() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#fbeee6] to-[#e7eef6] p-6">
      <p className="text-[13px] text-ink">{AUTOMATION_INTRO}</p>
      <div className="mt-4 flex flex-wrap gap-x-24 gap-y-4">
        {AUTOMATION_STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-[32px] font-semibold text-ink">{stat.value}</p>
            <p className="flex items-center gap-1 text-[13px] text-ink-muted">
              {stat.label}
              <Info className="h-3.5 w-3.5" />
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Toolbar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5">
        <Search className="h-4 w-4 text-ink-muted" />
        <input
          type="text"
          placeholder="Search"
          className="w-40 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      <div className="flex items-center gap-1">
        {[Download, List, Table2].map((Icon, i) => (
          <button
            key={i}
            type="button"
            className="rounded-lg border border-surface-border p-1.5 text-ink-muted"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

function PolicyTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            {COLS.map((col) => (
              <th key={col} className="px-4 py-3 text-left text-[12px] font-medium text-ink-muted">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AUTOMATION_ROWS.map((row) => (
            <tr key={row.topic} className="border-b border-surface-border align-top">
              <td className="px-4 py-6">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-app-backdrop px-2 py-1 text-[13px] text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-ink-muted" />
                  {row.topic}
                </span>
              </td>
              <td className="px-4 py-6 text-[13px] text-ink">
                <p className="line-clamp-3 max-w-[320px]">{row.policy}</p>
              </td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.coverage}</td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.savings}</td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AutomationView() {
  const [subTab, setSubTab] = useState<AutomationSubTab>('Agent gaps')
  return (
    <section data-testid="view-automation" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Automation</h2>
        <SegmentedControl value={subTab} onChange={setSubTab} />
      </div>
      {subTab === 'Agent gaps' ? (
        <>
          <StatsBanner />
          <Toolbar />
          <PolicyTable />
        </>
      ) : (
        <div className="flex h-64 items-center justify-center text-[14px] text-ink-muted">
          Coming soon
        </div>
      )}
    </section>
  )
}
