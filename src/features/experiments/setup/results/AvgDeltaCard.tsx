// "Avg delta" card: a big signed percentage per variant vs. control, each
// with a colored legend swatch beneath it. Presentational.
import { type AvgDeltaEntry } from './results-data'

export function AvgDeltaCard({ entries }: { entries: AvgDeltaEntry[] }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5">
      <p className="text-[13px] font-semibold text-ink">Avg delta</p>
      <div className="mt-9 grid grid-cols-2">
        {entries.map((d) => (
          <div key={d.name} className="flex flex-col gap-1.5">
            <span
              className="text-[35px] font-semibold leading-none tracking-[-0.08px]"
              style={{ color: d.positive ? '#1f866a' : '#d82c0d' }}
            >
              {d.delta}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-ink">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: d.color }} />
              {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
