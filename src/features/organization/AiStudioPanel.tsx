import { Building2, BookOpen, SlidersHorizontal, Bot } from 'lucide-react'
import { AiStudioShell } from '@/features/ai-studio/AiStudioShell'

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

// Organization dashboard AI Studio panel: onboarding steps rendered through the
// shared AiStudioShell. Presentational — no backend this phase.
export function AiStudioPanel({ onClose }: { onClose?: () => void }) {
  return (
    <AiStudioShell onClose={onClose}>
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
    </AiStudioShell>
  )
}
