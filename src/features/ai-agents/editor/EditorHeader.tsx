// Sticky editor header: back, editable title + version chip, centered channel
// tabs, and inert Preview/Versions/Publish actions.
import { useState } from 'react'
import { ArrowLeft, MoreVertical, MessageSquare, Phone, Globe, Code2 } from 'lucide-react'
import type { ChannelKey } from '../agent-builder-data'

const CHANNELS: { key: ChannelKey; label: string; Icon: typeof MessageSquare }[] = [
  { key: 'widget', label: 'Widget', Icon: MessageSquare },
  { key: 'voice', label: 'Voice', Icon: Phone },
  { key: 'webcall', label: 'Web Call', Icon: Globe },
  { key: 'headless', label: 'Headless', Icon: Code2 },
]

export function EditorHeader({
  title, version, channel, onChannelChange, onBack, onTitleChange,
}: {
  title: string
  version: string
  channel: ChannelKey
  onChannelChange: (c: ChannelKey) => void
  onBack: () => void
  onTitleChange: (t: string) => void
}) {
  const [localTitle, setLocalTitle] = useState(title)

  const commit = () => {
    if (localTitle !== title) {
      onTitleChange(localTitle)
    }
  }

  return (
    <div className="flex items-center gap-4 border-b border-surface-border bg-white px-8 py-4">
      <button type="button" aria-label="Back to agents" onClick={onBack} className="text-ink">
        <ArrowLeft size={20} aria-hidden />
      </button>
      <input
        aria-label="Agent title"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
        className="min-w-0 max-w-[240px] bg-transparent text-[20px] font-medium text-ink outline-none"
      />
      <span className="rounded-md bg-[#f4f3f1] px-2 py-0.5 text-[12px] text-ink-muted">{version}</span>
      <button type="button" aria-label="More actions" className="text-ink-muted"><MoreVertical size={18} aria-hidden /></button>

      <div role="tablist" aria-label="Channel" className="mx-auto flex items-center gap-1 rounded-full bg-[#f4f3f1] p-1">
        {CHANNELS.map(({ key, label, Icon }) => {
          const active = key === channel
          return (
            <button
              key={key} type="button" role="tab" aria-selected={active}
              onClick={() => onChannelChange(key)}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium"
              style={{ backgroundColor: active ? '#fff' : 'transparent', color: active ? '#2f3130' : '#8b8e89', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
            >
              <Icon size={14} aria-hidden /> {label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="text-[14px] text-ink-muted">Preview</button>
        <button type="button" className="rounded-full border border-surface-border px-4 py-1.5 text-[13px] font-medium text-ink">Versions</button>
        <button type="button" className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-semibold text-white">Publish</button>
      </div>
    </div>
  )
}
