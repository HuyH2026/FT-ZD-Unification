// Centered confirm dialog for deleting selected agents. Presentational — the
// parent owns the actual delete + selection reset. Matches the hand-rolled
// overlay convention used by CreateAgentPanel (no shadcn Dialog).
import { AlertTriangle } from 'lucide-react'

export function ConfirmDeleteDialog({
  count, onCancel, onConfirm,
}: {
  count: number
  onCancel: () => void
  onConfirm: () => void
}) {
  const noun = count === 1 ? 'agent' : 'agents'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={`Delete ${count} ${noun}`}
        className="relative w-[420px] rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#fdecec', color: '#c0392b' }}>
            <AlertTriangle size={18} aria-hidden />
          </span>
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Delete {count} {noun}?</h2>
            <p className="mt-1 text-[14px] text-ink-muted">
              This will permanently remove the selected {noun}. This action can't be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-surface-border px-4 py-2 text-[13px] font-medium text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-white"
            style={{ backgroundColor: '#c0392b' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
