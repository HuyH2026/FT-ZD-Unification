// A status pill for an experiment. Color + label are driven by the status.
// Brand/status colors are inline hex (no token), matching the frame.
import { type ExperimentStatus } from './experiments-data'

const CONFIG: Record<ExperimentStatus, { label: string; bg: string }> = {
  'not-started': { label: 'Not started', bg: '#9194a0' },
  running: { label: 'Running', bg: '#007f74' },
  completed: { label: 'Completed', bg: '#3489db' },
  canceled: { label: 'Canceled', bg: '#e53112' },
}

export function StatusBadge({ status }: { status: ExperimentStatus }) {
  const { label, bg } = CONFIG[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  )
}
