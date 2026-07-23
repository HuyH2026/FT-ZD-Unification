// The winning-variant card in the Results tab: trophy badge, winner label,
// one row per variant, and a "Publish winning variant" action. Presentational.
import { Trophy } from 'lucide-react'
import { WINNER_VARIANTS, WINNER_LABEL } from './results-data'

const GRADIENT =
  'linear-gradient(137deg, rgba(255,179,147,0.15) 0%, rgba(171,213,250,0.15) 50%, rgba(18,166,180,0.15) 100%)'

export function WinnerCard() {
  return (
    <div
      className="flex h-full flex-col gap-4 rounded-2xl border border-[#ffb393] p-4"
      style={{ backgroundImage: GRADIENT }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#ffbc42]">
          <Trophy size={16} className="text-ink" aria-hidden />
        </span>
        <p className="text-[13px] text-ink">
          Winner: <span className="font-semibold">{WINNER_LABEL}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {WINNER_VARIANTS.map((v) => (
          <div
            key={v.key}
            className={
              'flex flex-col gap-1 rounded-xl px-3 py-2 ' +
              (v.isWinner ? 'bg-white' : 'border border-surface-border')
            }
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold text-white"
                style={{ backgroundColor: v.badgeColor }}
              >
                {v.badge}
              </span>
              <span className="text-[12px] font-bold text-ink">{v.title}</span>
              {v.isWinner && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-[4px] bg-[#ffd483] px-1.5 py-0.5 text-[9px] font-semibold text-[#312819]">
                  Winner
                </span>
              )}
            </div>
            <p className="text-[10px] text-ink">
              {v.detail.split(': ')[0]}: <span className="text-black">{v.detail.split(': ')[1]}</span>
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-auto rounded-full bg-ink px-4 py-2 text-[12px] font-medium text-white"
      >
        Publish winning variant
      </button>
    </div>
  )
}
