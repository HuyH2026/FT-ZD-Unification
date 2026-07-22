// The agents table for the active channel/tab. Columns: checkbox · Agents ·
// Activate (toggle) · Type · Conversations · Deflections · Deflection rate ·
// Avg. CSAT · Tags. The on/off toggle is driven by the parent via isOn/onToggle;
// checkboxes are inert.
import { Tag } from 'lucide-react'
import { type Agent } from './agent-builder-data'

const INK = '#2f3130'
const GREEN = '#0f8a5f'

const COLS = ['Type', 'Conversations', 'Deflections', 'Deflection rate', 'Avg. CSAT', 'Tags']

function Toggle({ agent, on, onToggle }: { agent: Agent; on: boolean; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Activate ${agent.name}`}
        onClick={() => onToggle(agent.id)}
        className="relative h-4 w-7 rounded-full transition-colors"
        style={{ backgroundColor: on ? GREEN : '#c9c7c3' }}
      >
        <span
          className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
          style={{ left: on ? '14px' : '2px' }}
        />
      </button>
      <span className="text-[13px]" style={{ color: INK }}>{on ? 'On' : 'Off'}</span>
    </div>
  )
}

export function AgentsTable({
  agents, isOn, onToggle, onRowClick,
}: {
  agents: Agent[]
  isOn: (a: Agent) => boolean
  onToggle: (id: string) => void
  onRowClick?: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="w-10 px-3 py-3"><span className="sr-only">Select</span></th>
            <th className="px-3 py-3 text-left text-[12px] font-medium text-ink-muted">Agents</th>
            <th className="px-3 py-3 text-left text-[12px] font-medium text-ink-muted">Activate</th>
            {COLS.map((c) => (
              <th key={c} className="px-3 py-3 text-left text-[12px] font-medium text-ink-muted">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} className="border-b border-surface-border">
              <td className="px-3 py-4 align-middle">
                <span className="inline-block size-4 rounded border border-surface-border" aria-hidden />
              </td>
              <td className="px-3 py-4 align-middle text-[14px] font-medium">
                <button
                  type="button"
                  aria-label={`Open ${a.name}`}
                  onClick={() => onRowClick?.(a.id)}
                  className="text-left hover:underline"
                  style={{ color: INK }}
                >
                  {a.name}
                </button>
              </td>
              <td className="px-3 py-4 align-middle">
                <Toggle agent={a} on={isOn(a)} onToggle={onToggle} />
              </td>
              <td className="px-3 py-4 align-middle text-[13px] text-ink-muted">{a.type}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.conversations.toLocaleString('en-US')}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.deflections.toLocaleString('en-US')}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.deflectionRate}</td>
              <td className="px-3 py-4 align-middle text-[13px]" style={{ color: INK }}>{a.csat}</td>
              <td className="px-3 py-4 align-middle">
                <div className="flex flex-wrap gap-1">
                  {a.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-md border border-surface-border px-2 py-0.5 text-[12px] text-ink-muted">
                      <Tag size={11} aria-hidden />
                      {t}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
