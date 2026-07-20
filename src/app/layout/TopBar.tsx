import { OrgSwitcher } from './OrgSwitcher'

export function TopBar() {
  return (
    <div className="flex items-center justify-between h-[55px] bg-app-backdrop border-b border-surface-border px-4">
      {/* Left: OrgSwitcher */}
      <div className="flex items-center">
        <OrgSwitcher />
      </div>

      {/* Right: Profile/actions placeholder */}
      <div className="flex items-center gap-3">
        {/* Static placeholder for avatar/actions */}
        <div className="size-8 rounded-full bg-[#d9d7d5]" />
      </div>
    </div>
  )
}
