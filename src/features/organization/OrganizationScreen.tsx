import { useState } from 'react'
import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'
import { useOrgs } from '@/app/org-context'
import { OrgRow } from './OrgRow'
import { OrgIllustration } from './OrgIllustration'
import { AiStudioPanel } from './AiStudioPanel'

export function OrganizationScreen() {
  const { orgs } = useOrgs()
  const [showStudio, setShowStudio] = useState(true)

  return (
    <div className="flex h-full gap-2">
      {/* Main content surface */}
      <div
        data-testid="screen-organization"
        className="h-full flex-1 overflow-y-auto rounded-[26px] bg-white p-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[26px] leading-8 text-ink">Organization</h1>
          <div className="flex items-center gap-2">
            <button
              aria-label={showStudio ? 'Hide AI Studio' : 'Show AI Studio'}
              aria-pressed={showStudio}
              onClick={() => setShowStudio((s) => !s)}
              className="flex size-8 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: showStudio ? 'rgba(12,12,13,0.08)' : 'transparent' }}
            >
              <Sparkles size={18} className="text-ink" />
            </button>
            <Link
              to="/organization/new"
              className="h-10 px-4 rounded-full bg-ink flex items-center justify-center text-white font-semibold text-sm leading-5 whitespace-nowrap"
            >
              Create new
            </Link>
          </div>
        </div>

        {/* Decorative flora glow illustration, centered above the intro copy.
            Sized to the visible cluster; the glow's faint edges bleed past it
            harmlessly. Kept short so the copy sits close beneath it. */}
        <div className="flex justify-center h-[190px] mb-6">
          <OrgIllustration className="h-[190px] w-[404px]" />
        </div>

        {/* Intro copy */}
        <div className="flex justify-center mb-12">
          <p className="w-[680px] text-center text-ink text-sm leading-5">
            Create your organization and pick the channels where you want your AI to show up. You can
            set up how it behaves on each one later, in <span className="underline">Configuration</span>.
          </p>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[minmax(200px,1fr)_minmax(300px,2fr)_minmax(120px,auto)_40px] gap-4 px-3 mb-3">
          <span className="font-semibold text-ink text-sm leading-5">Name</span>
          <span className="font-semibold text-ink text-sm leading-5">Channels</span>
          <span className="font-semibold text-ink text-sm leading-5">Resolution rate</span>
          <span></span>
        </div>

        {/* Org Rows */}
        <div className="flex flex-col gap-3">
          {orgs.map((org) => (
            <OrgRow key={org.id} org={org} />
          ))}
        </div>
      </div>

      {/* AI Studio assistant panel */}
      {showStudio && <AiStudioPanel onClose={() => setShowStudio(false)} />}
    </div>
  )
}
