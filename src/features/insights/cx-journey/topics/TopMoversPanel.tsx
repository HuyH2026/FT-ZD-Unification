// Zone 1 of the Topics tab: a collapsible panel over a soft gradient, holding
// two white cards — a "top movers" table with an inert carousel pager, and a
// "most coaching" horizontal bar chart with an inert dropdown. Presentational
// except the panel's own collapse toggle.
import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Sparkles } from 'lucide-react'
import { RED, TEAL } from '../cx-journey-data'
import { COACHING_BARS, TOP_MOVERS } from './topics-data'

function TopMoversCard() {
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ink-muted" />
          <p className="text-[13px] font-semibold text-ink">Top movers by Discover categorized tickets</p>
        </div>
        <div className="flex items-center gap-1 text-[12px] text-ink-muted">
          <button type="button" className="rounded p-0.5" aria-label="Previous">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span>1 of 5</span>
          <button type="button" className="rounded p-0.5" aria-label="Next">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[11px] text-ink-muted">
            <th className="pb-2 font-medium">Topic</th>
            <th className="pb-2 font-medium"># of tickets</th>
            <th className="pb-2 font-medium">Previous</th>
            <th className="pb-2 font-medium">Comparison</th>
          </tr>
        </thead>
        <tbody>
          {TOP_MOVERS.map((m) => (
            <tr key={m.topic} className="text-[12px]">
              <td className="py-1.5 text-accent-blue">{m.topic}</td>
              <td className="py-1.5 text-ink">{m.tickets}</td>
              <td className="py-1.5 text-ink-muted">({m.previous})</td>
              <td className="py-1.5 font-medium" style={{ color: m.comparisonPct < 0 ? TEAL : RED }}>
                {m.comparisonPct > 0 ? '+' : ''}
                {m.comparisonPct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CoachingCard() {
  const max = Math.max(...COACHING_BARS.map((b) => b.volume))
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white p-4">
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-between rounded-lg border border-surface-border px-3 py-2 text-[13px] text-ink"
      >
        <span>Topics that required the most coaching</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>
      <div className="flex text-[11px] text-ink-muted">
        <span className="w-[140px]">Topics</span>
        <span>Volume</span>
      </div>
      <div className="mt-2 flex flex-col gap-2.5">
        {COACHING_BARS.map((b, i) => (
          <div key={`${b.topic}-${i}`} className="flex items-center text-[12px]">
            <span className="w-[140px] truncate text-ink">{b.topic}</span>
            <span className="flex flex-1 items-center gap-2">
              <span className="h-3.5 rounded-sm" style={{ width: `${(b.volume / max) * 100}%`, backgroundColor: TEAL }} />
              <span className="text-ink-muted">{b.volume}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopMoversPanel() {
  const [expanded, setExpanded] = useState(true)
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: 'linear-gradient(105deg, #fbe9e0 0%, #eef0f6 48%, #e2edf0 100%)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Top movers &amp; recommendations</h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label="Toggle top movers"
          onClick={() => setExpanded((v) => !v)}
          className="rounded p-1"
        >
          {expanded ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <TopMoversCard />
          <CoachingCard />
        </div>
      )}
    </section>
  )
}
