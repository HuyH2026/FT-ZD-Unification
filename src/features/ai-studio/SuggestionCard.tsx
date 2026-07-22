import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { TopicSuggestion } from './suggestions-data'

// One AI Studio "quick win" card: sparkle + pager row, title, "What it is:"
// bullet list, and a full-width CTA. The CTA is presentational (no-op). Pager
// controls are driven by the parent carousel via onPrev/onNext.
export function SuggestionCard({
  suggestion,
  index,
  total,
  onPrev,
  onNext,
}: {
  suggestion: TopicSuggestion
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-[0px_0px_30px_0px_rgba(0,0,0,0.06)]">
      {/* Sparkle + pager */}
      <div className="mb-3 flex items-center justify-between">
        <Sparkles className="h-4 w-4 text-ink-muted" />
        <div className="flex items-center gap-1 text-[12px] text-ink-muted">
          <button type="button" aria-label="Previous suggestion" onClick={onPrev} className="rounded p-0.5">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>
            {index + 1} of {total}
          </span>
          <button type="button" aria-label="Next suggestion" onClick={onNext} className="rounded p-0.5">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-[14px] font-semibold text-ink">{suggestion.title}</p>

      {/* What it is */}
      <p className="mt-3 text-[12px] font-medium text-ink">What it is:</p>
      <ul className="mt-1 list-disc pl-5 text-[12px] leading-5 text-ink-muted">
        {suggestion.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      {/* CTA (presentational) */}
      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-surface-border py-2 text-[13px] font-medium text-accent-blue transition-colors hover:bg-[#f5f6f7]"
      >
        {suggestion.cta}
      </button>
    </div>
  )
}
