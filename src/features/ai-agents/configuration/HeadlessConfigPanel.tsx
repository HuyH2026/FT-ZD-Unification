// Right column of the Headless tab: a white elevated card with the API-key and
// A2A-connection sections, plus a slim rail (Headless active; Knowledge &
// Personality are decorative/deferred, mirroring the Widget rail pattern).
// Presentational — reveal/refresh bubble up via handlers.
import { Blocks, BookOpen, Eye, EyeOff, Heart, IdCard, MessageSquarePlus, type LucideIcon } from 'lucide-react'
import { CopyField } from './CopyField'
import { A2A_AGENT_CARD_URL, A2A_MESSAGE_ENDPOINT, API_KEY_MASK } from './config-data'

type Section = { id: string; label: string; Icon: LucideIcon }
const SECTIONS: Section[] = [
  { id: 'headless', label: 'Headless', Icon: Blocks },
  { id: 'knowledge', label: 'Knowledge', Icon: BookOpen },
  { id: 'personality', label: 'Personality', Icon: Heart },
]

type HeadlessConfigPanelProps = {
  apiKey: string
  revealed: boolean
  onToggleReveal: () => void
  onRefreshKey: () => void
  activeSection: string
  onSectionChange: (id: string) => void
}

function A2ARow({ icon: Icon, label, value, caption }: { icon: LucideIcon; label: string; value: string; caption: string }) {
  return (
    <div>
      <CopyField value={value} variant="light" aria-label={`Copy ${label}`}>
        <div className="w-[360px] max-w-full border-r border-[#f1efed] bg-[#fbfbfb] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Icon size={16} className="text-ink-muted" aria-hidden />
            <span className="text-[12px] font-medium text-black">{label}</span>
          </div>
          <p className="mt-2 break-all font-mono text-[12px] leading-[18px] tracking-[-0.1px] text-grey-800">{value}</p>
        </div>
      </CopyField>
      <p className="mt-2 text-[12px] leading-[18px] tracking-[-0.1px] text-grey-800">{caption}</p>
    </div>
  )
}

export function HeadlessConfigPanel({
  apiKey, revealed, onToggleReveal, onRefreshKey, activeSection, onSectionChange,
}: HeadlessConfigPanelProps) {
  return (
    <div className="flex h-full shrink-0">
      {/* Card */}
      <div className="w-[480px] overflow-y-auto bg-white px-6 py-6 shadow-[0px_0px_1px_0px_rgba(0,12,32,0.02),2px_8px_16px_0px_rgba(3,17,38,0.11)]">
        <h2 className="text-[24px] font-semibold leading-[28px] tracking-[-0.1px] text-black">Headless</h2>

        {/* API key */}
        <div className="mt-6">
          <p className="text-[16px] font-semibold leading-[22px] text-black">API key</p>
          <p className="mt-3 text-[14px] leading-5 text-black">
            This API key is a unique identifier used for authenticating and authorizing access to an API.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[16px] leading-[22px] tracking-[-0.1px] text-black">
              {revealed ? apiKey : API_KEY_MASK}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={revealed ? 'Hide API key' : 'Show API key'}
                onClick={onToggleReveal}
                className="rounded p-1.5 text-ink-muted"
              >
                {revealed ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
              </button>
              <CopyField value={apiKey} variant="dark" aria-label="Copy API key" className="w-auto bg-transparent px-0 py-0 text-ink-muted">
                <span className="sr-only">API key</span>
              </CopyField>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefreshKey}
            className="mt-4 w-full rounded bg-[#ebf5f7] px-4 py-1.5 text-[14px] font-semibold text-[#193d50]"
          >
            Refresh API key
          </button>
          <p className="mt-4 text-[12px] leading-[18px] tracking-[-0.1px] text-grey-800">
            Clicking on 'Refresh' wil make the system generate a new API token for setting up connection. Once
            regenerated, the previous token will be inaccessible.
          </p>
        </div>

        <hr className="my-6 border-t border-surface-border" />

        {/* A2A connection */}
        <div>
          <p className="text-[16px] font-semibold leading-[22px] text-black">A2A connection</p>
          <p className="mt-4 text-[14px] leading-5 text-black">
            Adds an agent card and message endpoint so other agents can discover, authenticate, and call yours
            automatically. Copy these into your A2A client.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <A2ARow icon={IdCard} label="Agent Card" value={A2A_AGENT_CARD_URL} caption="What your client reads to discover this agent." />
            <A2ARow icon={MessageSquarePlus} label="Message endpoint" value={A2A_MESSAGE_ENDPOINT} caption="Where the agent sends and streams messages." />
          </div>
        </div>
      </div>

      {/* Slim rail */}
      <div className="flex w-[80px] shrink-0 flex-col items-center gap-3 bg-white px-2 pt-5 shadow-[-0.5px_0px_0px_#e4e7f0]">
        {SECTIONS.map(({ id, label, Icon }) => {
          const active = id === activeSection
          return (
            <div key={id} className="flex flex-col items-center gap-1">
              <button
                type="button"
                aria-label={label}
                aria-pressed={active}
                onClick={() => onSectionChange(id)}
                className={`flex size-10 items-center justify-center rounded ${active ? 'bg-[#ebf5f7] text-[#193d50]' : 'text-ink-muted'}`}
              >
                <Icon size={24} aria-hidden />
              </button>
              <span className="text-[11px] font-semibold tracking-[-0.1px] text-grey-800">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
