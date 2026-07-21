import { ChevronDown, Users, Braces, ChartPie, Globe, CircleHelp, Sparkles } from 'lucide-react'
import { ZendeskLogo } from '@/components/ZendeskLogo'
import { OrgSwitcher } from './OrgSwitcher'

const ICON_BUTTONS: { Icon: typeof Users; label: string }[] = [
  { Icon: Users, label: 'Team' },
  { Icon: Braces, label: 'Developer tools' },
  { Icon: ChartPie, label: 'Reports' },
  { Icon: Globe, label: 'Language & region' },
  { Icon: CircleHelp, label: 'Help' },
]

export function TopBar() {
  return (
    <div className="flex shrink-0 items-center justify-between h-[55px] bg-app-backdrop px-5">
      {/* Left: logo, product switcher, org switcher */}
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center">
          <ZendeskLogo size={20} className="text-ink" />
        </div>

        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-[rgba(92,105,112,0.08)]">
          <span className="text-[14px] font-semibold leading-5 tracking-[-0.154px] text-ink">
            AI Agent
          </span>
          <ChevronDown size={16} className="text-ink" />
        </button>

        <OrgSwitcher />
      </div>

      {/* Right: icon cluster + avatar */}
      <div className="flex items-center gap-2">
        {ICON_BUTTONS.map(({ Icon, label }) => (
          <button
            key={label}
            aria-label={label}
            className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-[rgba(92,105,112,0.08)]"
          >
            <Icon size={20} className="text-ink" />
          </button>
        ))}
        <button
          aria-label="AI assistant"
          className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8d59b1] to-[#406cc4]"
        >
          <Sparkles size={20} className="text-white" />
        </button>
        <div className="size-6 rounded-full bg-[#d9d7d5]" />
      </div>
    </div>
  )
}
