// The four A/B Test metric cards. Presentational. CSAT renders its value in
// green; Resolutions shows a secondary figure beside the value. Values come
// from mock data.
import { Info } from 'lucide-react'
import { type ABMetric } from './experiments-data'

const INK = '#2f3130'
const GREEN = '#2d7e55'

function Card({ metric }: { metric: ABMetric }) {
  return (
    <div className="flex-1 rounded-2xl border border-surface-border bg-white px-5 py-4">
      <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
        <span>{metric.label}</span>
        <Info size={13} aria-hidden />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-[30px] font-semibold leading-none"
          style={{ color: metric.accent === 'green' ? GREEN : INK }}
        >
          {metric.value}
        </span>
        {metric.sub && <span className="text-[15px] text-ink-muted">{metric.sub}</span>}
      </div>
    </div>
  )
}

export function MetricStrip({ metrics }: { metrics: ABMetric[] }) {
  return (
    <div className="flex gap-4">
      {metrics.map((m) => (
        <Card key={m.key} metric={m} />
      ))}
    </div>
  )
}
