import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { AUTOMATIONS } from './orchestrator-data'
import { JourneyCanvas } from './journey/JourneyCanvas'

type Tab = 'journey' | 'analytic' | 'log'
const TABS: { id: Tab; label: string }[] = [
  { id: 'journey', label: 'Journey' },
  { id: 'analytic', label: 'Analytic' },
  { id: 'log', label: 'Log' },
]

export function AutomationDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('journey')
  const automation = AUTOMATIONS.find((a) => a.id === id)

  if (!automation) return <Navigate to="/orchestrator" replace />

  return (
    <div data-testid="screen-automation-detail" className="flex h-full flex-col overflow-hidden rounded-[26px] bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-surface-border px-6 py-3">
        <button type="button" aria-label="Back to Orchestrator" onClick={() => navigate('/orchestrator')}>
          <ArrowLeft size={18} className="text-ink" aria-hidden />
        </button>
        <span className="text-[15px] font-semibold text-ink">{automation.name}</span>
        <button type="button" aria-label="Automation options">
          <MoreHorizontal size={18} className="text-ink-muted" aria-hidden />
        </button>

        <div role="tablist" className="mx-auto flex items-center gap-1 rounded-full bg-[#f5f6f7] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={
                'rounded-full px-4 py-1.5 text-[14px] ' +
                (tab === t.id ? 'bg-white font-medium text-ink shadow-sm' : 'text-ink-muted')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <button type="button" className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white">
          Run A/B Test
        </button>
      </div>

      {/* Tab body */}
      <div className="min-h-0 flex-1">
        {tab === 'journey' ? (
          <JourneyCanvas automationId={automation.id} />
        ) : (
          <div className="flex h-full items-center justify-center text-[14px] text-ink-muted">
            {TABS.find((t) => t.id === tab)?.label} — Coming soon
          </div>
        )}
      </div>
    </div>
  )
}
