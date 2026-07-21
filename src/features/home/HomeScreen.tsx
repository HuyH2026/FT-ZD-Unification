import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, BadgeCheck, Bell, BookOpen, Check, ChevronRight,
  CircleAlert, Clock, CreditCard, FlaskConical, GripVertical, LayoutGrid,
  ListChecks, Pencil, Plus, Sparkles, TrendingDown, TrendingUp, X,
} from 'lucide-react'
import { Area, AreaChart } from 'recharts'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  type Level, type LevelData, type WidgetId, type ColumnKey, type Layout,
  DATA, DEFAULT_LAYOUT,
} from './dashboard-data'

// Palette — one-off dashboard hues that have no design token yet (kept inline,
// matching the prototype). Ink/muted map to the shared token values.
const INK = '#2f3130'
const INK_SOFT = '#2f3941'
const MUTED = '#8b8e89'
const BORDER = '#e2e0dd'
const BLUE = '#1f73b7'
const GREEN = '#0f8a5f'
const AMBER = '#c8792b'
const RED = '#c8402f'
const PURPLE = '#724be8'

// --- Sparkline --------------------------------------------------------------
// Measures its own container and only renders once it has real dimensions, so
// recharts never warns about a zero-size render (e.g. inside a drag preview).
function Sparkline({ data, color, gradientId }: { data: { v: number }[]; color: string; gradientId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="h-full w-full">
      {size.width > 0 && size.height > 0 && (
        <AreaChart width={size.width} height={size.height} data={data} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
        </AreaChart>
      )}
    </div>
  )
}

