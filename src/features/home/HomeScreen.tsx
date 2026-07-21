import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, BadgeCheck, Bell, BookOpen, Check, ChevronDown, ChevronRight,
  CircleAlert, Clock, Code, CreditCard, FileText, FlaskConical, GripVertical, LayoutGrid,
  ListChecks, Mail, MessageSquare, Pencil, Phone, Plus, Sparkles, TrendingDown, TrendingUp, X, Zap,
  type LucideIcon,
} from 'lucide-react'
import { Area, AreaChart } from 'recharts'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  type LevelData, type HealthState, type ChannelResolution,
  type WidgetId, type ColumnKey, type Layout,
  DATA, DEFAULT_LAYOUT,
} from './dashboard-data'
import { GenerateHomePanel } from './GenerateHomePanel'

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
const HEALTH_STATE_META: Record<HealthState, { label: string; color: string; Icon: LucideIcon }> = {
  good: { label: 'Good', color: GREEN, Icon: BadgeCheck },
  attention: { label: 'Attention needed', color: AMBER, Icon: AlertTriangle },
  critical: { label: 'Critical', color: RED, Icon: CircleAlert },
}

// Icon per channel family, keyed to ChannelResolution.key.
const CHANNEL_FAMILY_ICON: Record<ChannelResolution['key'], LucideIcon> = {
  messaging: MessageSquare,
  email: Mail,
  voice: Phone,
  headless: Code,
}

