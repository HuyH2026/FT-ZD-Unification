// Experiments → A/B Test surface: title, a 4-card metric strip, a presentational
// toolbar (search / date-range / filters / view-toggle / Create new), and the
// experiments table. Every toolbar control is inert. No backend.
import { useNavigate } from 'react-router'
import { Search, Calendar, ChevronDown, LayoutGrid, Table2 } from 'lucide-react'
import { METRICS, EXPERIMENTS } from './experiments-data'
import { MetricStrip } from './MetricStrip'
import { ExperimentTable } from './ExperimentTable'

export function ExperimentsScreen() {
  const navigate = useNavigate()
  return (
    <div data-testid="screen-experiments" className="h-full overflow-y-auto rounded-[26px] bg-white px-8 py-6">
      <h1 className="text-[22px] font-semibold text-ink">A/B test</h1>

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
        <div className="flex items-center gap-1 rounded-full border border-surface-border p-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
            <Table2 size={15} className="text-ink" aria-hidden />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full">
            <LayoutGrid size={15} className="text-ink-muted" aria-hidden />
          </span>
        </div>
        <div className="ml-auto">
          <button type="button" onClick={() => navigate('/experiments/new')} className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white">
            Create new
          </button>
        </div>
      </div>

      <div className="mt-6">
        <ExperimentTable experiments={EXPERIMENTS} />
      </div>
    </div>
  )
}
