// Traffic split donut chart with a legend (count + %) on the left and the
// total conversation count centered in the donut. Presentational.
import { Info } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import { TRAFFIC_SPLIT, TRAFFIC_SPLIT_TOTAL } from './results-data'

export function TrafficSplitCard() {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4">
      <div className="flex items-center gap-1.5">
        <p className="text-[13px] font-semibold text-ink">Traffic split</p>
        <Info size={14} className="text-ink-muted" aria-hidden />
      </div>
      <div className="mt-4 flex items-center gap-5">
        <div className="flex flex-col gap-3">
          {TRAFFIC_SPLIT.map((s) => (
            <div key={s.name} className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-ink">
                {s.value.toLocaleString()} <span className="font-normal">({s.pct})</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-ink">
                <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: s.color }} />
                {s.name}
              </span>
            </div>
          ))}
        </div>
        <div className="relative size-[140px] shrink-0">
          <PieChart width={140} height={140}>
            <Pie
              data={TRAFFIC_SPLIT}
              dataKey="value"
              nameKey="name"
              cx={70}
              cy={70}
              innerRadius={49}
              outerRadius={69}
              startAngle={90}
              endAngle={450}
              paddingAngle={4}
              cornerRadius={4}
              isAnimationActive={false}
              stroke="none"
            >
              {TRAFFIC_SPLIT.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[26px] font-semibold text-ink">{TRAFFIC_SPLIT_TOTAL.toLocaleString()}</span>
            <span className="text-[10px] text-ink">conversations</span>
          </div>
        </div>
      </div>
    </div>
  )
}
