// The far-right 64px icon rail shared by every Configuration → Widget panel.
// Each button selects a customization section; the rail is what swaps the panel
// body, so both BrandedWidgetPanel and AiPersonalityPanel render this same rail.
import { GardenIcon } from '@/components/garden-icon'
import { RAIL_SECTIONS, RAIL_TRAILING_START } from './config-data'

type SectionRailProps = {
  activeSection: string
  onSectionChange: (id: string) => void
}

export function SectionRail({ activeSection, onSectionChange }: SectionRailProps) {
  return (
    <div className="flex w-[64px] shrink-0 flex-col items-center gap-2 border-l border-[#eaeaea] px-2 py-5">
      {RAIL_SECTIONS.map((section) => {
        const active = section.id === activeSection
        return (
          <div key={section.id} className="contents">
            {section.id === RAIL_TRAILING_START ? <span className="my-1 w-[30px] border-t border-[#e4e7f0]" /> : null}
            <button
              type="button"
              aria-label={section.label}
              onClick={() => onSectionChange(section.id)}
              className={`flex size-8 items-center justify-center rounded-lg ${active ? 'bg-[#ebf5f7] text-[#193d50]' : 'text-ink-muted'}`}
            >
              <GardenIcon name={section.icon} className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
