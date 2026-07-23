// Recommendation + Key Learning card, paired with the winner card in the top
// row of the Results tab. Presentational.
import { RESULTS_RECOMMENDATION, KEY_LEARNING } from './results-data'

export function RecommendationCard() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-border bg-white p-4">
      <p className="text-[12px] font-semibold text-ink">{RESULTS_RECOMMENDATION.title}</p>
      <p className="mt-2 text-[12px] text-ink">In accordance with the hypothesis, it is recommended that we:</p>
      <ul className="mt-1 list-disc pl-4 text-[12px] text-ink">
        {RESULTS_RECOMMENDATION.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <p className="mt-4 text-[12px] font-semibold text-ink">{KEY_LEARNING.title}</p>
      <ul className="mt-1 list-disc pl-4 text-[12px] text-ink">
        {KEY_LEARNING.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end gap-2 border-t border-surface-border pt-4">
        <button type="button" className="rounded-full border border-grey-500 px-3.5 py-1.5 text-[11px] font-semibold text-ink">
          View conversations
        </button>
        <button type="button" className="rounded-full border border-grey-500 px-3.5 py-1.5 text-[11px] font-semibold text-ink">
          View agent
        </button>
      </div>
    </div>
  )
}