// Expandable per-channel resolution breakdown (Messaging / Email / Voice /
// Headless), revealed from the Resolution rate tile.
function ResolutionBreakdown({ channels }: { channels: ChannelResolution[] }) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-solid p-3.5" style={{ borderColor: BORDER, backgroundColor: '#faf9f8' }}>
      <p className="text-[12px] font-semibold" style={{ color: INK }}>Resolution rate by channel</p>
      {channels.map((c) => {
        const Icon = CHANNEL_FAMILY_ICON[c.key]
        return (
          <div key={c.key}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={14} color={MUTED} />
                <span className="text-[13px] font-normal" style={{ color: INK }}>{c.label}</span>
                <span className="text-[11px] font-normal" style={{ color: MUTED }}>{c.share}% of volume</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold" style={{ color: INK }}>{c.rate}%</span>
                <span className="flex items-center gap-0.5" style={{ color: c.good ? GREEN : RED }}>
                  {c.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span className="text-[11px] font-semibold">{c.delta}</span>
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#efeeec' }}>
              <div className="h-full rounded-full" style={{ width: `${c.rate}%`, backgroundColor: c.good ? GREEN : AMBER }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AgentHealthCard({ data }: { data: LevelData }) {
  const chart = useMemo(() => data.trend.map((v, i) => ({ i, v })), [data.trend])
  const state = HEALTH_STATE_META[data.healthState]
  const [showChannels, setShowChannels] = useState(false)
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
            <span className="flex h-[22px] items-center gap-1 rounded-full px-2" style={{ backgroundColor: `${state.color}18` }}>
              <state.Icon size={13} color={state.color} />
              <span className="text-[12px] font-semibold" style={{ color: state.color }}>{state.label}</span>
            </span>
          </div>
          <p className="mt-3 text-[12px] font-normal leading-4" style={{ color: MUTED }}>
            Across 2 organizations and 6 channels.
          </p>
          <div className="mt-3 -mx-0.5 h-[44px]">
            <Sparkline data={chart} color={state.color} gradientId="healthFill" />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          {data.metrics.map((m) => {
            const isResolution = m.key === 'res'
            const tileBody = (
              <>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] font-normal" style={{ color: MUTED }}>{m.label}</p>
                  {isResolution && (
                    <ChevronDown
                      size={13}
                      color={MUTED}
                      className="transition-transform"
                      style={{ transform: showChannels ? 'rotate(180deg)' : 'none' }}
                    />
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-[22px] font-medium" style={{ color: INK }}>{m.value}</span>
                  <span className="flex items-center gap-0.5" style={{ color: m.good ? GREEN : RED }}>
                    {m.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    <span className="text-[12px] font-semibold">{m.delta}</span>
                  </span>
                </div>
              </>
            )
            return isResolution ? (
              <button
                key={m.key}
                onClick={() => setShowChannels((s) => !s)}
                aria-expanded={showChannels}
                className="rounded-xl border border-solid p-3.5 text-left outline-none transition-colors hover:bg-[#f3f2f0]"
                style={{ borderColor: BORDER, backgroundColor: '#faf9f8' }}
              >
                {tileBody}
              </button>
            ) : (
              <div key={m.key} className="rounded-xl border border-solid p-3.5" style={{ borderColor: BORDER, backgroundColor: '#faf9f8' }}>
                {tileBody}
              </div>
            )
          })}
        </div>
      </div>
      {showChannels && <ResolutionBreakdown channels={data.resolutionByChannel} />}
      {/* AI short summary */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-solid p-3.5" style={{ borderColor: `${PURPLE}33`, backgroundColor: `${PURPLE}0a` }}>
        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${PURPLE}16` }}>
          <Sparkles size={13} color={PURPLE} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px]" style={{ color: PURPLE }}>AI summary</p>
          <p className="mt-0.5 text-[12px] font-normal leading-[17px]" style={{ color: INK_SOFT }}>{data.aiSummary}</p>
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
            {a.abTest && (
              <div className="mt-2.5 rounded-lg border border-solid bg-white p-2.5" style={{ borderColor: BORDER }}>
                <div className="mb-2 flex items-center gap-1.5">
                  <FlaskConical size={13} color={PURPLE} />
                  <span className="text-[11px] font-semibold" style={{ color: INK }}>{a.abTest.confidence}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {a.abTest.variants.map((v) => (
                    <div
                      key={v.key}
                      className="flex items-center justify-between rounded-md px-2 py-1.5"
                      style={{ backgroundColor: v.winner ? `${GREEN}12` : '#faf9f8' }}
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        {v.winner && (
                          <span className="flex h-[18px] shrink-0 items-center gap-0.5 rounded-full px-1.5" style={{ backgroundColor: `${GREEN}22` }}>
                            <BadgeCheck size={10} color={GREEN} />
                            <span className="text-[10px] font-semibold" style={{ color: GREEN }}>Winner</span>
                          </span>
                        )}
                        <span className="truncate text-[12px] font-normal" style={{ color: INK }}>{v.label}</span>
                      </div>
                      <span className="shrink-0 text-[12px] font-semibold" style={{ color: v.winner ? GREEN : MUTED }}>
                        {v.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="flex h-5 items-center gap-1 rounded-full px-2" style={{ backgroundColor: `${GREEN}18` }}>
                <TrendingUp size={12} color={GREEN} />
                <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{a.impact}</span>
              </span>
              {a.person ? (
                <span className="text-[11px] font-normal" style={{ color: MUTED }}>{a.person.name} · {a.person.role}</span>
              ) : (
                <span className="text-[11px] font-normal" style={{ color: MUTED }}>by {a.author}</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-full outline-none" style={{ backgroundColor: INK }}>
                <Check size={14} color="#fff" />
                <span className="text-[13px] font-semibold text-white">
                  {a.abTest ? `Publish ${a.abTest.winner}` : 'Approve'}
                </span>
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
  const { summary, items } = data.gaps
  return (
    <Card>
      <CardHeader icon={<BookOpen size={18} color={INK} strokeWidth={2} />} title="Knowledge gaps" action={<LinkButton label="Open Knowledge" />} />
      {/* Gradient hero: articles generated + potential ticket coverage */}
      <div
        className="mb-4 rounded-xl p-4"
        style={{ background: 'linear-gradient(105deg, #fbe9e0 0%, #eef0f6 48%, #e2edf0 100%)' }}
      >
        <p className="text-[12px] font-medium leading-4" style={{ color: INK_SOFT }}>
          We generated these articles by identifying gaps in your knowledge base:
        </p>
        <div className="mt-3 flex gap-8">
          <div>
            <p className="text-[30px] font-medium leading-[32px]" style={{ color: INK }}>{summary.articlesGenerated}</p>
            <p className="mt-0.5 text-[12px] font-normal" style={{ color: INK_SOFT }}>Articles generated for identified gaps</p>
          </div>
          <div>
            <p className="text-[30px] font-medium leading-[32px]" style={{ color: INK }}>{summary.potentialCoverage}</p>
            <p className="mt-0.5 text-[12px] font-normal" style={{ color: INK_SOFT }}>Potential ticket coverage</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {items.map((g, idx) => (
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
  const { suites, generated } = data.qa
  const totalPass = suites.reduce((s, q) => s + q.pass, 0)
  const totalFail = suites.reduce((s, q) => s + q.fail, 0)
  const rate = Math.round((totalPass / (totalPass + totalFail)) * 100)
  return (
    <Card>
      <CardHeader
        icon={<FlaskConical size={18} color={INK} strokeWidth={2} />}
        title="Test coverage"
        action={
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-medium" style={{ color: GREEN }}>{rate}%</span>
            <span className="text-[12px] font-normal" style={{ color: MUTED }}>pass rate</span>
          </div>
        }
      />
      <div className="flex flex-col gap-3.5">
        {suites.map((q) => {
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
      {generated.length > 0 && (
        <div className="mt-4 border-t pt-3.5" style={{ borderColor: BORDER }}>
          <div className="mb-2.5 flex items-center gap-1.5">
            <Sparkles size={13} color={PURPLE} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.4px]" style={{ color: PURPLE }}>Newly generated playlists</p>
          </div>
          <div className="flex flex-col gap-2">
            {generated.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-solid p-2.5" style={{ borderColor: `${PURPLE}33`, backgroundColor: `${PURPLE}0a` }}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${PURPLE}16` }}>
                    <ListChecks size={14} color={PURPLE} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold" style={{ color: INK }}>{g.name}</p>
                    <p className="text-[11px] font-normal" style={{ color: MUTED }}>{g.tests} tests · ready to run</p>
                  </div>
                </div>
                <button className="flex h-7 shrink-0 items-center rounded-full px-3 outline-none" style={{ backgroundColor: INK }}>
                  <span className="text-[12px] font-semibold text-white">Run</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
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

function KnowledgeContentCard({ data }: { data: LevelData }) {
  const { summary, items } = data.knowledge
  return (
    <Card>
      <CardHeader icon={<BookOpen size={18} color={INK} strokeWidth={2} />} title="New knowledge content" action={<LinkButton label="Review all" />} />
      <div className="mb-4 flex items-end gap-2.5">
        <span className="text-[30px] font-medium leading-[30px]" style={{ color: INK }}>{summary.created}</span>
        <div className="mb-px flex flex-col">
          <span className="flex h-5 items-center gap-1 self-start rounded-full px-2" style={{ backgroundColor: `${BLUE}18` }}>
            <FileText size={12} color={BLUE} />
            <span className="text-[11px] font-semibold" style={{ color: BLUE }}>{summary.coverage} covered</span>
          </span>
          <span className="mt-0.5 text-[11px] font-normal" style={{ color: MUTED }}>snippets created · {summary.period}</span>
        </div>
      </div>
      <div className="flex flex-col">
        {items.map((c, idx) => {
          const published = c.status === 'published'
          const statusColor = published ? GREEN : AMBER
          return (
            <div key={c.id} className="flex gap-3 py-3" style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BORDER}` }}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${BLUE}14` }}>
                <FileText size={16} color={BLUE} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-[17px]" style={{ color: INK }}>{c.title}</p>
                  <span className="flex h-[18px] shrink-0 items-center gap-0.5 rounded-full px-1.5" style={{ backgroundColor: `${statusColor}18` }}>
                    {published ? <Check size={10} color={statusColor} /> : <Pencil size={9} color={statusColor} />}
                    <span className="text-[10px] font-semibold" style={{ color: statusColor }}>{published ? 'Published' : 'Draft'}</span>
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex h-[18px] max-w-[180px] items-center gap-1 rounded-md px-1.5" style={{ backgroundColor: '#f2f1ef' }}>
                    <Zap size={10} color={GREEN} fill={GREEN} />
                    <span className="truncate text-[11px] font-normal" style={{ color: INK }}>{c.topic}</span>
                  </span>
                  <span className="text-[11px] font-normal" style={{ color: MUTED }}>{c.articles} related articles</span>
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
const WIDGETS: Record<WidgetId, { title: string; render: (data: LevelData) => React.ReactNode }> = {
  health: { title: 'Overall agent health', render: (d) => <AgentHealthCard data={d} /> },
  qa: { title: 'Test coverage', render: (d) => <QaCoverageCard data={d} /> },
  gaps: { title: 'Knowledge gaps', render: (d) => <KnowledgeGapsCard data={d} /> },
  approvals: { title: 'Needs your approval', render: (d) => <ApprovalsCard data={d} /> },
  notifications: { title: 'Notifications', render: (d) => <NotificationsCard data={d} /> },
  cost: { title: 'Cost & usage', render: (d) => <CostCard data={d} /> },
  activity: { title: 'Recent activity', render: (d) => <ActivityCard data={d} /> },
  intents: { title: 'Top intents', render: (d) => <IntentsCard data={d} /> },
  policies: { title: 'Improved policies', render: (d) => <ImprovedPoliciesCard data={d} /> },
  knowledge: { title: 'New knowledge content', render: (d) => <KnowledgeContentCard data={d} /> },
}

const STORAGE_KEY = 'home-dashboard-layout-v2'

const WIDGET_IDS = new Set<string>(Object.keys(WIDGETS))

function loadLayout(): Layout {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LAYOUT
    const parsed = JSON.parse(raw) as Layout
    // Own-key membership (not the `in` operator, which matches inherited
    // prototype keys like "toString" and would let a crafted layout resolve
    // to a non-widget and crash the render).
    const valid = (arr: unknown): arr is WidgetId[] =>
      Array.isArray(arr) && arr.every((x) => typeof x === 'string' && WIDGET_IDS.has(x))
    if (valid(parsed.left) && valid(parsed.right)) {
      // Guard against duplicate ids (duplicate React keys + wrong drag target).
      const seen = new Set<WidgetId>()
      const dedupe = (arr: WidgetId[]) => arr.filter((id) => !seen.has(id) && seen.add(id))
      return { left: dedupe(parsed.left), right: dedupe(parsed.right) }
    }
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

// --- Root -------------------------------------------------------------------
export function HomeScreen() {
  // Home is always the platform-level view; the org-level toggle was removed.
  const [editing, setEditing] = useState(false)
  const [layout, setLayout] = useState<Layout>(() => loadLayout())
  const [showGenerate, setShowGenerate] = useState(false)
  const [previewLayout, setPreviewLayout] = useState<Layout | null>(null)

  const applyPreview = () => {
    if (previewLayout) setLayout(previewLayout)
    setPreviewLayout(null)
    setShowGenerate(false)
  }
  const discardPreview = () => {
    setPreviewLayout(null)
    setShowGenerate(false)
  }
  const data = DATA.platform

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

  const activeLayout = previewLayout ?? layout
  const renderColumn = (column: ColumnKey) => (
    <div className="flex flex-col gap-4">
      {activeLayout[column].map((id, index) => (
        <DraggableWidget key={id} id={id} column={column} index={index} editing={editing} onMove={moveWidget} onRemove={removeWidget}>
          {WIDGETS[id].render(data)}
        </DraggableWidget>
      ))}
      {editing && <ColumnDropZone column={column} count={activeLayout[column].length} onMove={moveWidget} />}
    </div>
  )

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full gap-2">
      <div data-testid="screen-home" className="h-full flex-1 overflow-y-auto rounded-[26px] bg-white">
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
                  {previewLayout && (
                    <span className="flex h-9 items-center gap-1.5 rounded-full px-3" style={{ backgroundColor: `${PURPLE}12` }}>
                      <Sparkles size={13} color={PURPLE} />
                      <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>Preview</span>
                    </span>
                  )}
                  <button onClick={() => setShowGenerate(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Generate a new Home">
                    <Sparkles size={14} color={PURPLE} />
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Generate</span>
                  </button>
                  {!previewLayout && (
                    <button onClick={() => setEditing(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Customize dashboard">
                      <Pencil size={14} color={INK} />
                      <span className="text-[13px] font-semibold" style={{ color: INK }}>Customize</span>
                    </button>
                  )}
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
      {showGenerate && (
        <GenerateHomePanel
          hasPreview={previewLayout !== null}
          onGenerate={setPreviewLayout}
          onApply={applyPreview}
          onDiscard={discardPreview}
          onClose={discardPreview}
        />
      )}
      </div>
    </DndProvider>
  )
}
