import { Link } from 'react-router'
import { useOrgs } from '@/app/org-context'
import { OrgRow } from './OrgRow'

export function OrganizationScreen() {
  const { orgs } = useOrgs()

  return (
    <div data-testid="screen-organization" className="h-full rounded-[26px] bg-white p-10 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-[26px] leading-8 text-ink">Organization</h1>
        <Link
          to="/organization/new"
          className="h-10 px-4 rounded-full bg-ink flex items-center justify-center text-white font-semibold text-sm leading-5 whitespace-nowrap"
        >
          Create new
        </Link>
      </div>

      {/* Intro copy */}
      <div className="flex justify-center mb-12">
        <p className="w-[680px] text-center text-ink text-sm leading-5">
          Create your organization and pick the channels where you want your AI to show up. You can
          set up how it behaves on each one later, in <span className="underline">Configuration</span>.
        </p>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[minmax(200px,1fr)_minmax(300px,2fr)_minmax(120px,auto)_40px] gap-4 px-3 mb-3">
        <span className="font-semibold text-ink text-sm leading-5">Name</span>
        <span className="font-semibold text-ink text-sm leading-5">Channels</span>
        <span className="font-semibold text-ink text-sm leading-5">Resolution rate</span>
        <span></span>
      </div>

      {/* Org Rows */}
      <div className="flex flex-col gap-3">
        {orgs.map((org) => (
          <OrgRow key={org.id} org={org} />
        ))}
      </div>
    </div>
  )
}
