import { channelMeta } from '@/lib/channel-meta'

export function ChannelChip({ label }: { label: string }) {
  const { display, color, Icon } = channelMeta(label)
  return (
    <div
      className="flex gap-1 h-5 items-center px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: `${color}22` }}
    >
      <Icon size={12} color={color} strokeWidth={2} />
      <span
        className="font-semibold text-xs tracking-tight leading-4 whitespace-nowrap"
        style={{ color }}
      >
        {display}
      </span>
    </div>
  )
}
