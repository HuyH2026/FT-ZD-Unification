// The experiments table. Columns: Name · Status · Intent · Description ·
// Traffic split. Rows are separated cards; clicking a row opens its detail
// at /experiments/new?id=<id>.
import { useNavigate } from 'react-router'
import { type Experiment } from './experiments-data'
import { StatusBadge } from './StatusBadge'
import { TrafficSplitBar } from './TrafficSplitBar'

const INK = '#2f3130'
const COLS = 'grid-cols-[1.4fr_0.8fr_1.2fr_1.8fr_0.9fr]'

export function ExperimentTable({ experiments }: { experiments: Experiment[] }) {
  const navigate = useNavigate()
  return (
    <div>
      {/* Column headers */}
      <div className={`grid ${COLS} gap-4 px-5 py-3 text-[12px] font-medium text-ink-muted`}>
        <span>Name</span>
        <span>Status</span>
        <span>Intent</span>
        <span>Description</span>
        <span>Traffic split</span>
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-3">
        {experiments.map((e) => (
          <div
            key={e.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/experiments/new?id=${e.id}`)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault()
                navigate(`/experiments/new?id=${e.id}`)
              }
            }}
            className={`grid ${COLS} cursor-pointer items-center gap-4 rounded-2xl border border-surface-border bg-white px-5 py-4 transition-colors hover:border-grey-500 hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700`}
          >
            <div className="text-[14px] font-medium" style={{ color: INK }}>{e.name}</div>
            <div><StatusBadge status={e.status} /></div>
            <div className="text-[13px]" style={{ color: INK }}>{e.intent}</div>
            <div className="text-[13px] text-ink-muted">{e.description}</div>
            <div><TrafficSplitBar splits={e.splits} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
