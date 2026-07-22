// CX Journey → Topics tab root. Composes the four zones: the header label, the
// collapsible top-movers panel, the stat-card grid, and the nested topics
// table. Rendered by CxJourneyView when the Topics tab is active.
import { TopMoversPanel } from './TopMoversPanel'
import { TopicStatCards } from './TopicStatCards'
import { TopicsTable } from './TopicsTable'

export function TopicsView() {
  return (
    <div data-testid="view-cx-topics" className="flex flex-col gap-6">
      <p className="text-[14px] text-ink">All topics (Human only)</p>
      <TopMoversPanel />
      <TopicStatCards />
      <TopicsTable />
    </div>
  )
}
