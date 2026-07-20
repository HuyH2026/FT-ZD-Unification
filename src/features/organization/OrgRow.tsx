import type { Org } from '@/types'
import { ChannelChip } from './ChannelChip'

export function OrgRow({ org }: { org: Org }) {
  const visible = org.channels.slice(0, 3)
  const overflow = org.channels.length - visible.length
  const initial = org.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="bg-white h-[72px] rounded-2xl border border-surface-border grid grid-cols-[minmax(200px,1fr)_minmax(300px,2fr)_minmax(120px,auto)_40px] gap-4 items-center px-3">
      {/* Name + Avatar */}
      <div className="flex gap-2 items-center">
        <div className="size-8 rounded-full bg-ink flex items-center justify-center shrink-0">
          <span className="font-semibold text-white text-sm">{initial}</span>
        </div>
        <p className="font-medium text-ink text-base leading-7 whitespace-nowrap">{org.name}</p>
      </div>

      {/* Channels */}
      <div className="flex gap-1.5 items-center">
        {visible.map((c) => (
          <ChannelChip key={c} label={c} />
        ))}
        {overflow > 0 && (
          <span className="text-ink text-sm leading-5 whitespace-nowrap">+{overflow}</span>
        )}
      </div>

      {/* Resolution rate */}
      <p className="text-ink-muted text-sm leading-5 whitespace-nowrap">n/a</p>

      {/* Overflow menu */}
      <div className="text-ink-muted text-xl leading-5 text-center">⋮</div>
    </div>
  )
}
