import { useNavigate } from 'react-router'
import { ChevronDown, Building2 } from 'lucide-react'
import { useOrgs } from '@/app/org-context'
import { useHoverIntent } from './useHoverIntent'
import { useState } from 'react'

export function OrgSwitcher() {
  const { orgs, currentOrg, setCurrentOrg } = useOrgs()
  const navigate = useNavigate()
  const [clickOpen, setClickOpen] = useState(false)
  const { activeKey, open, scheduleClose } = useHoverIntent()

  const isOpen = clickOpen || activeKey === 'org-menu'

  const handleSelectOrg = (orgName: string) => {
    setCurrentOrg(orgName)
    setClickOpen(false)
  }

  const handleAddOrg = () => {
    navigate('/organization/new')
    setClickOpen(false)
  }

  return (
    <div className="relative">
      {/* Current org display */}
      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
        <Building2 size={16} className="text-ink" />
        <span className="font-semibold text-ink text-[14px] tracking-[-0.154px] leading-[20px]">
          {currentOrg}
        </span>
        <ChevronDown size={16} className="text-ink" />
      </div>

      {/* Hover/click trigger */}
      <button
        aria-label="Switch organization"
        className="absolute inset-0 cursor-pointer rounded-lg outline-none transition-colors hover:bg-[rgba(92,105,112,0.08)]"
        onMouseEnter={() => open('org-menu')}
        onMouseLeave={scheduleClose}
        onClick={() => setClickOpen((v) => !v)}
      />

      {/* Dropdown menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-[200px] bg-white rounded-[4px] py-1 px-px z-[58] drop-shadow-[0px_16px_12px_rgba(10,13,14,0.16)]"
          onMouseEnter={() => open('org-menu')}
          onMouseLeave={scheduleClose}
        >
          <div aria-hidden className="absolute border border-surface-border border-solid inset-0 pointer-events-none rounded-[4px]" />

          {/* Header label */}
          <div className="flex gap-2 items-start pl-3 pr-9 py-2 w-full">
            <div className="h-[20px] w-[16px] shrink-0" />
            <div className="font-semibold text-nav-active text-[14px] tracking-[-0.154px] leading-[20px]">
              Organization
            </div>
          </div>

          {/* Selectable orgs */}
          {orgs.map((org) => (
            <button
              key={org.id}
              role="menuitem"
              aria-label={org.name}
              onClick={() => handleSelectOrg(org.name)}
              className="flex gap-2 items-start pl-3 pr-9 py-2 w-full text-left rounded-[4px] transition-colors hover:bg-[#f5f6f7] cursor-pointer outline-none"
            >
              <div className="h-[20px] w-[16px] flex items-center justify-center py-0.5 shrink-0">
                {currentOrg === org.name && (
                  <div className="relative size-[16px]">
                    <svg className="size-full" fill="none" viewBox="0 0 15 11">
                      <path
                        clipRule="evenodd"
                        d="M14.707 1.707a1 1 0 0 0-1.414-1.414L5 8.586 1.707 5.293A1 1 0 0 0 .293 6.707l4 4a1 1 0 0 0 1.414 0l9-9Z"
                        fill="#1F73B7"
                        fillRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-nav-active text-[14px] tracking-[-0.154px] leading-[20px]">
                {org.name}
              </div>
            </button>
          ))}

          {/* Divider */}
          <div className="py-1 w-full">
            <div className="bg-[#e8eaec] h-px w-full" />
          </div>

          {/* Add organization */}
          <button
            role="menuitem"
            aria-label="Add organization"
            onClick={handleAddOrg}
            className="flex gap-2 items-start pl-3 pr-9 py-2 w-full text-left rounded-[4px] transition-colors hover:bg-[#f5f6f7] cursor-pointer outline-none"
          >
            <div className="h-[20px] flex items-center justify-center py-0.5 shrink-0">
              <div className="relative size-[16px]">
                <svg className="size-full" fill="none" viewBox="0 0 13 13">
                  <path
                    d="M6.5 0a1 1 0 0 1 1 1v4.5H12a1 1 0 1 1 0 2H7.5V12a1 1 0 1 1-2 0V7.5H1a1 1 0 1 1 0-2h4.5V1a1 1 0 0 1 1-1Z"
                    fill="#1F73B7"
                  />
                </svg>
              </div>
            </div>
            <div className="text-accent-blue text-[14px] tracking-[-0.154px] leading-[20px]">
              Add organization
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
