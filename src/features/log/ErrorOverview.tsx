// Error tab overview: four equal bordered cards. Card 1 is "New errors" (info
// glyph); cards 2-4 are labeled by a severity badge. Values are "n/a" per the
// design — no fabricated metrics.
import { Info } from 'lucide-react'
import { SeverityBadge } from './SeverityBadge'
import type { Severity } from './log-data'

const SEVERITIES: Severity[] = ['High', 'Medium', 'Low']

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6 rounded-[16px] border border-surface-border px-5 py-4">
      {children}
      <span className="text-[40px] leading-none text-grey-400">n/a</span>
    </div>
  )
}

export function ErrorOverview() {
  return (
    <div className="flex items-stretch gap-4">
      <Card>
        <span className="flex items-center gap-1.5 text-[14px] text-grey-700">
          New errors
          <Info size={14} className="text-ink-muted" aria-hidden />
        </span>
      </Card>
      {SEVERITIES.map((s) => (
        <Card key={s}>
          <span><SeverityBadge severity={s} /></span>
        </Card>
      ))}
    </div>
  )
}
