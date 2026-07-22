// Right column (Sentiment section): the "AI Personality" config form beside the
// shared icon rail. Presentational — every edit bubbles up via onPersonalityChange.
// Values are per-brand (brand.personality). Frontend-only, no backend.
import { GardenIcon } from '@/components/garden-icon'
import { AI_PERSONALITY_COPY, TONE_PRESET_OPTIONS, type Brand, type Personality } from './config-data'
import { SectionRail } from './SectionRail'

type AiPersonalityPanelProps = {
  brand: Brand
  activeSection: string
  onSectionChange: (id: string) => void
  onPersonalityChange: (patch: Partial<Personality>) => void
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-1.5">
      <p className="text-[14px] font-semibold text-black">{label}</p>
      <GardenIcon name="info-stroke" className="h-4 w-4 text-ink-muted" />
    </div>
  )
}

export function AiPersonalityPanel({
  brand,
  activeSection,
  onSectionChange,
  onPersonalityChange,
}: AiPersonalityPanelProps) {
  const p = brand.personality
  const c = AI_PERSONALITY_COPY

  const togglePreset = (preset: string) => {
    const next = p.tonePresets.includes(preset)
      ? p.tonePresets.filter((t) => t !== preset)
      : [...p.tonePresets, preset]
    onPersonalityChange({ tonePresets: next })
  }

  const textareaClass =
    'mt-2 w-full rounded-lg border border-grey-400 bg-white px-4 py-2.5 text-[14px] leading-5 text-ink placeholder:text-[#9194a0]'

  return (
    <div className="flex h-full w-[484px] shrink-0 overflow-hidden rounded-[24px] border border-white/80 bg-white/70 shadow-[0_0_30px_0_rgba(0,0,0,0.08)] backdrop-blur-[50px]">
      {/* Config form */}
      <div className="flex-1 overflow-y-auto pb-8 pl-10 pr-9 pt-6">
        <h2 className="text-[18px] tracking-[-0.45px] text-black">AI Personality</h2>
        <p className="mt-4 text-[14px] leading-5 text-grey-800">{c.intro}</p>

        {/* General Context */}
        <div className="mt-6 border-t border-[#e4e7f0] pt-6">
          <SectionLabel label={c.generalContext.label} />
          <p className="mt-1 text-[12px] text-[#727583]">{c.generalContext.helper}</p>
          <textarea
            aria-label={c.generalContext.label}
            rows={4}
            value={p.generalContext}
            placeholder={c.generalContext.placeholder}
            onChange={(e) => onPersonalityChange({ generalContext: e.target.value })}
            className={textareaClass}
          />
          <p className="mt-1 text-[12px] text-grey-500">{c.generalContext.footnote}</p>
        </div>

        {/* Glossary */}
        <div className="mt-6 border-t border-[#e4e7f0] pt-6">
          <SectionLabel label={c.glossary.label} />
          <p className="mt-1 text-[12px] text-[#727583]">{c.glossary.helper}</p>
          <textarea
            aria-label={c.glossary.label}
            rows={4}
            value={p.glossary}
            placeholder={c.glossary.placeholder}
            onChange={(e) => onPersonalityChange({ glossary: e.target.value })}
            className={textareaClass}
          />
          <p className="mt-1 text-[12px] text-grey-500">{c.glossary.footnote}</p>
        </div>

        {/* Tone of Voice */}
        <div className="mt-6 border-t border-[#e4e7f0] pt-6">
          <SectionLabel label={c.tone.label} />
          <p className="mt-1 text-[12px] text-[#727583]">{c.tone.helper}</p>

          <label className="mt-3 flex items-center gap-2 text-[14px] text-ink">
            <input
              type="checkbox"
              checked={p.toneUseFreeform}
              onChange={() => onPersonalityChange({ toneUseFreeform: !p.toneUseFreeform })}
            />
            {c.tone.freeformCheckboxLabel}
          </label>
          <textarea
            aria-label={c.tone.label}
            rows={4}
            value={p.toneFreeform}
            placeholder={c.tone.placeholder}
            disabled={!p.toneUseFreeform}
            onChange={(e) => onPersonalityChange({ toneFreeform: e.target.value })}
            className={`${textareaClass} ${p.toneUseFreeform ? '' : 'opacity-50'}`}
          />
          <p className="mt-1 text-[12px] text-grey-500">{c.tone.footnote}</p>

          <label className="mt-4 flex items-center gap-2 text-[14px] text-ink">
            <input
              type="checkbox"
              checked={p.toneUsePresets}
              onChange={() => onPersonalityChange({ toneUsePresets: !p.toneUsePresets })}
            />
            {c.tone.presetsCheckboxLabel}
          </label>
          <div className={`mt-2 flex flex-wrap gap-2 ${p.toneUsePresets ? '' : 'opacity-50'}`}>
            {TONE_PRESET_OPTIONS.map((preset) => {
              const selected = p.tonePresets.includes(preset)
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={selected}
                  disabled={!p.toneUsePresets}
                  onClick={() => togglePreset(preset)}
                  className={`rounded-[20px] border bg-white px-4 py-1.5 text-[14px] text-[#545767] ${selected ? 'border-[#d2d3d8]' : 'border-[#e4e7f0]'}`}
                >
                  {preset}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Icon rail */}
      <SectionRail activeSection={activeSection} onSectionChange={onSectionChange} />
    </div>
  )
}
