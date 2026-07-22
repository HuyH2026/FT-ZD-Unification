// src/features/ai-agents/configuration/BrandedWidgetPanel.tsx
// Right column: the "Branded widget" config form plus a far-right icon rail of
// customization sections. Presentational — all edits bubble up via handlers.
// Only the 'brands' rail section has designed content; other sections highlight
// on click but keep this same panel (deferred).
import { GardenIcon } from '@/components/garden-icon'
import { type Brand } from './config-data'
import { SectionRail } from './SectionRail'

type BrandedWidgetPanelProps = {
  brand: Brand
  activeSection: string
  onSectionChange: (id: string) => void
  onNameChange: (name: string) => void
  onToggleEnabled: () => void
  onToggleDefault: () => void
}

export function BrandedWidgetPanel({
  brand,
  activeSection,
  onSectionChange,
  onNameChange,
  onToggleEnabled,
  onToggleDefault,
}: BrandedWidgetPanelProps) {
  return (
    <div className="flex h-full w-[484px] shrink-0 overflow-hidden rounded-[24px] border border-white/80 bg-white/70 shadow-[0_0_30px_0_rgba(0,0,0,0.08)] backdrop-blur-[50px]">
      {/* Config form */}
      <div className="flex-1 overflow-y-auto pb-8 pl-10 pr-9 pt-6">
        <h2 className="text-[18px] tracking-[-0.45px] text-black">Branded widget</h2>
        <p className="mt-4 text-[14px] leading-5 text-grey-800">
          This section lets you create unique widget designs for different <span className="font-semibold">brands</span>, giving each a{' '}
          <span className="font-semibold">personalized look</span>. You can control which users see a widget by applying tags, so only those in the{' '}
          <span className="font-semibold">tagged brands</span> will see it. This ensures targeted visibility and a tailored experience for your audience.
        </p>

        {/* Brand name */}
        <div className="mt-6">
          <p className="text-[14px] font-semibold text-black">Brand name</p>
          <p className="mt-1 text-[12px] text-[#727583]">The name serves as a label for accessing and filtering workflows and insights.</p>
          <input
            type="text"
            aria-label="Brand name"
            value={brand.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-grey-400 bg-white px-3 py-2.5 text-[14px] text-ink"
          />
          <p className="mt-1 text-[12px] text-grey-500">Keep it under 50 characters</p>
        </div>

        {/* Tags */}
        <div className="mt-6">
          <p className="text-[14px] font-semibold text-black">Tags</p>
          <p className="mt-1 text-[12px] text-[#727583]">
            Tag this brand to associate it with specific segments. Editing and managing tags can be done within{' '}
            <span className="text-blue-700">Global Tags.</span>
          </p>
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-grey-400 bg-white p-2.5">
            {brand.tags.length > 0 ? (
              <div className="flex flex-1 flex-wrap gap-2">
                {brand.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-md border border-[#d2d9e5] bg-[#f2f4f7] px-2.5 py-1 text-[12px] text-black">
                    <GardenIcon name="tag-stroke" className="h-3.5 w-3.5 text-accent-blue" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="flex-1 py-1 text-[14px] text-[#9194a0]">Assign tags</span>
            )}
            <GardenIcon name="chevron-down-stroke" className="mt-1 h-4 w-4 text-ink-muted" />
          </div>
        </div>

        {/* Set as Default */}
        <div className="mt-6">
          <label className="flex items-center gap-2 text-[14px] text-ink">
            <input type="checkbox" checked={brand.isDefault} onChange={onToggleDefault} />
            Set as Default
          </label>
          <p className="mt-1 text-[12px] text-[#727583]">
            Enable this brand by default if no specific tags are assigned or found in the{' '}
            <span className="text-blue-700">embedded script</span>.
          </p>
        </div>

        {/* Widget enabled toggle */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={brand.enabled}
              aria-label="Widget enabled for this brand"
              onClick={onToggleEnabled}
              className={`relative h-5 w-10 rounded-full transition-colors ${brand.enabled ? 'bg-[#048c80]' : 'bg-surface-border'}`}
            >
              <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${brand.enabled ? 'left-[23px]' : 'left-1'}`} />
            </button>
            <span className="text-[14px] text-ink">Widget enabled for this brand</span>
          </div>
          <p className="mt-1 text-[12px] text-[#727583]">When off, the widget will not appear for users of this brand.</p>
        </div>
      </div>

      {/* Icon rail */}
      <SectionRail activeSection={activeSection} onSectionChange={onSectionChange} />
    </div>
  )
}
