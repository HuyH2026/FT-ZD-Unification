import { useState } from 'react'
import { AiStudioShell } from './AiStudioShell'
import { SuggestionCard } from './SuggestionCard'
import { TOPIC_SUGGESTIONS } from './suggestions-data'

// AI Studio panel for the CX Journey Topics context: a greeting, a subline, and
// a wrapping carousel of "quick win" suggestion cards, rendered through the
// shared AiStudioShell. Presentation-only.
export function TopicSuggestionsPanel({ onClose }: { onClose?: () => void }) {
  const total = TOPIC_SUGGESTIONS.length
  const [index, setIndex] = useState(0)
  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <AiStudioShell testId="ai-studio-topics-panel" onClose={onClose}>
      {/* Two-line greeting */}
      <p className="mt-6 text-[22px] leading-[30px] tracking-[0.352px] text-black">
        Hello, Sunny 👋
        <br />
        Here&apos;s 3 quick wins you can knock out today.
      </p>

      {/* Subline */}
      <p className="mt-4 text-[14px] leading-5 tracking-[-0.154px] text-ink">
        Each is a quick action with real dollars behind it.
      </p>

      {/* Suggestion carousel */}
      <div className="mt-4 mb-4">
        <SuggestionCard
          suggestion={TOPIC_SUGGESTIONS[index]}
          index={index}
          total={total}
          onPrev={prev}
          onNext={next}
        />
      </div>
    </AiStudioShell>
  )
}
