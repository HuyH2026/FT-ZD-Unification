// The "Resolutions time series chart" card: a tab strip (Conversations /
// Resolutions / Sentiment / CSAT / Duration / AI QA — only "Resolutions" is
// wired), chart-type toggle (inert), a weekly-range filter (inert), and a
// 3-line trend chart. Presentational.
import { useState } from 'react'
import { BarChart3, ChevronDown, Filter, LineChart as LineChartIcon } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { BAR_COLORS, RESOLUTIONS_TABS, type ResolutionsPoint } from './results-data'

export function ResolutionsTimeSeriesCard({ series }: { series: ResolutionsPoint[] }) {
  const [tab, setTab] = useState<(typeof RESOLUTIONS_TABS)[number]>('Resolutions')

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4">
      <div className="flex items-center gap-3">
        <p className="flex-1 text-[13px] font-semibold text-ink">Resolutions time series chart</p>

        <div role="tablist" className="flex items-center rounded-full bg-[#fbfbfb] p-0.5">
          {RESOLUTIONS_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={t === tab}
              onClick={() => setTab(t)}
              className={
                'rounded-full px-3.5 py-1.5 text-[11px] ' +
                (t === tab ? 'bg-white font-medium text-ink shadow-sm' : 'text-ink-muted')
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 rounded-full bg-[#fbfbfb] p-0.5">
          <span className="flex size-6 items-center justify-center rounded-full">
            <BarChart3 size={14} className="text-ink-muted" aria-hidden />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-white shadow-sm">
            <LineChartIcon size={14} className="text-ink" aria-hidden />
          </span>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-[12px] text-ink"
        >
          <Filter size={14} aria-hidden />
          Weekly
          <ChevronDown size={14} className="text-ink-muted" aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-ink">
        {(['Control', 'Variant A', 'Variant B'] as const).map((name) => (
          <span key={name} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: BAR_COLORS[name] }} />
            {name}
          </span>
        ))}
      </div>

      <div className="mt-2 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#ececef" />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#727583' }} />
            <YAxis
              width={40}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#545767' }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Line type="monotone" dataKey="Control" stroke={BAR_COLORS.Control} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Variant A" stroke={BAR_COLORS['Variant A']} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Variant B" stroke={BAR_COLORS['Variant B']} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
