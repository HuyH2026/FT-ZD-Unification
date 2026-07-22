// The four Orchestrator metric cards. Presentational. The Success rate card
// shows an upward delta pill; Conversations triggered shows a secondary figure;
// Positive sentiment prefixes a green smiley. All values come from mock data.
import { Info, TrendingUp, Smile } from 'lucide-react'
import { type OrchMetric } from './orchestrator-data'

const INK = '#2f3130'
const GREEN = '#0f8a5f'

function Card({ metric }: { metric: OrchMetric }) {
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white px-5 py-4">
      <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
        <span>{metric.label}</span>
        <Info size={13} aria-hidden />
        {metric.delta && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px]"
            style={{ backgroundColor: '#e4f3ec', color: GREEN }}
          >
            {metric.delta}
            {metric.trend === 'up' && <TrendingUp size={12} aria-hidden />}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {metric.sentiment && <Smile size={26} aria-hidden style={{ color: GREEN }} />}
        <span className="text-[30px] font-semibold leading-none" style={{ color: INK }}>
          {metric.value}
        </span>
        {metric.sub && <span className="text-[15px] text-ink-muted">{metric.sub}</span>}
      </div>
    </div>
  )
}

export function MetricStrip({ metrics }: { metrics: OrchMetric[] }) {
  return (
    <div className="flex gap-4">
      {metrics.map((m) => (
        <Card key={m.key} metric={m} />
      ))}
    </div>
  )
}
