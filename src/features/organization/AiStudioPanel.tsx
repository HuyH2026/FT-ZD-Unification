import { Building2, BookOpen, SlidersHorizontal, Bot, Plus, ExternalLink } from 'lucide-react'

type StepCard = {
  Icon: typeof BookOpen
  color: string
  title: string
  body: string
}

// The four onboarding steps shown inside the "AI Agent set up" sub-card, ported
// from the Figma "AI Studio active" frame. Icon colors match the design's hues.
const STEPS: StepCard[] = [
  {
    Icon: Building2,
    color: '#247acb',
    title: 'Organization Setup',
    body: 'Set your Organization name and select customer support channels.',
  },
  {
    Icon: BookOpen,
    color: '#be297b',
    title: 'Connect Knowledge',
    body: 'Connect a knowledge base so your Agents have source information to work with.',
  },
  {
    Icon: SlidersHorizontal,
    color: '#2f99b3',
    title: 'Channel Configuration',
    body: 'Set up your channels based on your brand specifications.',
  },
  {
    Icon: Bot,
    color: '#e05c34',
    title: 'Build Agent',
    body: 'Build your AI agent using natural language.',
  },
]

// Right-side AI Studio assistant panel on the Organization dashboard. A solid
// white card with a header (title + actions), a two-line greeting, the "AI Agent
// set up" steps in a frosted sub-card, and a chat composer pinned to the bottom.
// Static shell — the composer is presentational (no backend in this phase).
export function AiStudioPanel() {
  return (
    <aside
      data-testid="ai-studio-panel"
      className="flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-[#f8f8f8] bg-white"
    >
      {/* Header: AI Studio title + action buttons */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2.5">
        <div className="flex items-center gap-1">
          <span className="text-[15px] font-semibold leading-[22px] tracking-[-0.085px] text-[#545767]">
            AI Studio
          </span>
          {/* Sparkles with the design's teal gradient stroke */}
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
            aria-label="Expand panel"
            className="flex size-6 items-center justify-center rounded text-[#5c6970] transition-colors hover:bg-[#f5f6f7]"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5">
        {/* Two-line welcome */}
        <p className="mt-6 text-[22px] leading-[30px] tracking-[0.352px] text-black">
          Welcome, Sunny 👋
          <br />
          Let&apos;s set up your first AI organization.
        </p>

        {/* Copilot message */}
        <p className="mt-4 text-[14px] leading-5 tracking-[-0.154px] text-ink">
          Here are the next steps to get your AI Agent up and running.
        </p>

        {/* "AI Agent set up" frosted sub-card holding the steps */}
        <div className="mt-4 rounded-[20px] border border-white/80 bg-white/30 p-4 shadow-[0px_0px_30px_0px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <p className="mb-1 text-[12px] font-medium leading-5 tracking-[-0.154px] text-black">
            AI Agent set up
          </p>
          <div className="flex flex-col">
            {STEPS.map((step, i) => (
              <button
                key={step.title}
                className={`flex flex-col items-start gap-2 py-3 text-left ${
                  i < STEPS.length - 1 ? 'border-b border-[#e8e9eb]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <step.Icon size={18} color={step.color} strokeWidth={2} />
                  <span className="text-[14px] font-medium leading-5 tracking-[-0.154px] text-[#3d4040]">
                    {step.title}
                  </span>
                </div>
                <p className="text-[12px] leading-4 text-[#373a4d]">{step.body}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

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
