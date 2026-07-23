// Full-screen AI Studio "Review plan" takeover (Figma 768-44408 / 768-44545).
// A frosted-glass modal over the editor with two panes: a left chat column
// (context Q&A bubble → intro reasoning → improvement-plan card → composer) and
// a right plan-detail column (Summary card + numbered plan sections). There is
// no Approve button — the user types "Approve" into the composer, which flips
// the plan card to an "Approved" badge and shows a "Working…" row; the parent
// then closes the view and reveals the inline diff preview. Presentational mock.
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Menu, X } from 'lucide-react'
import { ZendeskLogo } from '@/components/ZendeskLogo'
import {
  AI_STUDIO_PLAN, AI_STUDIO_ANALYSIS, AI_STUDIO_QA_BUBBLE, AI_STUDIO_APPROVE_WORD,
} from './ai-studio-data'

function GradientSparkle({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="aiStudioFullSparkle" x1="3" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#01567A" />
          <stop offset="1" stopColor="#6DBBD7" />
        </linearGradient>
      </defs>
      <path
        d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"
        stroke="url(#aiStudioFullSparkle)"
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// The improvement-plan card in the left chat column. Shows an "Approved" badge
// once the user approves (per the full-view frame).
function PlanCard({ approved }: { approved: boolean }) {
  const plan = AI_STUDIO_PLAN
  return (
    <div className="rounded-xl border border-[#acbdd5] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[30px] leading-none" aria-hidden>{plan.emoji}</span>
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold leading-5 text-black">
              {plan.title}
              <span className="size-1 rounded-full bg-[#545767]" aria-hidden />
              <span className="text-[#545767]">{plan.channel}</span>
            </span>
            <span className="text-[12px] leading-[18px] text-[#545767]">{plan.agentName}</span>
          </div>
        </div>
        {approved && (
          <span className="flex items-center gap-1 rounded-full bg-[#c3e3e1] px-2 py-1 text-[11px] font-semibold text-[#006a61]">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {plan.approvedLabel}
          </span>
        )}
      </div>
    </div>
  )
}

// A "New policy" labelled block (Call to Action / Context) and list blocks
// (Constraints / Content).
function PolicyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-semibold leading-5 text-black">{label}</p>
      <p className="text-[14px] leading-5 text-black">{text}</p>
    </div>
  )
}

function PolicyListBlock({ label, items, ordered }: { label: string; items: string[]; ordered?: boolean }) {
  const ListTag = ordered ? 'ol' : 'ul'
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-semibold leading-5 text-black">{label}</p>
      <ListTag className={`${ordered ? 'list-decimal' : 'list-disc'} ps-5 text-[14px] leading-5 text-black`}>
        {items.map((item, i) => (
          <li key={i} className="mb-1">{item}</li>
        ))}
      </ListTag>
    </div>
  )
}

