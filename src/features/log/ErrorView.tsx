// Error tab body: sub-header ("Errors overview" + "Last 24 hours" / retention
// note), the overview cards, then the toolbar and table.
import { ErrorOverview } from './ErrorOverview'
import { ErrorToolbar } from './ErrorToolbar'
import { ErrorTable } from './ErrorTable'

export function ErrorView() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[20px] text-ink">
          Errors overview <span className="text-grey-500">Last 24 hours</span>
        </h2>
        <span className="text-[13px] text-ink-muted">Error logs are stored for 30 days.</span>
      </div>
      <ErrorOverview />
      <div className="flex flex-col gap-4">
        <ErrorToolbar />
        <ErrorTable />
      </div>
    </div>
  )
}
