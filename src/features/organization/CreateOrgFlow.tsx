import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { useOrgs } from '@/app/org-context'
import { CHANNEL_META, CHANNEL_SECTIONS } from '@/lib/channel-meta'

export function CreateOrgFlow() {
  const navigate = useNavigate()
  const { addOrg } = useOrgs()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [scrolled, setScrolled] = useState(false)

  const count = selected.size
  const hasSelection = count > 0
  const canSave = hasSelection && name.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    addOrg(name.trim(), Array.from(selected))
    navigate('/organization')
  }

  const handleClose = () => navigate('/organization')

  const toggleChannel = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const toggleSection = (title: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  return (
    <div
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 20)}
      className="h-screen overflow-y-auto bg-app-backdrop"
    >
      <div className="mx-auto max-w-[1080px] px-10 pt-3 pb-10">
        {/* Sticky header */}
        <div
          className={`sticky top-0 z-20 flex h-[73px] items-center justify-between rounded-t-[20px] bg-white px-6 transition-shadow duration-300 ${
            scrolled ? 'shadow-[0px_8px_16px_0px_rgba(10,13,14,0.06)]' : ''
          }`}
        >
          <p className="text-[22px] font-semibold leading-7 tracking-[0.352px] text-ink">
            Organization Setup
          </p>

          <div className="flex items-center gap-2.5">
            {hasSelection && (
              <p className="mr-4 text-sm font-semibold leading-5 text-ink">
                <span>{count} </span>
                <span className="font-normal text-ink-muted">
                  {count === 1 ? 'channel selected' : 'channels selected'}
                </span>
              </p>
            )}
            <button
              onClick={handleClose}
              className="flex h-10 items-center justify-center rounded-full border border-surface-border px-4 outline-none"
            >
              <span className="text-sm font-semibold leading-5 text-ink">Close</span>
            </button>
            <button
              disabled={!canSave}
              onClick={handleSave}
              className="flex h-10 items-center justify-center rounded-full px-4 outline-none transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: canSave ? '#2f3130' : 'rgba(100,104,100,0.08)',
                color: canSave ? '#ffffff' : '#8b8e89',
              }}
            >
              <span className="text-sm font-semibold leading-5">Save</span>
            </button>
          </div>
        </div>

        {/* Form body */}
        <div className="rounded-b-[20px] bg-white/80 px-10 pb-10 pt-8">
          {/* Company name */}
          <div className="mx-auto max-w-[680px]">
            <label
              htmlFor="org-name"
              className="block text-[22px] leading-7 tracking-[0.352px] text-ink"
            >
              Company name
            </label>
            <p className="mt-2 text-sm leading-5 text-ink-muted">
              Internal company name. This name is not visible to your customers.
            </p>
            <input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give your AI Org a name"
              className="mt-4 h-[42px] w-full rounded-lg border border-surface-border bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-ink"
            />
          </div>

          {/* Select channels */}
          <div className="mx-auto mt-12 max-w-[680px]">
            <p className="text-[22px] leading-7 tracking-[0.352px] text-ink">Select channels</p>
            <p className="mt-2 text-sm leading-5 text-ink-muted">
              Select the customer support channels to enable for your organization. You can always
              edit these later.
            </p>

            {CHANNEL_SECTIONS.map((section) => {
              const isCollapsed = collapsed.has(section.title)
              return (
                <div key={section.title} className="mt-8">
                  <button
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={!isCollapsed}
                    className="flex w-full items-center justify-between outline-none"
                  >
                    <span className="text-lg font-semibold leading-6 tracking-[-0.45px] text-ink">
                      {section.title}
                    </span>
                    <span className="flex size-10 items-center justify-center">
                      <ChevronDown
                        size={20}
                        className={`text-grey-700 transition-transform ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      {section.channels.map((label) => {
                        const { display, color, Icon } = CHANNEL_META[label]
                        const isSelected = selected.has(label)
                        return (
                          <button
                            key={label}
                            onClick={() => toggleChannel(label)}
                            aria-pressed={isSelected}
                            className="flex h-[120px] flex-col items-center justify-center gap-4 rounded-xl border border-grey-200 bg-white outline-none transition-shadow"
                            style={{
                              boxShadow: isSelected ? '0 0 0 2px #373a4d inset' : undefined,
                            }}
                          >
                            <span
                              className="flex size-11 items-center justify-center rounded-[22px]"
                              style={{ backgroundColor: color, opacity: 0.6 }}
                            >
                              <Icon size={22} className="text-white" strokeWidth={2} />
                            </span>
                            <span className="text-sm leading-5 tracking-[-0.154px] text-ink">
                              {display}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
