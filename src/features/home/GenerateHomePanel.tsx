import { useState } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import type { NewView } from './views-store'
import {
  generateLayout, ROLES, FOCUS_AREAS, DEFAULT_PM_LAYOUT, type Role, type FocusArea,
} from './generate-layout'

// Local palette to match the HomeScreen widget cards.
const INK = '#2f3130'
const INK_SOFT = '#2f3941'
const MUTED = '#8b8e89'
const BORDER = '#e2e0dd'
const PURPLE = '#724be8'

export function GenerateHomePanel({
  hasPreview, onGenerate, onApply, onDiscard, onClose,
}: {
  hasPreview: boolean
  onGenerate: (view: NewView) => void
  onApply: () => void
  onDiscard: () => void
  onClose: () => void
}) {
  const [role, setRole] = useState<Role | null>(null)
  const [focuses, setFocuses] = useState<FocusArea[]>([])
  const [prompt, setPrompt] = useState('')

  const canGenerate = role !== null && (role === 'pm' || focuses.length > 0)

  const toggleFocus = (key: FocusArea) =>
    setFocuses((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]))

  const handleGenerate = () => {
    if (!role) return
    if (role === 'pm') {
      onGenerate({ name: 'Product manager', kind: 'pm', role: 'pm', pmLayout: [...DEFAULT_PM_LAYOUT] })
      return
    }
    if (focuses.length === 0) return
    const label = ROLES.find((r) => r.key === role)?.label ?? 'Generated'
    onGenerate({ name: label, kind: 'grid', role, layout: generateLayout({ role, focuses, prompt }) })
  }

  return (
    <aside
      data-testid="generate-home-panel"
      className="flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border bg-white"
      style={{ borderColor: BORDER }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={16} color={PURPLE} />
          <span className="text-[15px] font-semibold" style={{ color: INK_SOFT }}>Generate a Home</span>
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded transition-colors hover:bg-[#f5f6f7]"
        >
          <X size={16} color={MUTED} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5">
        <p className="mt-4 text-[20px] leading-7 tracking-[0.2px]" style={{ color: INK }}>
          Let&apos;s design your Home 👋
        </p>
        <p className="mt-2 text-[13px] leading-[18px]" style={{ color: MUTED }}>
          Answer a couple of questions and I&apos;ll assemble the widgets that matter most to you.
        </p>

        {/* Q1 — Role */}
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          What&apos;s your role?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const active = role === r.key
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                aria-pressed={active}
                className="h-8 rounded-full border px-3 text-[13px] font-medium outline-none transition-colors"
                style={{
                  borderColor: active ? PURPLE : BORDER,
                  backgroundColor: active ? `${PURPLE}12` : 'white',
                  color: active ? PURPLE : INK,
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        {/* Q2 — Focus areas */}
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          What matters most right now?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FOCUS_AREAS.map((f) => {
            const active = focuses.includes(f.key)
            return (
              <button
                key={f.key}
                onClick={() => toggleFocus(f.key)}
                aria-pressed={active}
                className="flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-medium outline-none transition-colors"
                style={{
                  borderColor: active ? PURPLE : BORDER,
                  backgroundColor: active ? `${PURPLE}12` : 'white',
                  color: active ? PURPLE : INK,
                }}
              >
                {active && <Check size={12} color={PURPLE} />}
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Free text */}
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          Anything specific? (optional)
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. keep cost and quality front and center"
          className="mt-2 h-16 w-full resize-none rounded-xl border p-3 text-[13px] leading-[18px] outline-none"
          style={{ borderColor: BORDER, color: INK }}
        />
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-4" style={{ borderColor: BORDER }}>
        {hasPreview ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onApply}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full outline-none"
              style={{ backgroundColor: INK }}
            >
              <Check size={15} color="#fff" />
              <span className="text-[13px] font-semibold text-white">Apply</span>
            </button>
            <button
              onClick={handleGenerate}
              className="flex h-9 items-center rounded-full border bg-white px-3.5 outline-none"
              style={{ borderColor: BORDER }}
            >
              <span className="text-[13px] font-semibold" style={{ color: INK }}>Regenerate</span>
            </button>
            <button
              onClick={onDiscard}
              className="flex h-9 items-center rounded-full border bg-white px-3.5 outline-none"
              style={{ borderColor: BORDER }}
            >
              <span className="text-[13px] font-semibold" style={{ color: INK }}>Discard</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: PURPLE }}
          >
            <Sparkles size={15} color="#fff" />
            <span className="text-[13px] font-semibold text-white">Generate my Home</span>
          </button>
        )}
      </div>
    </aside>
  )
}
