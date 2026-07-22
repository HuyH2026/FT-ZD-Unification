import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Check,
  Lightbulb, MessageSquare,
  Plug, User, X,
} from 'lucide-react'
import {
  INK, MUTED, BORDER, BLUE, GREEN, RED,
  ImpactDonut, StageBadge, TypeTag,
} from './pm-ui'
import { LIFECYCLE_LABEL } from './pm-data'
import {
  getOpportunityDetail,
  type OpportunityDetail, type DetailSegment, type AffectedCustomer, type DetailConversation,
} from './pm-detail-data'
import {
  PM_TOOLS, PM_TOOL_LABEL, loadPmIntegration, persistPmIntegration,
  type PmIntegration, type PmTool,
} from './pm-integration'

const CARD = 'rounded-2xl border border-solid bg-white'

function Divider() {
  return <div className="my-8 h-px w-full" style={{ backgroundColor: BORDER }} />
}

// Stats-strip proportional bar (filled portion = the affected/at-risk share).
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#d2d3d8' }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function StatsStrip({ d }: { d: OpportunityDetail }) {
  const { opp } = d
  const atRisk = opp.revenueState === 'at-risk'
  const revColor = atRisk ? RED : GREEN
  const volColor = opp.volumeGood ? GREEN : RED
  return (
    <div className={`${CARD} flex items-stretch gap-6 p-6`} style={{ borderColor: '#e4e7f0' }}>
      {/* Impact donut */}
      <div className="flex shrink-0 flex-col items-center justify-center">
        <ImpactDonut value={opp.impact} />
        <span className="mt-1 text-[12px] font-normal" style={{ color: INK }}>Impact</span>
      </div>
      <div className="w-px shrink-0" style={{ backgroundColor: BORDER }} />
      {/* Revenue */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-normal" style={{ color: INK }}>Revenue</span>
          <span className="flex h-[24px] items-center rounded-full px-2" style={{ backgroundColor: `${revColor}18` }}>
            <span className="text-[12px] font-medium" style={{ color: revColor }}>{atRisk ? 'At risk' : 'Asking'}</span>
          </span>
        </div>
        <span className="mt-1 text-[28px] font-semibold leading-[30px]" style={{ color: INK }}>{opp.revenue}</span>
        <MiniBar pct={62} color={revColor} />
      </div>
      <div className="w-px shrink-0" style={{ backgroundColor: BORDER }} />
      {/* Volume */}
      <div className="flex flex-1 flex-col justify-center">
        <span className="text-[14px] font-normal" style={{ color: INK }}>Volume • 10 wk</span>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[28px] font-semibold leading-[30px]" style={{ color: INK }}>{d.volumeCount}</span>
          <span className="flex items-center gap-0.5" style={{ color: volColor }}>
            {opp.volumeUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-[14px] font-normal">{opp.volumePct}</span>
          </span>
        </div>
      </div>
      <div className="w-px shrink-0" style={{ backgroundColor: BORDER }} />
      {/* Customer segment legend */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <span className="text-[14px] font-normal" style={{ color: INK }}>Customer segment</span>
        <div className="flex flex-wrap gap-1.5">
          {d.segments.map((s) => (
            <span key={s.key} className="flex h-[22px] items-center rounded-full px-2" style={{ backgroundColor: '#e8e9eb' }}>
              <span className="text-[11px] font-semibold" style={{ color: '#373a4d' }}>{s.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Narrative({ d }: { d: OpportunityDetail }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb size={22} color={INK} />
        <h2 className="text-[20px] font-semibold" style={{ color: INK }}>What's happening</h2>
      </div>
      <p className="text-[14px] leading-[20px]" style={{ color: INK }}>
        {d.narrative.map((run, i) => (
          <span key={i} className={run.bold ? 'font-bold' : 'font-normal'}>{run.text}</span>
        ))}
      </p>
      {d.reproSteps && d.reproSteps.length > 0 && (
        <div className="mt-4 rounded-[10px] border border-solid p-4" style={{ borderColor: '#ffb393' }}>
          <p className="text-[14px] font-semibold" style={{ color: INK }}>Suggested reproduction steps</p>
          <ol className="mt-2 list-decimal pl-5">
            {d.reproSteps.map((s, i) => (
              <li key={i} className="text-[14px] leading-[20px]" style={{ color: '#162040' }}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function ConversationCard({ c }: { c: DetailConversation }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: '#f5faff' }}>
      <p className="text-[14px] italic leading-[22px]" style={{ color: '#000' }}>"{c.quote}"</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[12px] font-medium" style={{ color: '#545767' }}>
          {c.customer} • {c.revenueLabel} • {c.plan}
        </span>
        <button className="text-[12px] font-medium underline outline-none" style={{ color: '#293239' }}>View conversation</button>
      </div>
    </div>
  )
}

function Conversations({ d }: { d: OpportunityDetail }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare size={22} color={INK} />
        <h2 className="text-[20px] font-semibold" style={{ color: INK }}>Conversations</h2>
        <button className="flex h-8 items-center rounded-full border border-solid px-3 outline-none" style={{ borderColor: '#b8b7b5' }}>
          <span className="text-[12px] font-semibold" style={{ color: '#293239' }}>View all {d.totalConversations} conversations</span>
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {d.conversations.map((c) => <ConversationCard key={c.id} c={c} />)}
      </div>
    </div>
  )
}

function SegmentBar({ s }: { s: DetailSegment }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-[80px] shrink-0 text-[14px] font-medium" style={{ color: INK }}>{s.label}</span>
      <div className="flex h-[9px] flex-1 overflow-hidden rounded-[2px]" style={{ backgroundColor: '#d2d3d8' }}>
        <div className="h-full rounded-[2px]" style={{ width: `${s.pct}%`, backgroundColor: BLUE }} />
      </div>
      <span className="w-[190px] shrink-0 text-right text-[14px] font-medium" style={{ color: '#545767' }}>
        {s.convoCount} convo · {s.pct}% · {s.revenue}
      </span>
    </div>
  )
}

function CustomerRow({ a }: { a: AffectedCustomer }) {
  return (
    <div className="flex items-center gap-3 border-b border-solid py-3" style={{ borderColor: '#e4e7f0' }}>
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#e8e9eb' }}>
        <span className="text-[11px] font-semibold" style={{ color: '#373a4d' }}>{a.name[0]}</span>
      </div>
      <span className="text-[14px]" style={{ color: '#000' }}>{a.name}</span>
      <span className="flex h-[22px] items-center rounded-full px-2" style={{ backgroundColor: '#e8e9eb' }}>
        <span className="text-[11px] font-semibold" style={{ color: '#373a4d' }}>{a.plan}</span>
      </span>
      <span className="text-[14px] font-medium" style={{ color: '#545767' }}>Renewal date - {a.renewalDate}</span>
      <span className="ml-auto text-[14px]" style={{ color: '#000' }}>{a.arrLabel}</span>
    </div>
  )
}

function CustomerSegment({ d }: { d: OpportunityDetail }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <User size={22} color={INK} />
        <h2 className="text-[20px] font-semibold" style={{ color: INK }}>Customer segment</h2>
      </div>
      <div className="flex flex-col gap-4">
        {d.segments.map((s) => <SegmentBar key={s.key} s={s} />)}
      </div>
      <p className="mt-6 text-[14px]" style={{ color: '#000' }}>
        {d.affectedCustomers.length} customers affected <span style={{ color: '#a6a9b2' }}>•</span> churn risk
      </p>
      <div className="mt-2">
        {d.affectedCustomers.map((a) => <CustomerRow key={a.id} a={a} />)}
      </div>
    </div>
  )
}

// Right rail --------------------------------------------------------------
function SuggestedAction({ d }: { d: OpportunityDetail }) {
  const [integration, setIntegration] = useState<PmIntegration>(() => loadPmIntegration())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const toolLabel = integration.tool ? PM_TOOL_LABEL[integration.tool] : null

  const connect = (tool: PmTool) => {
    const next: PmIntegration = { connected: true, tool }
    setIntegration(next)
    persistPmIntegration(next)
    setPickerOpen(false)
  }

  return (
    <div
      className="relative flex flex-col gap-4 rounded-2xl border border-solid p-6"
      style={{
        borderColor: '#f2f4f7',
        backgroundImage:
          'linear-gradient(132deg, rgba(255,179,147,0.15) 0%, rgba(171,213,250,0.15) 50%, rgba(18,166,180,0.15) 100%)',
      }}
    >
      <p className="text-[14px] font-semibold" style={{ color: '#000' }}>Suggested action</p>
      <p className="text-[14px] leading-[20px]" style={{ color: '#293239' }}>{d.suggestedAction}</p>

      {/* Add to {tool} — reuses the mock connect flow */}
      {integration.connected && toolLabel ? (
        <button
          onClick={() => setAdded(true)}
          disabled={added}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-solid outline-none disabled:opacity-70"
          style={{ borderColor: '#b8b7b5', backgroundColor: added ? `${GREEN}14` : 'transparent' }}
        >
          {added ? <Check size={16} color={GREEN} /> : <Plug size={16} color="#293239" />}
          <span className="text-[14px] font-semibold" style={{ color: added ? GREEN : '#293239' }}>
            {added ? 'Added ✓' : `Add to ${toolLabel}`}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-solid outline-none"
          style={{ borderColor: '#b8b7b5' }}
        >
          <Plug size={16} color="#293239" />
          <span className="text-[14px] font-semibold" style={{ color: '#293239' }}>Connect a tool to add</span>
        </button>
      )}
      {pickerOpen && !integration.connected && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setPickerOpen(false)} />
          <div className="absolute left-6 right-6 top-[150px] z-[61] rounded-xl border border-solid bg-white py-1.5 shadow-[0px_16px_24px_0px_rgba(10,13,14,0.16)]" style={{ borderColor: BORDER }}>
            {PM_TOOLS.map((t) => (
              <button key={t.key} onClick={() => connect(t.key)} className="flex w-full items-center gap-2 px-3 py-2 text-left outline-none hover:bg-[#f5f5f4]">
                <Plug size={14} color={MUTED} />
                <span className="text-[13px] font-normal" style={{ color: INK }}>{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <button className="flex h-10 w-full items-center justify-center rounded-full outline-none" style={{ backgroundColor: '#313131' }}>
        <span className="text-[14px] font-semibold text-white">Generate fix</span>
      </button>
    </div>
  )
}

function LinkedItems({ d }: { d: OpportunityDetail }) {
  const [dismissed, setDismissed] = useState(false)
  const show = d.linkedSuggestion && !dismissed
  return (
    <div className={`${CARD} p-6`} style={{ borderColor: '#f2f4f7' }}>
      <p className="text-[14px] font-semibold" style={{ color: '#000' }}>Linked items</p>
      {show ? (
        <div className="relative mt-4 rounded-[12px] p-5" style={{ backgroundColor: '#fff3e4' }}>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full outline-none"
          >
            <X size={14} color="#293239" />
          </button>
          <p className="text-[14px] font-semibold" style={{ color: '#293239' }}>Possible related issue</p>
          <p className="mt-2 text-[14px] leading-[20px]" style={{ color: '#293239' }}>
            {d.linkedSuggestion!.ref} {d.linkedSuggestion!.text}
          </p>
          <button className="mt-1 text-[14px] font-semibold underline outline-none" style={{ color: '#293239' }}>Link to it</button>
        </div>
      ) : (
        <p className="mt-10 text-center text-[14px]" style={{ color: '#848f99' }}>No issues linked yet</p>
      )}
    </div>
  )
}

function LifecycleTimeline({ d }: { d: OpportunityDetail }) {
  return (
    <div className={`${CARD} p-6`} style={{ borderColor: '#f2f4f7' }}>
      <p className="text-[14px] font-semibold" style={{ color: '#000' }}>Lifecycle</p>
      <div className="relative mt-4 flex flex-col gap-6 pl-2">
        {d.timeline.map((node) => {
          const current = node.stage === d.opp.stage
          const done = node.dateLabel !== null
          const dot = current || done ? GREEN : '#d2d3d8'
          return (
            <div key={node.stage} className="flex items-center gap-5">
              <span
                className="size-4 shrink-0 rounded-lg border-2 border-white"
                style={{ backgroundColor: dot }}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-medium" style={{ color: current ? '#313131' : '#706f6e' }}>
                  {LIFECYCLE_LABEL[node.stage]}
                </span>
                <span className="text-[11px]" style={{ color: '#313131' }}>{node.dateLabel ?? '--'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Root --------------------------------------------------------------------
export function OpportunityDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const detail = getOpportunityDetail(id)

  if (!detail) {
    return (
      <div data-testid="screen-opportunity-detail" className="flex h-full flex-col items-center justify-center gap-3 rounded-[26px] bg-white">
        <p className="text-[16px] font-semibold" style={{ color: INK }}>Opportunity not found</p>
        <Link to="/" className="text-[14px] font-semibold underline" style={{ color: BLUE }}>Back to Home</Link>
      </div>
    )
  }

  const { opp } = detail

  return (
    <div data-testid="screen-opportunity-detail" className="h-full overflow-y-auto rounded-[26px] bg-white">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-solid px-10" style={{ borderColor: '#f3f1ef' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 outline-none"
        >
          <ArrowLeft size={20} color="#01567a" />
          <span className="text-[14px] font-semibold" style={{ color: '#01567a' }}>Product recommendations</span>
        </button>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-10 py-8">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-semibold" style={{ color: '#000' }}>{opp.title}</h1>
            <TypeTag type={opp.type} />
            <StageBadge stage={opp.stage} />
          </div>

          <div className="mt-4">
            <StatsStrip d={detail} />
          </div>

          <Divider />
          <Narrative d={detail} />
          <Divider />
          <Conversations d={detail} />
          <Divider />
          <CustomerSegment d={detail} />
        </div>

        {/* Right rail */}
        <div className="flex w-[320px] shrink-0 flex-col gap-3">
          <SuggestedAction d={detail} />
          <LinkedItems d={detail} />
          <LifecycleTimeline d={detail} />
        </div>
      </div>
    </div>
  )
}
