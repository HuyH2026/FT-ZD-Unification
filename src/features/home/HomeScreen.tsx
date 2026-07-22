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
  type LevelData, type HealthState, type HealthMetric, type ChannelKey, type BrandKey,
  type WidgetId, type ColumnKey, type Layout,
  DATA, DEFAULT_LAYOUT,
} from './dashboard-data'
import { computeHealthView, CHANNEL_ORDER, CHANNEL_LABEL } from './health-aggregate'
import { GenerateHomePanel } from './GenerateHomePanel'
import { deriveRoleData } from './role-data'
import { ViewSwitcher } from './ViewSwitcher'
import {
  type ViewsState, type NewView,
  loadViewsState, persistViewsState, getActiveView,
  addView, renameView, deleteView, setActiveView, updateActiveLayout,
  movePmWidget, removePmWidget, addPmWidget, resetPmLayout,
} from './views-store'
import { PmDashboard } from './PmDashboard'
import { DEFAULT_PM_LAYOUT, PM_WIDGET_ID_LIST, type PmWidgetId } from './generate-layout'

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

// Icon per channel family, keyed to ChannelKey.
const CHANNEL_FAMILY_ICON: Record<ChannelKey, LucideIcon> = {
  messaging: MessageSquare,
  email: Mail,
  voice: Phone,
  headless: Code,
}

