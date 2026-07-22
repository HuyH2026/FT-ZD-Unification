// The automations table. Columns: Automation (name + updated caption) · Nodes ·
// Description · Runs · Run success rate · Activate. The on/off toggle is driven
// by the parent via isOn/onToggle. Rows are separated cards, matching the frame.
import { type Automation } from './orchestrator-data'
import { NodeChips } from './NodeChips'
import { SuccessBar } from './SuccessBar'

const INK = '#2f3130'
const GREEN = '#0f8a5f'

function Toggle({ automation, on, onToggle }: { automation: Automation; on: boolean; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Activate ${automation.name}`}
        onClick={(e) => { e.stopPropagation(); onToggle(automation.id) }}
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ backgroundColor: on ? GREEN : '#c9c7c3' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: on ? '18px' : '2px' }}
        />
      </button>
      <span className="text-[13px]" style={{ color: INK }}>{on ? 'On' : 'Off'}</span>
    </div>
  )
}

export function AutomationTable({
  automations, isOn, onToggle, onOpen,
}: {
  automations: Automation[]
  isOn: (a: Automation) => boolean
  onToggle: (id: string) => void
  onOpen?: (id: string) => void
}) {
  return (
    <div>
      {/* Column headers */}
      <div className="grid grid-cols-[1.4fr_1fr_1.6fr_0.5fr_1fr_0.7fr] gap-4 px-5 py-3 text-[12px] font-medium text-ink-muted">
        <span>Automation</span>
        <span>Nodes</span>
        <span>Description</span>
        <span>Runs</span>
        <span>Run success rate</span>
        <span>Activate</span>
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-3">
        {automations.map((a) => (
          <div
            key={a.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen?.(a.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen?.(a.id)
              }
            }}
            className="grid cursor-pointer grid-cols-[1.4fr_1fr_1.6fr_0.5fr_1fr_0.7fr] items-center gap-4 rounded-2xl border border-surface-border bg-white px-5 py-4"
          >
            <div>
              <div className="text-[15px] font-semibold" style={{ color: INK }}>{a.name}</div>
              <div className="mt-1 text-[12px] text-ink-muted">{a.updatedLabel}</div>
            </div>
            <div>
              <NodeChips label={a.primaryNode} kind={a.primaryNodeKind} extra={a.extraNodes} />
            </div>
            <div className="border-l border-surface-border pl-4 text-[13px] text-ink-muted">{a.description}</div>
            <div className="text-[14px]" style={{ color: INK }}>{a.runs}</div>
            <div><SuccessBar rate={a.successRate} /></div>
            <div><Toggle automation={a} on={isOn(a)} onToggle={onToggle} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
