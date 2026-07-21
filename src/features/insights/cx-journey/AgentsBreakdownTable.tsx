import { AGENT_ROWS, type AgentCell } from './cx-journey-data'

const COLS = ['Conversations', 'Handled', 'Resolved', 'Agent efficiency & CSAT']

function MetricCell({ cell }: { cell: AgentCell }) {
  return (
    <td className="px-4 py-6 align-top">
      <div className="flex items-baseline gap-3">
        <span className="text-[24px] font-semibold text-ink">{cell.primary}</span>
        {cell.csat ? <span className="text-[20px] font-semibold text-[#0f8a5f]">{cell.csat}</span> : null}
      </div>
      <div className="mt-2 space-y-0.5">
        {cell.subs.map((sub, i) => (
          <p key={i} className="text-[12px] text-ink-muted">
            <span className="font-semibold text-ink">{sub.emphasis}</span> {sub.label}
          </p>
        ))}
      </div>
    </td>
  )
}

export function AgentsBreakdownTable() {
  return (
    <section className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="px-4 py-3 text-left text-[12px] font-medium text-ink-muted">Agents</th>
            {COLS.map((col) => (
              <th key={col} className="px-4 py-3 text-left text-[12px] font-medium text-ink-muted">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AGENT_ROWS.map((row) => (
            <tr key={row.agent} className="border-b border-surface-border">
              <td className="px-4 py-6 align-top text-[18px] font-semibold text-ink">{row.agent}</td>
              <MetricCell cell={row.conversations} />
              <MetricCell cell={row.handled} />
              <MetricCell cell={row.resolved} />
              <MetricCell cell={row.efficiency} />
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
