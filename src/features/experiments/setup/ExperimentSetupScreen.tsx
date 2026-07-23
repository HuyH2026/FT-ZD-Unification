// Full-page A/B Test Setup screen (route /experiments/new). Presentational:
// controlled local inputs, every action navigates back to /experiments.
// Mirrors AutomationDetailScreen's shell (rounded card + top bar + body).
import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeft,
  MoreHorizontal,
  FlaskConical,
  Users,
  Trophy,
  Plus,
  Timer,
  MessageSquare,
  Calendar,
} from 'lucide-react'
import {
  SETUP_VARIANTS,
  WINNER_METRICS,
  TIME_ZONE,
  DEFAULT_TEST_NAME,
  DEFAULT_TEST_DESCRIPTION,
} from '../experiments-data'
import { SetupSection } from './SetupSection'
import { VariantRow } from './VariantRow'
import { SummaryPanel } from './SummaryPanel'
import { TextField, TextArea, SelectField } from './Field'

const TABS = ['Setup', 'Results', 'Agents', 'Conversations']

export function ExperimentSetupScreen() {
  const navigate = useNavigate()
  const back = () => navigate('/experiments')

  const [name, setName] = useState(DEFAULT_TEST_NAME)
  const [description, setDescription] = useState(DEFAULT_TEST_DESCRIPTION)
  const [endCondition, setEndCondition] = useState<'fixed' | 'count'>('fixed')

  return (
    <div
      data-testid="screen-experiment-setup"
      className="flex h-full flex-col overflow-hidden rounded-[26px] bg-white"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-surface-border px-6 py-3">
        <button type="button" aria-label="Back to Experiments" onClick={back}>
          <ArrowLeft size={18} className="text-ink" aria-hidden />
        </button>
        <span className="text-[15px] font-semibold text-ink">{name || DEFAULT_TEST_NAME}</span>
        <button type="button" aria-label="Test options">
          <MoreHorizontal size={18} className="text-ink-muted" aria-hidden />
        </button>

        <div role="tablist" className="mx-auto flex items-center gap-1 rounded-full bg-[#f5f6f7] p-1">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={t === 'Setup'}
              disabled={t !== 'Setup'}
              className={
                'rounded-full px-4 py-1.5 text-[14px] ' +
                (t === 'Setup' ? 'bg-white font-medium text-ink shadow-sm' : 'text-ink-muted')
              }
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={back}
          className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white"
        >
          Run A/B Test
        </button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex gap-6 px-8 py-6">
          {/* Form column */}
          <div className="max-w-[620px] flex-1 divide-y divide-surface-border">
            <SetupSection
              icon={<FlaskConical size={16} aria-hidden />}
              title="A/B Test detail"
              subtitle="Define the test's purpose and context."
            >
              <TextField label="Test name" value={name} onChange={setName} />
              <TextArea label="Description" value={description} onChange={setDescription} />
              <SelectField label="Channel" value="Widget" muted />
            </SetupSection>

            <SetupSection
              icon={<Users size={16} aria-hidden />}
              title="Agent and variants"
              subtitle="Set up your control and test variants."
            >
              {/* Total traffic + static slider */}
              <div className="flex items-end gap-4">
                <div className="w-[110px]">
                  <span className="block text-[12px] font-medium text-ink">Total Traffic</span>
                  <div className="mt-1.5 flex items-center justify-between rounded-[20px] border border-[#bcbdc5] bg-white px-3.5 py-2 text-[14px] text-ink">
                    <span>100</span>
                    <span className="text-ink-muted">%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative h-[3px] rounded-full bg-[#9abaca]">
                    <div className="absolute inset-y-0 left-0 w-full rounded-full bg-[#01567a]" />
                    <div className="absolute right-0 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-[#01567a] bg-white" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[12px] text-ink-muted">
                    <span>0 %</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {SETUP_VARIANTS.map((v) => (
                <VariantRow key={v.key} variant={v} />
              ))}

              <button
                type="button"
                className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#ebf5f7] px-3.5 py-1.5 text-[12px] font-semibold text-[#193d50]"
              >
                <Plus size={14} aria-hidden />
                Add variant
              </button>
            </SetupSection>

            <SetupSection
              icon={<Trophy size={16} aria-hidden />}
              title="Winner & Test end"
              subtitle="Define how success is measured and when the test ends."
            >
              <SelectField label="Choose the metric used to determine the winner" value="" muted />
              <div className="flex gap-2">
                {WINNER_METRICS.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-[#d2d9e5] bg-[#f2f4f7] px-2.5 py-1 text-[12px] text-ink"
                  >
                    {m}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="w-[100px] text-[12px] font-medium text-ink">Time zone</span>
                <div className="flex-1">
                  <SelectField value={TIME_ZONE} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-[100px] text-[12px] font-medium text-ink">End condition</span>
                <div className="flex flex-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setEndCondition('fixed')}
                    className={
                      'flex flex-1 items-center justify-center gap-1.5 rounded-[20px] border px-3.5 py-2 text-[12px] ' +
                      (endCondition === 'fixed'
                        ? 'border-[#01567a] bg-[#ebf5f7] text-ink'
                        : 'border-[#bcbdc5] text-ink-muted')
                    }
                  >
                    <Timer size={16} aria-hidden />
                    Fixed duration
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndCondition('count')}
                    className={
                      'flex flex-1 items-center justify-center gap-1.5 rounded-[20px] border px-3.5 py-2 text-[12px] ' +
                      (endCondition === 'count'
                        ? 'border-[#01567a] bg-[#ebf5f7] text-ink'
                        : 'border-[#bcbdc5] text-ink-muted')
                    }
                  >
                    <MessageSquare size={16} aria-hidden />
                    Conversation count
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-[100px] text-[12px] font-medium text-ink">Start date</span>
                <div className="flex flex-1 gap-3">
                  <div className="flex flex-1 items-center gap-2 rounded-[20px] border border-[#bcbdc5] bg-white px-3.5 py-2 text-[14px] text-ink">
                    <Calendar size={16} className="text-ink-muted" aria-hidden />
                    Sep 25, 2025
                  </div>
                  <div className="flex-1">
                    <SelectField value="6:00 AM" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-[100px] text-[12px] font-medium text-ink">End date</span>
                <div className="flex flex-1 gap-3">
                  <div className="flex flex-1 items-center gap-2 rounded-[20px] border border-[#bcbdc5] bg-white px-3.5 py-2 text-[14px] text-ink">
                    <Calendar size={16} className="text-ink-muted" aria-hidden />
                    Oct 23, 2025
                  </div>
                  <div className="flex-1">
                    <SelectField value="12:00 AM" />
                  </div>
                </div>
              </div>
            </SetupSection>
          </div>

          {/* Summary column */}
          <div className="w-[360px] shrink-0">
            <SummaryPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
