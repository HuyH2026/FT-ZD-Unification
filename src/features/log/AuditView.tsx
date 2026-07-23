// Audit tab body: sub-header (description + "Updated hourly") then the toolbar
// and table.
import { AuditToolbar } from './AuditToolbar'
import { AuditTable } from './AuditTable'

export function AuditView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-grey-700">See the history of changes made within this account.</p>
        <span className="text-[13px] text-ink-muted">Updated hourly</span>
      </div>
      <AuditToolbar />
      <AuditTable />
    </div>
  )
}
