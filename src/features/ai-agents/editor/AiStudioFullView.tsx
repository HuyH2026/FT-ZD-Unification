// Full-screen AI Studio "Review plan" takeover (Figma 768-44009 / 768-44408).
// Two panes: a left chat column (intro reasoning + improvement-plan card with
// an Approve button + composer) and a right plan-detail column (Summary card +
// numbered plan sections). Presentational mock — Approve/close are wired to the
// parent, but no policy is actually mutated. Rendered as a fixed overlay.
import { useState } from 'react'
import { ChevronRight, Check, Send, Plus, X } from 'lucide-react'
import { ZendeskLogo } from '@/components/ZendeskLogo'
import { AI_STUDIO_PLAN, AI_STUDIO_ANALYSIS } from './ai-studio-data'

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

// The improvement-plan card shown in the left chat column. Shows an Approve
// button until approved, then an "Approved" badge (per the full-view frame).
function PlanCard({ approved }: { approved: boolean }) {
  return (
    <div className="rounded-xl border border-[#e4e7f0] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[24px] leading-5" aria-hidden>{AI_STUDIO_PLAN.emoji}</span>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold leading-5 tracking-[-0.1px] text-black">
              {`${AI_STUDIO_PLAN.title} • ${AI_STUDIO_PLAN.channel}`}
            </span>
            <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#545767]">
              {AI_STUDIO_PLAN.agentName}
            </span>
          </div>
        </div>
        {approved && (
          <span className="flex items-center gap-1 rounded-full bg-[#dbf3ea] px-2.5 py-1 text-[12px] font-medium text-[#0f8a5f]">
            <Check size={14} aria-hidden /> Approved
          </span>
        )}
      </div>
    </div>
  )
}

export function AiStudioFullView({ onClose }: { onClose: () => void }) {
  const [approved, setApproved] = useState(false)
  const plan = AI_STUDIO_PLAN

  return (
    <div
      data-testid="ai-studio-full-view"
      role="dialog"
      aria-modal="true"
      aria-label="AI Studio — Review plan"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* Header: menu + AI Studio logo/title */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-surface-border px-6">
        <ZendeskLogo className="size-6" />
        <span className="text-[18px] font-medium text-ink">AI Studio</span>
        <GradientSparkle size={16} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: chat column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-16 py-8">
            {/* User question bubble */}
            <div className="mb-6 flex justify-end">
              <p
                className="max-w-[80%] rounded-2xl px-4 py-3.5 text-right text-[14px] leading-5 text-white"
                style={{ background: 'linear-gradient(90deg,#01567a,#6dbbd7)' }}
              >
                {plan.reviewLabel}
              </p>
            </div>

            {/* Thinking complete + intro reasoning */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[14px] leading-5 text-[#727583]">
                {AI_STUDIO_ANALYSIS.thinkingLabel}
              </span>
              <ChevronRight size={16} className="text-[#727583]" aria-hidden />
            </div>
            <p className="mb-6 text-[16px] leading-6 text-ink">{plan.intro}</p>

            {/* Improvement plan card + Approve */}
            <PlanCard approved={approved} />
            {!approved && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setApproved(true)}
                  className="rounded-full px-6 py-3 text-[14px] font-semibold text-white"
                  style={{ background: 'linear-gradient(90deg,#01567a,#6dbbd7)' }}
                >
                  Approve
                </button>
              </div>
            )}

            {approved && (
              <div className="mt-6 flex items-center gap-2 text-[14px] text-ink-muted">
                <ZendeskLogo className="size-6" />
                Working…
              </div>
            )}
          </div>

          {/* Composer + footer hint */}
          <div className="px-16 pb-4">
            <div className="flex items-center gap-2 rounded-full border border-[#ffb393] bg-white px-3 py-3 shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]">
              <button type="button" aria-label="Add attachment" className="flex size-6 items-center justify-center rounded-full text-black">
                <Plus size={16} aria-hidden />
              </button>
              <input
                readOnly
                placeholder="What can I help you with today?"
                className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-[#727583]"
              />
              <button type="button" aria-label="Send message" className="flex size-9 items-center justify-center rounded-full">
                <Send size={20} className="text-[#727583]" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-center text-[12px] text-ink-muted">
              Press &apos;/&apos; to open AI Studio, or &apos;Esc&apos; to close, or hold Space to dictate.
            </p>
          </div>
        </div>

        {/* Right: plan detail column */}
        <div className="flex w-[600px] shrink-0 flex-col overflow-hidden border-l border-surface-border">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2">
              <GradientSparkle size={18} />
              <span className="text-[14px] font-medium text-ink">
                {`${plan.title} • ${plan.channel}`}
              </span>
            </div>
            <button
              type="button"
              aria-label="Close review plan"
              onClick={onClose}
              className="flex size-6 items-center justify-center rounded text-[#5c6970] hover:bg-[#f5f6f7]"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <h2 className="mb-4 text-[24px] font-medium text-ink">{plan.agentName}</h2>

            {/* Summary card */}
            <div
              className="mb-8 rounded-xl p-4"
              style={{ background: 'linear-gradient(120deg,#fdecec,#e3f0f9)' }}
            >
              <p className="mb-2 text-[14px] font-semibold text-ink">{plan.summary.title}</p>
              <ul className="list-disc ps-5 text-[14px] leading-5 text-ink">
                {plan.summary.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="mt-3 flex items-center gap-2 text-[14px] text-ink">
                <GradientSparkle size={16} />
                {plan.summary.note}
              </p>
            </div>

            {/* Numbered plan sections */}
            {plan.sections.map((section) => (
              <div key={section.number} className="mb-6">
                <div className="mb-2 flex items-start gap-4">
                  <span className="text-[15px] text-ink-muted">{section.number}</span>
                  <h3 className="text-[16px] font-semibold text-ink">{section.title}</h3>
                </div>
                <p className="ms-9 text-[14px] leading-5 text-ink-muted">{section.body}</p>

                <div className="ms-9 mt-4 border-t border-dashed border-surface-border pt-4">
                  <p className="mb-3 text-[14px] font-medium text-ink">{section.newPolicy.heading}</p>
                  {section.newPolicy.blocks.map((block) => (
                    <div key={block.label} className="mb-4">
                      <p className="mb-1 text-[14px] font-medium text-ink">{block.label}</p>
                      <p className="text-[14px] leading-5 text-ink-muted">{block.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