// --- Building blocks --------------------------------------------------------
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-solid bg-white p-5 ${className}`} style={{ borderColor: BORDER }}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[15px] font-semibold tracking-[-0.154px]" style={{ color: INK }}>{title}</p>
      </div>
      {action}
    </div>
  )
}

function LinkButton({ label }: { label: string }) {
  return (
    <button className="group flex items-center gap-0.5 outline-none">
      <span className="text-[13px] font-semibold" style={{ color: BLUE }}>{label}</span>
      <ChevronRight size={14} color={BLUE} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

// --- Cards ------------------------------------------------------------------
function AgentHealthCard({ data, level }: { data: LevelData; level: Level }) {
  const chart = useMemo(() => data.trend.map((v, i) => ({ i, v })), [data.trend])
  return (
    <Card>
      <CardHeader icon={<Activity size={18} color={INK} strokeWidth={2} />} title="Overall agent health" action={<LinkButton label="Open Insights" />} />
      <div className="flex items-stretch gap-6">
        <div className="flex w-[168px] shrink-0 flex-col justify-center">
          <div className="flex items-end gap-1.5">
            <span className="text-[44px] font-medium leading-[44px]" style={{ color: INK }}>{data.score}</span>
            <span className="mb-1.5 text-[16px] font-normal" style={{ color: MUTED }}>/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="flex h-[22px] items-center gap-1 rounded-full px-2" style={{ backgroundColor: `${GREEN}18` }}>
              <BadgeCheck size={13} color={GREEN} />
              <span className="text-[12px] font-semibold" style={{ color: GREEN }}>{data.scoreLabel}</span>
            </span>
          </div>
          <p className="mt-3 text-[12px] font-normal leading-4" style={{ color: MUTED }}>
            {level === 'platform' ? 'Across 2 organizations and 6 channels.' : 'Across 4 active channels.'}
          </p>
          <div className="mt-3 -mx-0.5 h-[44px]">
            <Sparkline data={chart} color={GREEN} gradientId="healthFill" />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          {data.metrics.map((m) => (
            <div key={m.key} className="rounded-xl border border-solid p-3.5" style={{ borderColor: BORDER, backgroundColor: '#faf9f8' }}>
              <p className="text-[12px] font-normal" style={{ color: MUTED }}>{m.label}</p>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-[22px] font-medium" style={{ color: INK }}>{m.value}</span>
                <span className="flex items-center gap-0.5" style={{ color: m.good ? GREEN : RED }}>
                  {m.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span className="text-[12px] font-semibold">{m.delta}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

const NOTIF_META = {
  studio: { Icon: Sparkles, color: PURPLE },
  billing: { Icon: CreditCard, color: BLUE },
  error: { Icon: CircleAlert, color: RED },
} as const

function NotificationsCard({ data }: { data: LevelData }) {
  return (
    <Card>
      <CardHeader icon={<Bell size={18} color={INK} strokeWidth={2} />} title="Notifications" action={<LinkButton label="View all" />} />
      <div className="flex flex-col gap-2.5">
        {data.notifications.map((n) => {
          const meta = NOTIF_META[n.kind]
          return (
            <div key={n.id} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${meta.color}16` }}>
                <meta.Icon size={16} color={meta.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold" style={{ color: INK }}>{n.title}</p>
                  <span className="shrink-0 text-[11px] font-normal" style={{ color: MUTED }}>{n.time}</span>
                </div>
                <p className="mt-0.5 text-[12px] font-normal leading-4" style={{ color: MUTED }}>{n.body}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ApprovalsCard({ data }: { data: LevelData }) {
  return (
    <Card>
      <CardHeader
        icon={<Sparkles size={18} color={PURPLE} strokeWidth={2} />}
        title="Needs your approval"
        action={
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5" style={{ backgroundColor: `${PURPLE}18` }}>
            <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>{data.approvals.length}</span>
          </span>
        }
      />
      <div className="flex flex-col gap-3">
        {data.approvals.map((a) => (
          <div key={a.id} className="rounded-xl border border-solid p-3.5" style={{ borderColor: `${PURPLE}33`, backgroundColor: `${PURPLE}0a` }}>
            <p className="text-[13px] font-semibold" style={{ color: INK }}>{a.title}</p>
            <p className="mt-1 text-[12px] font-normal leading-[17px]" style={{ color: INK_SOFT }}>{a.body}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="flex h-5 items-center gap-1 rounded-full px-2" style={{ backgroundColor: `${GREEN}18` }}>
                <TrendingUp size={12} color={GREEN} />
                <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{a.impact}</span>
              </span>
              <span className="text-[11px] font-normal" style={{ color: MUTED }}>by {a.author}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-full outline-none" style={{ backgroundColor: INK }}>
                <Check size={14} color="#fff" />
                <span className="text-[13px] font-semibold text-white">Approve</span>
              </button>
              <button className="flex h-[34px] items-center justify-center rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }}>
                <span className="text-[13px] font-semibold" style={{ color: INK }}>Review</span>
              </button>
              <button className="flex size-[34px] items-center justify-center rounded-full border border-solid bg-white outline-none" style={{ borderColor: BORDER }} title="Dismiss">
                <X size={14} color={MUTED} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function KnowledgeGapsCard({ data }: { data: LevelData }) {
  return (
    <Card>
      <CardHeader icon={<BookOpen size={18} color={INK} strokeWidth={2} />} title="Knowledge gaps" action={<LinkButton label="Open Knowledge" />} />
      <div className="flex flex-col">
        {data.gaps.map((g, idx) => (
          <div key={g.id} className="flex items-center justify-between py-2.5" style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BORDER}` }}>
            <div className="flex min-w-0 items-center gap-2.5">
              <AlertTriangle size={15} color={AMBER} className="shrink-0" />
              <p className="truncate text-[13px] font-normal" style={{ color: INK }}>{g.topic}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[13px] font-semibold" style={{ color: INK }}>{g.misses}</span>
              <span className="text-[11px] font-normal" style={{ color: MUTED }}>misses</span>
              {g.trend === 'up' ? <TrendingUp size={13} color={RED} /> : <TrendingDown size={13} color={GREEN} />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function QaCoverageCard({ data }: { data: LevelData }) {
  const totalPass = data.qa.reduce((s, q) => s + q.pass, 0)
  const totalFail = data.qa.reduce((s, q) => s + q.fail, 0)
  const rate = Math.round((totalPass / (totalPass + totalFail)) * 100)
  return (
    <Card>
      <CardHeader
        icon={<FlaskConical size={18} color={INK} strokeWidth={2} />}
        title="QA coverage"
        action={
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-medium" style={{ color: GREEN }}>{rate}%</span>
            <span className="text-[12px] font-normal" style={{ color: MUTED }}>pass rate</span>
          </div>
        }
      />
      <div className="flex flex-col gap-3.5">
        {data.qa.map((q) => {
          const total = q.pass + q.fail
          const passPct = (q.pass / total) * 100
          return (
            <div key={q.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[13px] font-normal" style={{ color: INK }}>{q.suite}</p>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-0.5">
                    <Check size={12} color={GREEN} />
                    <span className="text-[12px] font-semibold" style={{ color: GREEN }}>{q.pass}</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <X size={12} color={RED} />
                    <span className="text-[12px] font-semibold" style={{ color: RED }}>{q.fail}</span>
                  </span>
                </div>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full" style={{ backgroundColor: `${RED}22` }}>
                <div className="h-full rounded-full" style={{ width: `${passPct}%`, backgroundColor: GREEN }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function CostCard({ data }: { data: LevelData }) {
  const pct = Math.round((data.cost.spend / data.cost.limit) * 100)
  const fmt = (n: number) => `${data.cost.unit}${n.toLocaleString()}`
  return (
    <Card>
      <CardHeader icon={<CreditCard size={18} color={INK} strokeWidth={2} />} title="Cost & usage" action={<LinkButton label="Billing" />} />
      <div className="flex items-end gap-1.5">
        <span className="text-[30px] font-medium" style={{ color: INK }}>{fmt(data.cost.spend)}</span>
        <span className="mb-1.5 text-[13px] font-normal" style={{ color: MUTED }}>of {fmt(data.cost.limit)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: `${BLUE}1f` }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BLUE }} />
      </div>
      <p className="mt-2.5 text-[12px] font-normal" style={{ color: MUTED }}>{data.cost.note}</p>
    </Card>
  )
}

function ActivityCard({ data }: { data: LevelData }) {
  return (
    <Card>
      <CardHeader icon={<Clock size={18} color={INK} strokeWidth={2} />} title="Recent activity" action={<LinkButton label="Open Log" />} />
      <div className="flex flex-col">
        {data.activity.map((a, idx) => (
          <div key={a.id} className="flex items-start gap-2.5 py-2.5" style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BORDER}` }}>
            <div className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: BLUE }} />
            <p className="flex-1 text-[13px] font-normal" style={{ color: INK }}>{a.text}</p>
            <span className="shrink-0 text-[11px] font-normal" style={{ color: MUTED }}>{a.time}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

const INTENT_COLORS = [BLUE, PURPLE, GREEN, AMBER]

function IntentsCard({ data }: { data: LevelData }) {
  return (
    <Card>
      <CardHeader icon={<ListChecks size={18} color={INK} strokeWidth={2} />} title="Top intents" action={<LinkButton label="Insights" />} />
      <div className="flex flex-col gap-3">
        {data.intents.map((it, idx) => (
          <div key={it.id}>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[13px] font-normal" style={{ color: INK }}>{it.name}</p>
              <span className="text-[12px] font-semibold" style={{ color: INK }}>{it.share}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#efeeec' }}>
              <div className="h-full rounded-full" style={{ width: `${it.share}%`, backgroundColor: INTENT_COLORS[idx % INTENT_COLORS.length] }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ImprovedPoliciesCard({ data }: { data: LevelData }) {
  const { summary, items } = data.policies
  return (
    <Card>
      <CardHeader icon={<Sparkles size={18} color={PURPLE} strokeWidth={2} />} title="Improved policies" action={<LinkButton label="View history" />} />
      <div className="mb-4 flex items-end gap-2.5">
        <span className="text-[30px] font-medium leading-[30px]" style={{ color: INK }}>{summary.improved}</span>
        <div className="mb-px flex flex-col">
          <span className="flex h-5 items-center gap-1 self-start rounded-full px-2" style={{ backgroundColor: `${GREEN}18` }}>
            <TrendingUp size={12} color={GREEN} />
            <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{summary.lift}</span>
          </span>
          <span className="mt-0.5 text-[11px] font-normal" style={{ color: MUTED }}>policies improved · {summary.period}</span>
        </div>
      </div>
      <div className="flex flex-col">
        {items.map((p, idx) => {
          const applied = p.status === 'applied'
          const statusColor = applied ? GREEN : PURPLE
          return (
            <div key={p.id} className="flex gap-3 py-3" style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BORDER}` }}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${PURPLE}16` }}>
                <Sparkles size={16} color={PURPLE} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold" style={{ color: INK }}>{p.title}</p>
                  <span className="flex h-[18px] shrink-0 items-center gap-0.5 rounded-full px-1.5" style={{ backgroundColor: `${statusColor}18` }}>
                    {applied ? <Check size={10} color={statusColor} /> : <Clock size={10} color={statusColor} />}
                    <span className="text-[10px] font-semibold" style={{ color: statusColor }}>{applied ? 'Applied' : 'Proposed'}</span>
                  </span>
                </div>
                <p className="mt-1 text-[12px] font-normal leading-4" style={{ color: INK_SOFT }}>{p.change}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex h-[18px] items-center gap-1 rounded-full px-1.5" style={{ backgroundColor: `${GREEN}14` }}>
                    <TrendingUp size={11} color={GREEN} />
                    <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{p.impact}</span>
                  </span>
                  <span className="text-[11px] font-normal" style={{ color: MUTED }}>{p.scope} · {p.time}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// --- Widget registry --------------------------------------------------------
const WIDGETS: Record<WidgetId, { title: string; render: (data: LevelData, level: Level) => React.ReactNode }> = {
  health: { title: 'Overall agent health', render: (d, l) => <AgentHealthCard data={d} level={l} /> },
  qa: { title: 'QA coverage', render: (d) => <QaCoverageCard data={d} /> },
  gaps: { title: 'Knowledge gaps', render: (d) => <KnowledgeGapsCard data={d} /> },
  approvals: { title: 'Needs your approval', render: (d) => <ApprovalsCard data={d} /> },
  notifications: { title: 'Notifications', render: (d) => <NotificationsCard data={d} /> },
  cost: { title: 'Cost & usage', render: (d) => <CostCard data={d} /> },
  activity: { title: 'Recent activity', render: (d) => <ActivityCard data={d} /> },
  intents: { title: 'Top intents', render: (d) => <IntentsCard data={d} /> },
  policies: { title: 'Improved policies', render: (d) => <ImprovedPoliciesCard data={d} /> },
}

const STORAGE_KEY = 'home-dashboard-layout-v2'

function loadLayout(): Layout {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LAYOUT
    const parsed = JSON.parse(raw) as Layout
    const valid = (arr: unknown): arr is WidgetId[] =>
      Array.isArray(arr) && arr.every((x) => typeof x === 'string' && x in WIDGETS)
    if (valid(parsed.left) && valid(parsed.right)) return parsed
  } catch {
    /* ignore missing/malformed storage */
  }
  return DEFAULT_LAYOUT
}

// --- Drag & drop wrapper ----------------------------------------------------
const DND_TYPE = 'dashboard-widget'
type DragItem = { id: WidgetId; column: ColumnKey; index: number }

function DraggableWidget({
  id, column, index, editing, onMove, onRemove, children,
}: {
  id: WidgetId; column: ColumnKey; index: number; editing: boolean
  onMove: (from: DragItem, toColumn: ColumnKey, toIndex: number) => void
  onRemove: (column: ColumnKey, index: number) => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [{ isDragging }, drag, preview] = useDrag({
    type: DND_TYPE,
    canDrag: editing,
    item: (): DragItem => ({ id, column, index }),
    collect: (m) => ({ isDragging: m.isDragging() }),
  })
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: DND_TYPE,
    collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
    hover: (item, monitor) => {
      if (!ref.current) return
      if (item.column === column && item.index === index) return
      const rect = ref.current.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const pointer = monitor.getClientOffset()
      if (!pointer) return
      let toIndex = pointer.y < midY ? index : index + 1
      if (item.column === column && item.index < toIndex) toIndex -= 1
      onMove(item, column, toIndex)
      item.column = column
      item.index = toIndex
    },
  })
  drop(preview(ref))

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }} className="relative">
      {editing && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl border-2 border-dashed transition-colors" style={{ borderColor: isOver ? BLUE : 'transparent' }} />
      )}
      {editing && (
        <div className="absolute -top-2.5 left-3 right-3 z-30 flex items-center justify-between">
          <div ref={drag as unknown as React.Ref<HTMLDivElement>} className="flex h-6 cursor-grab items-center gap-1 rounded-full border border-solid bg-white px-2 shadow-sm active:cursor-grabbing" style={{ borderColor: BORDER }}>
            <GripVertical size={13} color={MUTED} />
            <span className="text-[11px] font-semibold" style={{ color: MUTED }}>Drag</span>
          </div>
          <button onClick={() => onRemove(column, index)} className="flex size-6 items-center justify-center rounded-full border border-solid bg-white shadow-sm outline-none" style={{ borderColor: BORDER }} title="Remove widget">
            <X size={13} color={RED} />
          </button>
        </div>
      )}
      <div className={editing ? 'pointer-events-none select-none' : ''}>{children}</div>
    </div>
  )
}

function ColumnDropZone({ column, count, onMove }: { column: ColumnKey; count: number; onMove: (from: DragItem, toColumn: ColumnKey, toIndex: number) => void }) {
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: DND_TYPE,
    collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
    drop: (item) => onMove(item, column, count),
  })
  return (
    <div ref={drop as unknown as React.Ref<HTMLDivElement>} className="flex h-[72px] items-center justify-center rounded-2xl border-2 border-dashed transition-colors" style={{ borderColor: isOver ? BLUE : BORDER, backgroundColor: isOver ? `${BLUE}0a` : 'transparent' }}>
      <span className="text-[13px] font-normal" style={{ color: MUTED }}>Drop widgets here</span>
    </div>
  )
}

function AddWidgetMenu({ available, onAdd }: { available: WidgetId[]; onAdd: (id: WidgetId) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={available.length === 0} className="flex h-9 items-center gap-1.5 rounded-full px-3.5 outline-none disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: INK }}>
        <Plus size={15} color="#fff" />
        <span className="text-[13px] font-semibold text-white">Add widget</span>
      </button>
      {open && available.length > 0 && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[42px] z-[61] w-60 rounded-xl border border-solid bg-white py-1.5 shadow-[0px_16px_24px_0px_rgba(10,13,14,0.16)]" style={{ borderColor: BORDER }}>
            {available.map((id) => (
              <button key={id} onClick={() => { onAdd(id); setOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left outline-none hover:bg-[#f5f5f4]">
                <LayoutGrid size={14} color={MUTED} />
                <span className="text-[13px] font-normal" style={{ color: INK }}>{WIDGETS[id].title}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LevelToggle({ level, onChange }: { level: Level; onChange: (l: Level) => void }) {
  const opts: { key: Level; label: string }[] = [
    { key: 'platform', label: 'Platform' },
    { key: 'organization', label: 'Organization' },
  ]
  return (
    <div className="flex items-center rounded-full border border-solid bg-white p-[3px]" style={{ borderColor: BORDER }}>
      {opts.map((o) => {
        const active = level === o.key
        return (
          <button key={o.key} onClick={() => onChange(o.key)} className="h-[30px] rounded-full px-4 outline-none transition-colors" style={{ backgroundColor: active ? INK : 'transparent' }}>
            <span className="text-[13px] font-semibold" style={{ color: active ? '#fff' : MUTED }}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// --- Root -------------------------------------------------------------------
export function HomeScreen() {
  const [level, setLevel] = useState<Level>('platform')
  const [editing, setEditing] = useState(false)
  const [layout, setLayout] = useState<Layout>(() => loadLayout())
  const data = DATA[level]

  useEffect(() => {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch {
      /* ignore */
    }
  }, [layout])

  const used = [...layout.left, ...layout.right]
  const available = (Object.keys(WIDGETS) as WidgetId[]).filter((id) => !used.includes(id))

  const moveWidget = (from: DragItem, toColumn: ColumnKey, toIndex: number) => {
    setLayout((prev) => {
      const next: Layout = { left: [...prev.left], right: [...prev.right] }
      const srcArr = next[from.column]
      const realIdx = srcArr.indexOf(from.id)
      if (realIdx === -1) return prev
      srcArr.splice(realIdx, 1)
      const destArr = next[toColumn]
      const clamped = Math.max(0, Math.min(toIndex, destArr.length))
      destArr.splice(clamped, 0, from.id)
      return next
    })
  }

  const removeWidget = (column: ColumnKey, index: number) => {
    setLayout((prev) => {
      const next: Layout = { left: [...prev.left], right: [...prev.right] }
      next[column].splice(index, 1)
      return next
    })
  }

  const addWidget = (id: WidgetId) => {
    setLayout((prev) => {
      const target: ColumnKey = prev.left.length <= prev.right.length ? 'left' : 'right'
      return { ...prev, [target]: [...prev[target], id] }
    })
  }

  const resetLayout = () => setLayout(DEFAULT_LAYOUT)

  const renderColumn = (column: ColumnKey) => (
    <div className="flex flex-col gap-4">
      {layout[column].map((id, index) => (
        <DraggableWidget key={id} id={id} column={column} index={index} editing={editing} onMove={moveWidget} onRemove={removeWidget}>
          {WIDGETS[id].render(data, level)}
        </DraggableWidget>
      ))}
      {editing && <ColumnDropZone column={column} count={layout[column].length} onMove={moveWidget} />}
    </div>
  )

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-testid="screen-home" className="h-full overflow-y-auto rounded-[26px] bg-white">
        <div className="min-w-[900px] px-10 pt-8 pb-10">
          {/* Greeting header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-[26px] font-normal leading-8 tracking-[0.35px]" style={{ color: INK_SOFT }}>
                {editing ? 'Customize your dashboard' : 'Good morning, Alex'}
              </p>
              <p className="mt-1 text-[14px] font-normal tracking-[-0.154px]" style={{ color: MUTED }}>
                {editing ? 'Drag widgets to reorder, remove them, or add new ones.' : "Here's what your agents need from you today."}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {editing ? (
                <>
                  <AddWidgetMenu available={available} onAdd={addWidget} />
                  <button onClick={resetLayout} className="flex h-9 items-center rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }}>
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Reset</span>
                  </button>
                  <button onClick={() => setEditing(false)} className="flex h-9 items-center gap-1.5 rounded-full px-4 outline-none" style={{ backgroundColor: INK }}>
                    <Check size={15} color="#fff" />
                    <span className="text-[13px] font-semibold text-white">Done</span>
                  </button>
                </>
              ) : (
                <>
                  <LevelToggle level={level} onChange={setLevel} />
                  <button onClick={() => setEditing(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Customize dashboard">
                    <Pencil size={14} color={INK} />
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Customize</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Two-column customizable grid */}
          <div className="grid grid-cols-[1fr_360px] items-start gap-4">
            {renderColumn('left')}
            {renderColumn('right')}
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
