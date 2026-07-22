// Hover card for the Topics treemap. Presentational: given one topic's metrics,
// renders the swatch/name header and a labelled metric list, matching the
// CX Journey_01 tooltip. Positioning is handled by the parent (TopicTreemap).
import { Frown, Meh, Smile, type LucideIcon } from 'lucide-react'
import { sentimentBand } from './topics-data'

export type TreemapTooltipData = {
  name: string
  color: string
  volume: string
  volumePct: string
  firstContactResolution: string
  avgFirstResTime: string
  avgFullResTime: string
  sentiment: number
  agentReplyTime: string
  agentReplies: string
}

const BAND_FACE: Record<string, LucideIcon> = { good: Smile, ok: Meh, bad: Frown }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 text-[13px]">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{children}</span>
    </div>
  )
}

export function TreemapTooltip({ data }: { data: TreemapTooltipData }) {
  const band = sentimentBand(data.sentiment)
  const Face = BAND_FACE[band.label]
  return (
    <div className="pointer-events-none w-[273px] rounded-xl border border-surface-border bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: data.color }} />
        <span className="text-[13px] font-semibold text-ink">{data.name}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Row label="Volume">
          {data.volume} <span className="font-normal text-ink-muted">({data.volumePct})</span>
        </Row>
        <Row label="First contact resolution">{data.firstContactResolution}</Row>
        <Row label="Avg. first resolution time">{data.avgFirstResTime}</Row>
        <Row label="Avg. full resolution time">{data.avgFullResTime}</Row>
        <Row label="Sentiment">
          <span className="flex items-center gap-1.5">
            {data.sentiment}%
            <Face className="h-4 w-4" style={{ color: band.color }} />
          </span>
        </Row>
        <Row label="Agent reply time">{data.agentReplyTime}</Row>
        <Row label="Agent replies">{data.agentReplies}</Row>
      </div>
    </div>
  )
}