export function AiStudioFullView({
  onClose, onApprove,
}: {
  onClose: () => void
  // Called once the user types the approve word. The parent runs the
  // "Working…" delay then closes + shows the inline preview.
  onApprove: () => void
}) {
  const plan = AI_STUDIO_PLAN
  const s1 = plan.sections[0]
  const newPolicy = s1.newPolicy!
  const [approved, setApproved] = useState(false)
  const [composer, setComposer] = useState('')
  const workingRef = useRef<HTMLDivElement>(null)

  // When the "Working…" row appears (after approval), scroll it into view so
  // the user sees the flow is in progress even if the chat column was short.
  // (scrollIntoView is unimplemented in jsdom — guard so tests don't throw.)
  useEffect(() => {
    if (approved && typeof workingRef.current?.scrollIntoView === 'function') {
      workingRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [approved])

  const submit = () => {
    const value = composer.trim()
    setComposer('')
    if (value.toLowerCase() === AI_STUDIO_APPROVE_WORD.toLowerCase() && !approved) {
      setApproved(true)
      onApprove()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/10 p-2">
      <div
        data-testid="ai-studio-full-view"
        role="dialog"
        aria-modal="true"
        aria-label="AI Studio — Review plan"
        className="relative flex flex-1 overflow-hidden rounded-[30px] border border-white/80 bg-white/65 shadow-[0px_0px_30px_0px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
      >
        {/* Left: chat column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header: menu + Zendesk logo + AI Studio */}
          <div className="flex shrink-0 items-center gap-4 px-6 py-5">
            <Menu size={24} className="text-[#545767]" aria-hidden />
            <div className="flex items-center gap-0.5">
              <ZendeskLogo size={24} />
              <span className="ml-1 text-[18px] font-semibold text-[#545767]">AI Studio</span>
              <GradientSparkle size={19} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-20 pb-4">
            {/* Context-gathering Q&A bubble */}
            <div className="mb-6 flex justify-end">
              <div
                className="max-w-[487px] rounded-[25px] px-4 py-3.5 text-right text-[16px] leading-[22px] text-white"
                style={{ background: 'linear-gradient(90deg,#01567a,#4aa7c9)' }}
              >
                {AI_STUDIO_QA_BUBBLE.map((line, i) => (
                  <p key={i} className="leading-[22px]">{line || ' '}</p>
                ))}
              </div>
            </div>

            {/* Thinking complete + intro reasoning */}
            <div className="mb-2 flex items-center gap-2 py-2">
              <span className="text-[14px] font-medium leading-5 text-[#727583]">
                {AI_STUDIO_ANALYSIS.thinkingLabel}
              </span>
              <ChevronRight size={18} className="text-[#727583]" aria-hidden />
            </div>
            <p className="mb-6 text-[16px] leading-6 text-black">{plan.intro}</p>

            {/* Improvement plan card */}
            <PlanCard approved={approved} />

            {/* Working indicator (after approval) */}
            {approved && (
              <div ref={workingRef} className="mt-6 flex items-center gap-2 scroll-mb-4">
                <ZendeskLogo size={24} className="text-[#545767]" />
                <span className="animate-pulse text-[14px] font-medium text-[#545767]">
                  {plan.workingLabel}
                </span>
              </div>
            )}
          </div>

          {/* Composer + footer hint */}
          <div className="px-20 pb-4">
            <div className="flex items-center gap-2 rounded-full border border-[#ffb393] bg-white px-4 py-3">
              <input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="What can I help you with today?"
                className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-[#727583]"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={submit}
                className="flex size-6 items-center justify-center rounded"
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 12l16-8-6 16-3-6-7-2z" stroke="#727583" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[12px] font-semibold text-[#9194a0]">
              Press &apos;/&apos; to open AI Studio, or &apos;Esc&apos; to close, or hold Space to dictate.
            </p>
          </div>
        </div>

        {/* Right: plan detail column */}
        <div className="m-3 flex w-[590px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-white/65">
          <div className="flex shrink-0 items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2">
              <GradientSparkle size={18} />
              <span className="flex items-center gap-1 text-[12px] font-medium text-[#545767]">
                {plan.title}
                <span className="size-[3px] rounded-full bg-[#545767]" aria-hidden />
                {plan.channel}
              </span>
            </div>
            <button
              type="button"
              aria-label="Close review plan"
              onClick={onClose}
              className="flex size-6 items-center justify-center rounded text-[#5c6970] hover:bg-[#f5f6f7]"
            >
              <X size={24} aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <div className="mb-4 border-t border-surface-border pt-4">
              <h2 className="text-[20px] font-semibold leading-[30px] text-black">{plan.agentName}</h2>
            </div>

            {/* Summary card */}
            <div
              className="mb-8 flex flex-col gap-2.5 rounded-xl border border-[#f2f4f7] p-4"
              style={{ background: 'linear-gradient(164deg,rgba(255,179,147,0.15),rgba(171,213,250,0.15) 50%,rgba(18,166,180,0.15))' }}
            >
              <p className="text-[14px] font-semibold leading-5 text-black">{plan.summary.title}</p>
              <ul className="list-disc ps-5 text-[14px] leading-5 text-black">
                {plan.summary.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="flex items-center gap-2 text-[14px] font-medium leading-5 text-black">
                <GradientSparkle size={19} />
                {plan.summary.note}
              </p>
            </div>

            {/* Section 01 — Update Policy Description + New policy detail */}
            <div className="mb-8 flex gap-3">
              <span className="w-9 shrink-0 text-[18px] font-medium leading-[22px] text-[#545767]">{s1.number}</span>
              <div className="flex flex-1 flex-col gap-2">
                <h3 className="text-[18px] font-semibold leading-[22px] text-black">{s1.title}</h3>
                <p className="text-[14px] leading-5 text-[#545767]">{s1.body}</p>
              </div>
            </div>
            <div className="mb-8 ms-12 flex flex-col gap-4 border-t border-surface-border pt-4">
              <p className="text-[16px] font-semibold leading-5 text-black">{newPolicy.heading}</p>
              <PolicyBlock label={newPolicy.callToAction.label} text={newPolicy.callToAction.text} />
              <PolicyBlock label={newPolicy.context.label} text={newPolicy.context.text} />
              <PolicyListBlock label={newPolicy.constraints.label} items={newPolicy.constraints.items} />
              <div className="border-t border-surface-border pt-4">
                <PolicyListBlock label={newPolicy.content.label} items={newPolicy.content.items} ordered />
                <p className="mt-2 text-[14px] leading-5 text-black">{newPolicy.content.footnote}</p>
              </div>
            </div>

            {/* Sections 02, 03 — prose steps */}
            {plan.sections.slice(1).map((section) => (
              <div key={section.number} className="mb-6 flex gap-3 border-t border-surface-border pt-6">
                <span className="w-9 shrink-0 text-[18px] font-medium leading-[22px] text-[#545767]">{section.number}</span>
                <div className="flex flex-1 flex-col gap-2">
                  <h3 className="text-[18px] font-semibold leading-[22px] text-black">{section.title}</h3>
                  <p className="text-[14px] leading-5 text-[#545767]">{section.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
