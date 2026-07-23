// One metric card in the Results grid: title + "Statistically Significant"/
// "Not Significant" badge, a 3-bar (Control / Variant A / Variant B) chart
// with a floating value+delta pill above each bar. Presentational.
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts'
import { BAR_COLORS, NEGATIVE_COLOR, POSITIVE_COLOR, type MetricCard } from './results-data'

function ValuePill({
  x,
  y,
  width,
  index,
  items,
}: {
  x?: string | number
  y?: string | number
  width?: string | number
  index?: number
  items: MetricCard['items']
}) {
  if (x === undefined || y === undefined || width === undefined || index === undefined) return null
  const item = items[index]
  const cx = Number(x) + Number(width) / 2
  return (
    <foreignObject x={cx - 30} y={Number(y) - (item.delta ? 40 : 26)} width={60} height={item.delta ? 40 : 26}>
      <div className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-[#d7cece] bg-white px-1.5 py-1 text-[10px] leading-none">
        <span className="text-ink">{item.display}</span>
        {item.delta && <span style={{ color: item.positive ? POSITIVE_COLOR : NEGATIVE_COLOR }}>{item.delta}</span>}
      </div>
    </foreignObject>
  )
}

export function MetricBarCard({ card }: { card: MetricCard }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <p className="text-[13px] font-semibold text-ink">{card.title}</p>
        <span
          className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold"
          style={
            card.significant
              ? { backgroundColor: '#e8f6f1', color: '#1f866a' }
              : { backgroundColor: '#f2f4f7', color: '#545767' }
          }
        >
          {card.significant ? 'Statistically Significant' : 'Not Significant'}
        </span>
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={card.items} margin={{ top: 40, right: 4, bottom: 0, left: 4 }} barSize={27}>
            <CartesianGrid vertical={false} stroke="#ececef" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#000' }} />
            <YAxis
              width={28}
              domain={[0, card.domainMax]}
              ticks={card.ticks}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: '#545767' }}
              tickFormatter={(v: number) =>
                card.tickSuffix === 'k' ? (v === 0 ? '0' : `${v / 1000}k`) : `${v}${card.tickSuffix ?? ''}`
              }
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {card.items.map((item) => (
                <Cell key={item.name} fill={BAR_COLORS[item.name]} />
              ))}
              <LabelList dataKey="value" content={(props) => <ValuePill {...props} items={card.items} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-center gap-4 text-[10px] text-ink">
        {card.items.map((item) => (
          <span key={item.name} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: BAR_COLORS[item.name] }} />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  )
}
