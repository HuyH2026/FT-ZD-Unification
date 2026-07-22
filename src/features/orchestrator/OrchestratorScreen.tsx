// Orchestrator surface: title, a 4-card metric strip, a presentational toolbar
// (search / date-range / filters / Simulations / New automation), and the
// automations table. Only the row On/Off toggles carry state (local useState);
// every toolbar control is inert. No backend.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, Calendar, ChevronDown } from 'lucide-react'
import { METRICS, AUTOMATIONS, type Automation } from './orchestrator-data'
import { MetricStrip } from './MetricStrip'
import { AutomationTable } from './AutomationTable'

export function OrchestratorScreen() {
  const navigate = useNavigate()
  const [automations, setAutomations] = useState<Automation[]>(AUTOMATIONS)

  const onToggle = (id: string) =>
    setAutomations((rows) => rows.map((r) => (r.id === id ? { ...r, on: !r.on } : r)))

  return (
    <div data-testid="screen-orchestrator" className="h-full overflow-y-auto rounded-[26px] bg-white px-8 py-6">
      <h1 className="text-[22px] font-semibold text-ink">Orchestrator</h1>

      <div className="mt-6">
        <MetricStrip metrics={METRICS} />
      </div>

      {/* Toolbar — presentational */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-surface-border px-3 py-2">
          <Search size={15} className="text-ink-muted" aria-hidden />
          <input
            type="text"
            placeholder="Search"
            className="w-40 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
        <button type="button" className="flex items-center gap-2 rounded-full border border-surface-border px-3 py-2 text-[14px] text-ink">
          <Calendar size={15} className="text-ink-muted" aria-hidden />
          Jan 1, 2025 – Dec 31, 2025
          <ChevronDown size={15} className="text-ink-muted" aria-hidden />
        </button>
        <button type="button" className="rounded-full border border-surface-border px-3 py-2 text-[14px] text-ink">
          All filters
        </button>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" className="rounded-full border border-surface-border px-4 py-2 text-[14px] text-ink">
            Simulations
          </button>
          <button type="button" className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white">
            New automation
          </button>
        </div>
      </div>

      <div className="mt-6">
        <AutomationTable automations={automations} isOn={(a) => a.on} onToggle={onToggle} onOpen={(id) => navigate(`/orchestrator/${id}`)} />
      </div>
    </div>
  )
}
