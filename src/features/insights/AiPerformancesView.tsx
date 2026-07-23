// Insights → AI Performances. A scrollable overview dashboard: the AI
// Performance page tabs, then four collapsible sections — Overview (flow +
// stat cards), Performance insights, Custom insights, and Conversation
// comparison. All data is mocked (see ./ai-performances/ai-performances-data).
import { useState } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'
import { ConversationComparison } from './ai-performances/ConversationComparison'
import { CustomInsights } from './ai-performances/CustomInsights'
import { FlowSankey } from './ai-performances/FlowSankey'
import { PerformanceInsights } from './ai-performances/PerformanceInsights'
import { DatePill, FilterPill, SectionHeader } from './ai-performances/SectionHeader'
import { StatCards } from './ai-performances/StatCards'

type PageTab = 'Overview' | 'Conversations' | 'Knowledge' | 'Intents'
const PAGE_TABS: PageTab[] = ['Overview', 'Conversations', 'Knowledge', 'Intents']

// Which sections are collapsed. Keyed by section id; a section is expanded when
// absent from the set.
type SectionId = 'overview' | 'performance' | 'custom' | 'comparison'

export function AiPerformancesView() {
  const [tab, setTab] = useState<PageTab>('Overview')
  const [collapsed, setCollapsed] = useState<Set<SectionId>>(new Set())

  const isCollapsed = (id: SectionId) => collapsed.has(id)
  const toggle = (id: SectionId) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div data-testid="view-ai-performances" className="h-full overflow-y-auto">
      {/* Sticky page header: title + section tabs, frosted so content scrolls
          softly beneath it (matching the CX Journey sibling). */}
      <div className="sticky top-0 z-10 flex items-center gap-6 rounded-t-[26px] bg-white/80 px-8 pb-4 pt-6 backdrop-blur-md">
        <h1 className="pb-3 text-[20px] font-semibold text-ink">AI Performance</h1>
        <span className="mb-3 h-5 w-px bg-surface-border" />
        {PAGE_TABS.map((t) => {
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

      <div className="flex flex-col gap-10 px-8 pb-12">
        {tab === 'Overview' ? (
          <>
            {/* Overview: conversation flow + metric grid */}
            <section className="flex flex-col gap-5">
              <SectionHeader
                title="Overview"
                collapsed={isCollapsed('overview')}
                onToggle={() => toggle('overview')}
                filters={
                  <div className="ml-4 flex items-center gap-2">
                    <DatePill />
                    <FilterPill icon={<SlidersHorizontal className="h-3.5 w-3.5 text-ink-muted" />} label="All filters" />
                    <label className="flex items-center gap-1.5 text-[13px] text-ink">
                      <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#01567A]">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                      Channel breakdown
                    </label>
                  </div>
                }
              />
              {!isCollapsed('overview') && (
                <>
                  <FlowSankey />
                  <StatCards />
                </>
              )}
            </section>

            {/* Performance insights */}
            <section className="flex flex-col gap-5">
              <SectionHeader
                title="Performance insights (AI)"
                collapsed={isCollapsed('performance')}
                onToggle={() => toggle('performance')}
                filters={
                  <div className="ml-4 flex items-center gap-2">
                    <DatePill />
                    <FilterPill label="All AI handled conversations" />
                  </div>
                }
              />
              {!isCollapsed('performance') && <PerformanceInsights />}
            </section>

            {/* Custom insights */}
            <section className="flex flex-col gap-5">
              <SectionHeader
                title="Custom insights"
                collapsed={isCollapsed('custom')}
                onToggle={() => toggle('custom')}
                filters={
                  <div className="ml-4">
                    <DatePill />
                  </div>
                }
                action={
                  <button
                    type="button"
                    className="rounded-full bg-nav-active px-4 py-1.5 text-[13px] font-medium text-white"
                  >
                    Create
                  </button>
                }
              />
              {!isCollapsed('custom') && <CustomInsights />}
            </section>

            {/* Conversation comparison */}
            <section className="flex flex-col gap-5">
              <SectionHeader
                title="Conversation comparison"
                collapsed={isCollapsed('comparison')}
                onToggle={() => toggle('comparison')}
                filters={
                  <div className="ml-4">
                    <DatePill />
                  </div>
                }
              />
              {!isCollapsed('comparison') && <ConversationComparison />}
            </section>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center text-[14px] text-ink-muted">Coming soon</div>
        )}
      </div>
    </div>
  )
}