// A single health-metric tile. Its per-channel breakdown (Messaging / Email /
// Voice / Headless) floats in a popover on hover or keyboard focus — the tile
// itself stays compact. `barPct` is a precomputed 0-100 fill so the breakdown
// stays unit-agnostic across metrics with different units (%, score, duration).
function MetricTile({ metric, selected }: { metric: HealthMetric; selected?: Set<ChannelKey> }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="relative rounded-xl border border-solid p-3.5 transition-colors"
      style={{ borderColor: open ? BLUE : BORDER, backgroundColor: '#faf9f8' }}
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div className="flex items-center gap-1">
        <p className="text-[12px] font-normal" style={{ color: MUTED }}>{metric.label}</p>
        <ChevronDown size={13} color={MUTED} />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="text-[22px] font-medium" style={{ color: INK }}>{metric.value}</span>
        <span className="flex items-center gap-0.5" style={{ color: metric.good ? GREEN : RED }}>
          {metric.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span className="text-[12px] font-semibold">{metric.delta}</span>
        </span>
      </div>
      {open && (
        <div
          role="tooltip"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 flex flex-col gap-2.5 rounded-xl border border-solid bg-white p-3.5 shadow-[0px_16px_24px_0px_rgba(10,13,14,0.16)]"
          style={{ borderColor: BORDER }}
        >
          <p className="text-[12px] font-semibold" style={{ color: INK }}>{metric.label} by channel</p>
          {metric.byChannel.map((c) => {
            const Icon = CHANNEL_FAMILY_ICON[c.key]
            const dim = selected ? !selected.has(c.key) : false
            return (
              <div key={c.key} style={{ opacity: dim ? 0.4 : 1 }}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} color={MUTED} />
                    <span className="text-[13px] font-normal" style={{ color: INK }}>{c.label}</span>
                    <span className="text-[11px] font-normal" style={{ color: MUTED }}>{c.share}% of volume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>{c.value}</span>
                    <span className="flex items-center gap-0.5" style={{ color: c.good ? GREEN : RED }}>
                      {c.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span className="text-[11px] font-semibold">{c.delta}</span>
                    </span>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#efeeec' }}>
                  <div className="h-full rounded-full" style={{ width: `${c.barPct}%`, backgroundColor: c.good ? GREEN : AMBER }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AgentHealthCard({ data }: { data: LevelData }) {
  const [selected, setSelected] = useState<Set<ChannelKey>>(
    () => new Set(CHANNEL_ORDER),
  )
  const view = useMemo(() => computeHealthView(data, selected), [data, selected])
  const chart = useMemo(() => view.trend.map((v, i) => ({ i, v })), [view.trend])
  const state = HEALTH_STATE_META[view.healthState]
  const allSelected = selected.size >= CHANNEL_ORDER.length

  function toggle(key: ChannelKey) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size === 1) return prev // keep at least one channel
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <Card>
      <CardHeader
        icon={<Activity size={18} color={INK} strokeWidth={2} />}
        title="Overall agent health"
        action={
          <div className="flex items-center gap-3">
            {/* Channel filter — the whole card re-scopes to the selected channels. */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CHANNEL_ORDER.map((key) => {
                const on = selected.has(key)
                // The last remaining channel is locked (min one) — clicking it is a
                // no-op; surface that to assistive tech rather than silently ignoring.
                const locked = on && selected.size === 1
                const Icon = CHANNEL_FAMILY_ICON[key]
                return (
                  <button
                    key={key}
                    role="checkbox"
                    aria-checked={on}
                    aria-disabled={locked}
                    aria-label={CHANNEL_LABEL[key]}
                    onClick={() => toggle(key)}
                    className="flex h-7 items-center gap-1.5 rounded-full border border-solid px-2.5 outline-none transition-colors"
                    style={{
                      borderColor: on ? INK : BORDER,
                      backgroundColor: on ? `${INK}0d` : '#fff',
                    }}
                  >
                    <Icon size={13} color={on ? INK : MUTED} />
                    <span className="text-[12px] font-semibold" style={{ color: on ? INK : MUTED }}>
                      {CHANNEL_LABEL[key]}
                    </span>
                  </button>
                )
              })}
            </div>
            <LinkButton label="Open Insights" />
          </div>
        }
      />
      <div className="flex items-stretch gap-6">
        <div className="flex w-[168px] shrink-0 flex-col justify-center">
          <div className="flex items-end gap-1.5">
            <span className="text-[44px] font-medium leading-[44px]" style={{ color: INK }}>{view.score}</span>
            <span className="mb-1.5 text-[16px] font-normal" style={{ color: MUTED }}>/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="flex h-[22px] items-center gap-1 rounded-full px-2" style={{ backgroundColor: `${state.color}18` }}>
              <state.Icon size={13} color={state.color} />
              <span className="text-[12px] font-semibold" style={{ color: state.color }}>{state.label}</span>
            </span>
          </div>
          {!allSelected && (
            <p className="mt-2 text-[11px] font-normal" style={{ color: MUTED }}>
              Filtered · {CHANNEL_ORDER.filter((k) => selected.has(k)).map((k) => CHANNEL_LABEL[k]).join(', ')}
            </p>
          )}
          <div className="mt-3 -mx-0.5 h-[44px]">
            <Sparkline data={chart} color={state.color} gradientId="healthFill" />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          {view.metrics.map((m) => (
            <MetricTile key={m.key} metric={m} selected={selected} />
          ))}
        </div>
      </div>
      {/* AI short summary */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-solid p-3.5" style={{ borderColor: `${PURPLE}33`, backgroundColor: `${PURPLE}0a` }}>
        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${PURPLE}16` }}>
          <Sparkles size={13} color={PURPLE} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px]" style={{ color: PURPLE }}>AI summary</p>
          <p className="mt-0.5 text-[12px] font-normal leading-[17px]" style={{ color: INK_SOFT }}>{view.aiSummary}</p>
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

// Slack logomark — lucide has no Slack icon, so this is a local inline SVG
// (matching the codebase's inline-SVG convention). Rendered in Slack aubergine.
function SlackGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 122.8 122.8" aria-hidden="true">
      <path fill="#611f69" d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9zM32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9z"/>
      <path fill="#611f69" d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9zM45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9z"/>
      <path fill="#611f69" d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97zM90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9z"/>
      <path fill="#611f69" d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97zM77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9z"/>
    </svg>
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
            {a.slack && (
              <div className="mt-2.5 rounded-lg border border-solid bg-white p-2.5" style={{ borderColor: BORDER }}>
                <div className="mb-2 flex items-center gap-1.5">
                  <SlackGlyph size={13} />
                  <span className="text-[11px] font-normal" style={{ color: MUTED }}>via Slack {a.slack.channel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="flex size-[18px] shrink-0 items-center justify-center rounded-md text-[9px] font-semibold text-white"
                    style={{ backgroundColor: '#611f69' }}
                  >
                    {a.slack.author.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: INK }}>{a.slack.author}</span>
                  {a.slack.role && (
                    <span className="text-[11px] font-normal" style={{ color: MUTED }}>{a.slack.role}</span>
                  )}
                  <span className="text-[11px] font-normal" style={{ color: MUTED }}>· {a.slack.time}</span>
                </div>
                <p className="mt-1 pl-[24px] text-[12px] font-normal leading-[17px]" style={{ color: INK_SOFT }}>
                  {a.slack.message}
                </p>
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="flex h-5 items-center gap-1 rounded-full px-2" style={{ backgroundColor: `${GREEN}18` }}>
                <TrendingUp size={12} color={GREEN} />
                <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{a.impact}</span>
              </span>
              {!a.slack && (a.person ? (
                <span className="text-[11px] font-normal" style={{ color: MUTED }}>{a.person.name} · {a.person.role}</span>
              ) : (
                <span className="text-[11px] font-normal" style={{ color: MUTED }}>by {a.author}</span>
              ))}
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

// Per-tier fill colors for the intent brand breakdown (VIP / Premium / Vendor).
const BRAND_COLORS: Record<BrandKey, string> = {
  vip: PURPLE,
  premium: BLUE,
  vendor: AMBER,
}

function IntentsCard({ data }: { data: LevelData }) {
  // Accordion: at most one intent expanded at a time (its id, or null).
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <Card>
      <CardHeader icon={<ListChecks size={18} color={INK} strokeWidth={2} />} title="Top intents" action={<LinkButton label="Insights" />} />
      <div className="flex flex-col gap-3">
        {data.intents.map((it, idx) => {
          const open = openId === it.id
          const panelId = `intent-brands-${it.id}`
          return (
            <div key={it.id}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : it.id)}
                className="w-full text-left outline-none"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <p className="text-[13px] font-normal" style={{ color: INK }}>{it.name}</p>
                    <ChevronDown
                      size={13}
                      color={MUTED}
                      className="transition-transform"
                      style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                      aria-hidden
                    />
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: INK }}>{it.share}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#efeeec' }}>
                  <div className="h-full rounded-full" style={{ width: `${it.share}%`, backgroundColor: INTENT_COLORS[idx % INTENT_COLORS.length] }} />
                </div>
              </button>
              {open && (
                <div
                  id={panelId}
                  role="region"
                  aria-label={`${it.name} by brand`}
                  className="mt-2.5 flex flex-col gap-2.5 rounded-xl border border-solid p-3 pt-2.5"
                  style={{ borderColor: BORDER, backgroundColor: '#faf9f8' }}
                >
                  {it.byBrand.map((b) => (
                    <div key={b.key}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[b.key] }} />
                          <span className="text-[12px] font-normal" style={{ color: INK }}>{b.label}</span>
                        </div>
                        <span className="text-[11px] font-normal" style={{ color: MUTED }}>
                          {b.share}% · {b.tickets.toLocaleString('en-US')} tickets
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#efeeec' }}>
                        <div className="h-full rounded-full" style={{ width: `${b.share}%`, backgroundColor: BRAND_COLORS[b.key] }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
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

const PM_WIDGET_TITLE: Record<PmWidgetId, string> = {
  'pm-kpis': 'KPI summary',
  'pm-spotlight': 'Spotlight',
  'pm-lifecycle': 'Lifecycle',
  'pm-feed': 'Opportunity feed',
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

function PmAddWidgetMenu({ available, onAdd }: { available: PmWidgetId[]; onAdd: (id: PmWidgetId) => void }) {
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
                <span className="text-[13px] font-normal" style={{ color: INK }}>{PM_WIDGET_TITLE[id]}</span>
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
  const [viewsState, setViewsState] = useState<ViewsState>(() => loadViewsState())
  const [showGenerate, setShowGenerate] = useState(false)
  // The pending generated view awaiting Apply/Discard (null when not previewing).
  const [previewView, setPreviewView] = useState<NewView | null>(null)

  const activeView = getActiveView(viewsState)

  // Compute the active kind and layout (preview overrides active).
  const activeKind = previewView ? (previewView.kind ?? 'grid') : activeView.kind
  const activeRole = previewView ? previewView.role : activeView.role
  const activeLayout =
    previewView && previewView.kind !== 'pm'
      ? previewView.layout
      : activeView.kind === 'grid'
      ? activeView.layout
      : DEFAULT_LAYOUT
  const activePmLayout =
    previewView?.kind === 'pm'
      ? previewView.pmLayout
      : activeView.kind === 'pm'
      ? activeView.pmLayout
      : DEFAULT_PM_LAYOUT

  const data = useMemo(() => deriveRoleData(DATA.platform, activeRole), [activeRole])

  const applyPreview = () => {
    if (previewView) setViewsState((prev) => addView(prev, previewView))
    setPreviewView(null)
    setShowGenerate(false)
  }
  const discardPreview = () => {
    setPreviewView(null)
    setShowGenerate(false)
  }

  useEffect(() => {
    persistViewsState(viewsState)
  }, [viewsState])

  // Grid-only computations — only run when a grid view is active.
  const used = activeKind === 'grid' ? [...activeLayout.left, ...activeLayout.right] : []
  const available = activeKind === 'grid' ? (Object.keys(WIDGETS) as WidgetId[]).filter((id) => !used.includes(id)) : []

  // PM handlers
  const movePm = (fromIndex: number, toIndex: number) =>
    setViewsState((prev) => movePmWidget(prev, fromIndex, toIndex))
  const removePm = (id: PmWidgetId) =>
    setViewsState((prev) => removePmWidget(prev, id))
  const addPm = (id: PmWidgetId) =>
    setViewsState((prev) => addPmWidget(prev, id))
  const resetPm = () => setViewsState((prev) => resetPmLayout(prev))

  const moveWidget = (from: DragItem, toColumn: ColumnKey, toIndex: number) => {
    setViewsState((prev) => {
      const view = getActiveView(prev)
      if (view.kind !== 'grid') return prev
      const cur = view.layout
      const next: Layout = { left: [...cur.left], right: [...cur.right] }
      const srcArr = next[from.column]
      const realIdx = srcArr.indexOf(from.id)
      if (realIdx === -1) return prev
      srcArr.splice(realIdx, 1)
      const destArr = next[toColumn]
      const clamped = Math.max(0, Math.min(toIndex, destArr.length))
      destArr.splice(clamped, 0, from.id)
      return updateActiveLayout(prev, next)
    })
  }

  const removeWidget = (column: ColumnKey, index: number) => {
    setViewsState((prev) => {
      const view = getActiveView(prev)
      if (view.kind !== 'grid') return prev
      const cur = view.layout
      const next: Layout = { left: [...cur.left], right: [...cur.right] }
      next[column].splice(index, 1)
      return updateActiveLayout(prev, next)
    })
  }

  const addWidget = (id: WidgetId) => {
    setViewsState((prev) => {
      const view = getActiveView(prev)
      if (view.kind !== 'grid') return prev
      const cur = view.layout
      const target: ColumnKey = cur.left.length <= cur.right.length ? 'left' : 'right'
      const next: Layout = { left: [...cur.left], right: [...cur.right] }
      next[target].push(id)
      return updateActiveLayout(prev, next)
    })
  }

  const resetLayout = () => setViewsState((prev) => updateActiveLayout(prev, DEFAULT_LAYOUT))

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
              <div className="flex items-center gap-3">
                <p className="text-[26px] font-normal leading-8 tracking-[0.35px]" style={{ color: INK_SOFT }}>
                  {editing ? 'Customize your dashboard' : 'Good morning, Alex'}
                </p>
                {!editing && !previewView && (
                  <ViewSwitcher
                    views={viewsState.views}
                    activeId={viewsState.activeId}
                    onSelect={(id) => setViewsState((p) => setActiveView(p, id))}
                    onRename={(id, name) => setViewsState((p) => renameView(p, id, name))}
                    onDelete={(id) => setViewsState((p) => deleteView(p, id))}
                    onNew={() => setShowGenerate(true)}
                  />
                )}
              </div>
              <p className="mt-1 text-[14px] font-normal tracking-[-0.154px]" style={{ color: MUTED }}>
                {editing ? 'Drag widgets to reorder, remove them, or add new ones.' : "Here's what your agents need from you today."}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {editing ? (
                <>
                  {activeKind === 'grid' ? (
                    <AddWidgetMenu available={available} onAdd={addWidget} />
                  ) : (
                    <PmAddWidgetMenu
                      available={PM_WIDGET_ID_LIST.filter((id) => !activePmLayout.includes(id))}
                      onAdd={addPm}
                    />
                  )}
                  <button onClick={activeKind === 'pm' ? resetPm : resetLayout} className="flex h-9 items-center rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }}>
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Reset</span>
                  </button>
                  <button onClick={() => setEditing(false)} className="flex h-9 items-center gap-1.5 rounded-full px-4 outline-none" style={{ backgroundColor: INK }}>
                    <Check size={15} color="#fff" />
                    <span className="text-[13px] font-semibold text-white">Done</span>
                  </button>
                </>
              ) : (
                <>
                  {previewView && (
                    <span className="flex h-9 items-center gap-1.5 rounded-full px-3" style={{ backgroundColor: `${PURPLE}12` }}>
                      <Sparkles size={13} color={PURPLE} />
                      <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>Preview</span>
                    </span>
                  )}
                  <button onClick={() => setShowGenerate(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Generate a new Home">
                    <Sparkles size={14} color={PURPLE} />
                    <span className="text-[13px] font-semibold" style={{ color: INK }}>Generate</span>
                  </button>
                  {!previewView && (
                    <button onClick={() => setEditing(true)} className="flex h-9 items-center gap-1.5 rounded-full border border-solid bg-white px-3.5 outline-none" style={{ borderColor: BORDER }} title="Customize dashboard">
                      <Pencil size={14} color={INK} />
                      <span className="text-[13px] font-semibold" style={{ color: INK }}>Customize</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Dashboard body: PM or grid */}
          {activeKind === 'pm' ? (
            <PmDashboard
              pmLayout={activePmLayout}
              editing={editing}
              onMove={movePm}
              onRemove={removePm}
            />
          ) : (
            <div className="grid grid-cols-[1fr_360px] items-start gap-4">
              {renderColumn('left')}
              {renderColumn('right')}
            </div>
          )}
        </div>
      </div>
      {showGenerate && (
        <GenerateHomePanel
          hasPreview={previewView !== null}
          onGenerate={setPreviewView}
          onApply={applyPreview}
          onDiscard={discardPreview}
          onClose={discardPreview}
        />
      )}
      </div>
    </DndProvider>
  )
}
