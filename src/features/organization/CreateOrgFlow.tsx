import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useOrgs } from '@/app/org-context'
import { CHANNEL_META } from '@/lib/channel-meta'

export function CreateOrgFlow() {
  const navigate = useNavigate()
  const { addOrg } = useOrgs()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const count = selected.size
  const hasSelection = count > 0
  const canSave = hasSelection && name.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    addOrg(name.trim(), Array.from(selected))
    navigate('/organization')
  }

  const handleClose = () => {
    navigate('/organization')
  }

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <div className="h-full overflow-y-auto bg-app-backdrop">
      <div className="mx-auto max-w-5xl pt-6 pb-10">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 h-[73px] w-full bg-white rounded-t-[20px] shadow-sm mb-6">
          <p className="absolute left-6 top-1/2 -translate-y-1/2 font-semibold text-ink text-[22px] leading-7 whitespace-nowrap">
            Organization Setup
          </p>

          {/* Selected channels count */}
          {hasSelection && (
            <p className="absolute right-60 top-1/2 -translate-y-1/2 font-semibold text-ink text-sm leading-5">
              <span>{count} </span>
              <span className="font-normal text-ink-muted">
                {count === 1 ? 'channel selected' : 'channels selected'}
              </span>
            </p>
          )}

          {/* Close / Save */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2.5 items-center">
            <button
              onClick={handleClose}
              className="h-10 px-4 py-2.5 rounded-full border border-surface-border flex items-center justify-center cursor-pointer outline-none"
            >
              <span className="font-semibold text-ink text-sm leading-5">Close</span>
            </button>
            <button
              disabled={!canSave}
              onClick={handleSave}
              className="h-10 px-4 py-2.5 rounded-full flex items-center justify-center outline-none transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: canSave ? '#2f3130' : 'rgba(100,104,100,0.08)',
                color: canSave ? '#ffffff' : '#8b8e89',
              }}
            >
              <span className="font-semibold text-sm leading-5">Save</span>
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="bg-white rounded-b-[20px] p-8 space-y-8">
          {/* Organization name input */}
          <div>
            <label htmlFor="org-name" className="block mb-2 font-semibold text-ink text-sm">
              Organization name
            </label>
            <input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give your AI Org a name"
              className="w-full h-[42px] px-3 bg-white rounded-lg border border-surface-border outline-none focus:border-ink text-ink text-sm placeholder:text-ink-muted"
            />
          </div>

          {/* Channel selection */}
          <div>
            <p className="mb-4 font-semibold text-ink text-sm">Select channels</p>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(CHANNEL_META).map(([label, { display, color, Icon }]) => {
                const isSelected = selected.has(label)
                return (
                  <button
                    key={label}
                    onClick={() => toggle(label)}
                    className="h-[120px] rounded-xl border-2 transition-all cursor-pointer outline-none flex flex-col items-center justify-center gap-2"
                    style={{
                      borderColor: isSelected ? color : '#d8dcde',
                      backgroundColor: isSelected ? `${color}11` : 'white',
                    }}
                  >
                    <Icon size={32} color={color} strokeWidth={2} />
                    <span className="font-semibold text-sm" style={{ color }}>
                      {display}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
