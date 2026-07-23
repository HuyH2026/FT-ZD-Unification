// The right-side Summary + Recommendations panel on the A/B Test Setup screen.
// Fully static/presentational; "View version" and "Apply" are inert.
import { SUMMARY_VARIANTS, RECOMMENDATION } from '../experiments-data'

const GRADIENT =
  'linear-gradient(137deg, rgba(255,179,147,0.15) 0%, rgba(171,213,250,0.15) 50%, rgba(18,166,180,0.15) 100%)'

export function SummaryPanel() {
  return (
    <aside className="rounded-[24px] border border-surface-border bg-white/80 p-5 shadow-[0px_0px_15px_0px_rgba(0,0,0,0.04)]">
      <h2 className="text-[18px] text-ink">Summary</h2>

      <div
        className="mt-4 flex flex-col gap-4 rounded-[16px] border border-surface-border p-3.5"
        style={{ backgroundImage: GRADIENT }}
      >
        {SUMMARY_VARIANTS.map((v) => (
          <div key={v.badge} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: v.badgeColor }}
              >
                {v.badge}
              </span>
              <span className="text-[12px] font-medium text-ink">{v.title}</span>
            </div>
            <p className="text-[12px] leading-[17px] text-[#162040]">
              {v.body}{' '}
              <button type="button" className="font-semibold text-[#01567a] underline">
                View version
              </button>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[14px] text-ink">Recommendations</p>
      <div className="mt-2 rounded-[16px] border border-[#ffb393] p-3.5">
        <p className="text-[13px] font-semibold text-ink">{RECOMMENDATION.title}</p>
        <p className="mt-1.5 text-[12px] leading-[17px] text-[#162040]">{RECOMMENDATION.body}</p>
        <button
          type="button"
          className="mt-3 rounded-full border border-[#9c9a99] px-3 py-1 text-[11px] font-semibold text-ink"
        >
          Apply
        </button>
      </div>
    </aside>
  )
}
