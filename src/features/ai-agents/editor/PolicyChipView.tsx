// One inline entity chip in the policy prose. Read-only token (not
// reconfigurable) with a hover delete control.
import { X } from 'lucide-react'
import type { PolicyChip } from '../agent-store'
import { CHIP_STYLE, CHIP_ICON } from './editor-data'

export function PolicyChipView({ chip, onRemove }: { chip: PolicyChip; onRemove: (id: string) => void }) {
  const style = CHIP_STYLE[chip.variant]
  const Icon = CHIP_ICON[chip.variant]
  return (
    <span
      className="mx-0.5 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 align-middle text-[14px]"
      style={{ color: style.text, borderColor: style.border, backgroundColor: style.bg }}
    >
      <Icon size={14} aria-hidden />
      {chip.label}
      <button
        type="button"
        aria-label={`Remove ${chip.label}`}
        onClick={() => onRemove(chip.id)}
        className="opacity-60 hover:opacity-100"
        style={{ color: style.text }}
      >
        <X size={12} aria-hidden />
      </button>
    </span>
  )
}
