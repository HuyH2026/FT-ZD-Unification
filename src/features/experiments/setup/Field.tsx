// Shared presentational form primitives for the A/B Test Setup screen.
// TextField/TextArea are controlled; SelectField is a static dropdown-styled
// div (no menu — consistent with the mock).
import { ChevronDown } from 'lucide-react'

const LABEL = 'block text-[12px] font-medium text-ink'
const BOX = 'w-full rounded-[20px] border border-[#bcbdc5] bg-white px-3.5 py-2 text-[14px] text-ink outline-none placeholder:text-ink-muted'

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input
        className={`mt-1.5 ${BOX}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <textarea
        className={`mt-1.5 min-h-[88px] resize-none ${BOX}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function SelectField({
  label,
  value,
  muted = false,
}: {
  label?: string
  value: string
  muted?: boolean
}) {
  return (
    <label className="block">
      {label && <span className={LABEL}>{label}</span>}
      <div
        className={`${label ? 'mt-1.5 ' : ''}flex items-center justify-between rounded-[20px] border border-[#bcbdc5] bg-white px-3.5 py-2 text-[14px]`}
      >
        <span className={muted ? 'text-ink-muted' : 'text-ink'}>{value}</span>
        <ChevronDown size={16} className="text-ink-muted" aria-hidden />
      </div>
    </label>
  )
}
