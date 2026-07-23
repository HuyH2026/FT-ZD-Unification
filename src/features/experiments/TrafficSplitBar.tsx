// A stacked horizontal bar showing an experiment's traffic split, with a %
// label beneath each segment. Segment colors cycle through the chart palette.
// Presentational.
const SEGMENT_COLORS = ['#01567a', '#e05c34', '#2f69c7']

export function TrafficSplitBar({ splits }: { splits: number[] }) {
  return (
    <div className="w-[104px]">
      <div className="flex h-3.5 w-full overflow-hidden rounded-[4px]">
        {splits.map((pct, i) => (
          <div
            key={i}
            style={{ width: `${pct}%`, backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        {splits.map((pct, i) => (
          <span key={i}>{pct}%</span>
        ))}
      </div>
    </div>
  )
}
