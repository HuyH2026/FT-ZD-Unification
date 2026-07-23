// "Avg delta" card: a big signed percentage per variant vs. control, each
// with a colored legend swatch beneath it. Presentational.
import { AVG_DELTA } from './results-data'

export function AvgDeltaCard() {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4">
      <p className="text-[13px] font-semibold text-ink">Avg delta</p>
      <div className="mt-6 flex items-center gap-8 px-2">
        {AVG_DELTA.map((d) => (
          <div key={d.name} className="flex flex-col gap-1.5">
            <span className="text-[28px] font-semibold" style={{ color: d.positive ? '#1f866a' : '#d82c0d' }}>
              {d.delta}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-ink">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: d.color }} />
              {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
