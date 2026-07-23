// AI Studio assistant panel for the policy editor. Starts with a greeting and
// two suggestion bubbles; typing (or picking a suggestion) and hitting Enter
// posts the user's message and a canned analysis reply that ends in an
// "Improvement plan" card. The card's "Review plan" opens the full-view
// takeover (owned by the parent). Frontend-only mock — no model call.
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AiStudioShell } from '@/features/ai-studio/AiStudioShell'
import {
  AI_STUDIO_GREETING, AI_STUDIO_SUGGESTIONS, AI_STUDIO_REWRITE_PROMPT,
  AI_STUDIO_ANALYSIS, AI_STUDIO_PLAN,
} from './ai-studio-data'

// A right-aligned gradient user bubble.
function UserBubble({ text }: { text: string }) {
  return (
    <div className="mt-4 flex justify-end">
      <p
        className="max-w-[80%] rounded-2xl px-4 py-3.5 text-right text-[14px] leading-5 tracking-[-0.1px] text-white"
        style={{ background: 'linear-gradient(90deg,#01567a,#6dbbd7)' }}
      >
        {text}
      </p>
    </div>
  )
}

// The canned analysis reply + improvement-plan card.
function AnalysisReply({ onReview }: { onReview: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 py-2">
          <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#727583]">
            {AI_STUDIO_ANALYSIS.thinkingLabel}
          </span>
          <ChevronDown size={16} className="-rotate-90 text-[#727583]" aria-hidden />
        </div>
        {AI_STUDIO_ANALYSIS.paragraphs.map((p, i) => (
          <p key={i} className="text-[14px] leading-5 tracking-[-0.1px] text-[#202121]">
            {p}
          </p>
        ))}
      </div>

      <p className="text-[14px] font-semibold leading-5 tracking-[-0.1px] text-black">
        {AI_STUDIO_ANALYSIS.dropOffTitle}
      </p>
      <ul className="list-disc ps-5 text-[14px] leading-5 tracking-[-0.1px] text-black">
        {AI_STUDIO_ANALYSIS.dropOff.map((d) => (
          <li key={d.channel}>{`${d.channel}: ${d.rate}`}</li>
        ))}
      </ul>
      <p className="text-[14px] leading-5 tracking-[-0.1px] text-black">
        {AI_STUDIO_ANALYSIS.closing}
      </p>

      {/* Improvement plan card with a "Review plan" pill */}
      <div className="rounded-xl border border-[#e4e7f0] p-4">
        <div className="flex items-center gap-2">
          <span className="text-[24px] leading-5" aria-hidden>{AI_STUDIO_PLAN.emoji}</span>
          <span className="text-[14px] font-semibold leading-5 tracking-[-0.1px] text-black">
            {AI_STUDIO_PLAN.title}
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-[18px] tracking-[-0.1px] text-[#545767]">
          {AI_STUDIO_PLAN.agentName}
        </p>
        <button
          type="button"
          onClick={onReview}
          className="mt-2 w-full rounded-full border border-[#ebf5f7] bg-[#ebf5f7] px-3 py-1.5 text-[10px] font-semibold text-[#313131]"
        >
          {AI_STUDIO_PLAN.reviewLabel}
        </button>
      </div>
    </div>
  )
}

export function AiStudioEditorPanel({
  onClose, onReview,
}: {
  onClose: () => void
  onReview: () => void
}) {
  const [submitted, setSubmitted] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [composer, setComposer] = useState('')

  const submit = () => {
    setPrompt(composer.trim())
    setComposer('')
    setSubmitted(true)
  }

  return (
    <AiStudioShell
      testId="ai-studio-editor-panel"
      onClose={onClose}
      onExpand={submitted ? onReview : undefined}
      composerValue={composer}
      onComposerChange={setComposer}
      onComposerSubmit={submit}
    >
      {!submitted ? (
        <div className="flex h-full flex-col">
          <p className="mt-[150px] text-center text-[24px] leading-[30px] tracking-[-0.1px] text-black">
            {AI_STUDIO_GREETING}
          </p>
          <div className="mt-auto mb-2 flex flex-col items-start gap-2">
            {AI_STUDIO_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setComposer(s === AI_STUDIO_SUGGESTIONS[1] ? AI_STUDIO_REWRITE_PROMPT : s)}
                className="rounded-[25px] border border-[#d2d9e5] px-2.5 py-2 text-[12px] font-medium leading-[18px] tracking-[-0.1px] text-[#01567a]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pb-4">
          <UserBubble text={prompt || AI_STUDIO_REWRITE_PROMPT} />
          <AnalysisReply onReview={onReview} />
        </div>
      )}
    </AiStudioShell>
  )
}
