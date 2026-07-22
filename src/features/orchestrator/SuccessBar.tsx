// A two-segment horizontal bar showing an automation's run success rate: a green
// segment sized to the rate, a red remainder, and end labels. Renders muted
// "n/a" when the automation has no rate. Presentational.
const GREEN = '#0f8a5f'
const RED = '#e5484d'

export function SuccessBar({ rate }: { rate: number | null }) {
  if (rate === null) {
    return <span className="text-[13px] text-ink-muted">n/a</span>
  }
  const remainder = 100 - rate
  return (
    <div className="w-[120px]">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        <div style={{ width: `${rate}%`, backgroundColor: GREEN }} />
        <div style={{ width: `${remainder}%`, backgroundColor: RED }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
        <span>{rate}%</span>
        <span>{remainder}%</span>
      </div>
    </div>
  )
}
