// CX Journey → Overview: one long scrollable mock page. The Overview/Topics/
// Automations strip is decorative (no routing); only the trends granularity
// toggle is interactive.
import { useState } from 'react'
import { AgentsBreakdownTable } from './AgentsBreakdownTable'
import { ConversationFlowSection } from './ConversationFlowSection'
import { type Granularity } from './cx-journey-data'
import { TrendsSection } from './TrendsSection'

const TABS = ['Overview', 'Topics', 'Automations']

export function CxJourneyView() {
  const [granularity, setGranularity] = useState<Granularity>('weekly')
  return (
    <div data-testid="view-cx-journey" className="h-full overflow-y-auto">
      {/* Sticky header: stays pinned to the top of the scroll area with a
          frosted backdrop so content scrolls softly beneath it (per Figma). */}
      <div className="sticky top-0 z-10 flex items-center gap-6 rounded-t-[26px] bg-white/80 px-8 pb-4 pt-6 backdrop-blur-md">
        <h1 className="pb-3 text-[20px] font-semibold text-ink">CX Journey</h1>
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={
              i === 0
                ? '-mb-px border-b-2 border-ink pb-3 text-[14px] font-medium text-ink'
                : 'pb-3 text-[14px] text-ink-muted'
            }
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-12 px-8 pb-8">
        <ConversationFlowSection />
        <AgentsBreakdownTable />
        <TrendsSection granularity={granularity} onGranularityChange={setGranularity} />
      </div>
    </div>
  )
}
