// CX Journey. The Overview/Topics/Automation strip is now interactive (local
// state, no routing): Overview is the scrollable mock dashboard, Automation is
// the agent-gaps view, Topics is a placeholder. The trends granularity toggle
// within Overview stays interactive.
import { useState } from 'react'
import { AgentsBreakdownTable } from './AgentsBreakdownTable'
import { AutomationView } from './AutomationView'
import { ConversationFlowSection } from './ConversationFlowSection'
import { type Granularity } from './cx-journey-data'
import { TrendsSection } from './TrendsSection'

type CxTab = 'Overview' | 'Topics' | 'Automation'
const TABS: CxTab[] = ['Overview', 'Topics', 'Automation']

export function CxJourneyView() {
  const [tab, setTab] = useState<CxTab>('Overview')
  const [granularity, setGranularity] = useState<Granularity>('weekly')
  return (
    <div data-testid="view-cx-journey" className="h-full overflow-y-auto">
      {/* Sticky header: stays pinned to the top of the scroll area with a
          frosted backdrop so content scrolls softly beneath it (per Figma). */}
      <div className="sticky top-0 z-10 flex items-center gap-6 rounded-t-[26px] bg-white/80 px-8 pb-4 pt-6 backdrop-blur-md">
        <h1 className="pb-3 text-[20px] font-semibold text-ink">CX Journey</h1>
        {TABS.map((t) => {
          const active = t === tab
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={
                active
                  ? '-mb-px border-b-2 border-ink pb-3 text-[14px] font-medium text-ink'
                  : 'pb-3 text-[14px] text-ink-muted'
              }
            >
              {t}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-12 px-8 pb-8">
        {tab === 'Overview' && (
          <>
            <ConversationFlowSection />
            <AgentsBreakdownTable />
            <TrendsSection granularity={granularity} onGranularityChange={setGranularity} />
          </>
        )}
        {tab === 'Automation' && <AutomationView />}
        {tab === 'Topics' && (
          <div className="flex h-64 items-center justify-center text-[14px] text-ink-muted">
            Coming soon
          </div>
        )}
      </div>
    </div>
  )
}
