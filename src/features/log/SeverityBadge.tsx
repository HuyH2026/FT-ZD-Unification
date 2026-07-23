// Colored rounded-rect badge for an error severity. Colors have no exact theme
// token — inline per the CLAUDE.md one-off convention. High = red, Medium =
// amber (dark text), Low = blue.
import type { Severity } from './log-data'

const STYLES: Record<Severity, { bg: string; fg: string }> = {
  High: { bg: '#d64535', fg: '#ffffff' },
  Medium: { bg: '#e8a33d', fg: '#3d2b00' },
  Low: { bg: '#3492ef', fg: '#ffffff' },
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { bg, fg } = STYLES[severity]
  return (
    <span
      className="inline-flex rounded-[6px] px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {severity}
    </span>
  )
}
