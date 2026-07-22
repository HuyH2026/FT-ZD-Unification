import type { ReactNode } from 'react'
import { Plus, ExternalLink, X } from 'lucide-react'

// Reusable AI Studio assistant shell: a white card with a header (sparkle +
// "AI Studio" title, external-link and close actions), a scrollable body slot,
// and a presentational chat composer pinned to the bottom. Static shell — the
// composer, `+`, send, and external-link are no-ops (no backend this phase).
// `onClose` is wired to the header X button so the parent can hide the panel.
export function AiStudioShell({
  testId = 'ai-studio-panel',
  onClose,
  children,
}: {
  testId?: string
  onClose?: () => void
  children: ReactNode
}) {
  return (
    <aside
      data-testid={testId}
      className="flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-[#f8f8f8] bg-white"
    >
      {/* Header: AI Studio title + action buttons */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2.5">
        <div className="flex items-center gap-1">
          <span className="text-[15px] font-semibold leading-[22px] tracking-[-0.085px] text-[#545767]">
            AI Studio
          </span>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="aiStudioSparkle" x1="3" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#01567A" />
                <stop offset="1" stopColor="#6DBBD7" />
              </linearGradient>
            </defs>
            <path
              d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"
              stroke="url(#aiStudioSparkle)"
              strokeWidth={1.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Open in new tab"
            className="flex size-6 items-center justify-center rounded text-[#5c6970] transition-colors hover:bg-[#f5f6f7]"
          >
            <ExternalLink size={16} />
          </button>
          <button
            aria-label="Close AI Studio"
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded text-[#5c6970] transition-colors hover:bg-[#f5f6f7]"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5">{children}</div>

      {/* Chat composer: peach-bordered pill with + and gradient sparkle send */}
      <div className="px-5 pb-5 pt-2">
        <div className="flex items-center gap-2 rounded-full border border-[#ffb393] bg-white px-2 py-2 shadow-[0px_0px_1px_0px_rgba(0,12,32,0.04),0px_2px_6px_0px_rgba(3,17,38,0.11)]">
          <button
            aria-label="Add attachment"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-black transition-colors hover:bg-[#f5f6f7]"
          >
            <Plus size={16} />
          </button>
          <input
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-5 tracking-[-0.1px] text-ink outline-none placeholder:text-[#727583]"
            placeholder="What can I help you with today?"
          />
          <button
            aria-label="Send message"
            className="flex size-6 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="aiStudioSend" x1="3" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#01567A" />
                  <stop offset="1" stopColor="#6DBBD7" />
                </linearGradient>
              </defs>
              <path
                d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"
                stroke="url(#aiStudioSend)"
                strokeWidth={1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
