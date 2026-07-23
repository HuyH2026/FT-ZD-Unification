// Recommendation + Key Learning card, paired with the winner card in the top
// row of the Results tab. Presentational.
import { type ResultsRecommendation } from './results-data'

export function RecommendationCard({ recommendation, keyLearning }: { recommendation: ResultsRecommendation; keyLearning: ResultsRecommendation }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-border bg-white p-4">
      <p className="text-[12px] font-semibold text-ink">{recommendation.title}</p>
      <p className="mt-2 text-[12px] text-ink">In accordance with the hypothesis, it is recommended that we:</p>
      <ul className="mt-1 list-disc pl-4 text-[12px] text-ink">
        {recommendation.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <p className="mt-4 text-[12px] font-semibold text-ink">{keyLearning.title}</p>
      <ul className="mt-1 list-disc pl-4 text-[12px] text-ink">
        {keyLearning.bullets.map((b) => (
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
