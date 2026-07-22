// Zone 2 of the Topics tab: an 8-card metric grid. Lean local card (the
// ai-performances StatCards is hard-wired to a channel breakdown this design
// doesn't have). The Sentiment card carries a green smiley chip.
import { Info, Smile } from 'lucide-react'
import { TOPIC_STATS } from './topics-data'

export function TopicStatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TOPIC_STATS.map((card) => (
        <div key={card.title} className="rounded-2xl border border-surface-border bg-white p-4">
          <p className="flex items-center gap-1 text-[13px] text-ink-muted">
            {card.title}
            <Info className="h-3 w-3 text-ink-muted" />
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {card.sentiment ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c9efd6]">
                <Smile className="h-5 w-5 text-[#2f8a4f]" />
              </span>
            ) : null}
            <span className="text-[32px] font-semibold leading-none" style={{ color: card.valueColor ?? undefined }}>
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
