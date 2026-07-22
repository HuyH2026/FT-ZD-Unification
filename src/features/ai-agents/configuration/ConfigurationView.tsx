// AI Agents → Configuration (Widget). A widget-branding studio: a sticky top
// strip (title, channel tabs, Preview/Publish) over a 3-column body — brand
// list, live widget preview, and the Branded-widget config panel. Only the
// Widget tab is built; other tabs show a coming-soon body. All state is local
// and mocked (no backend).
import { useState } from 'react'
import { GardenIcon, type GardenIconName } from '@/components/garden-icon'
import { CHANNEL_TABS, SEED_BRANDS, BRAND_LIST_LABELS, summarizeTags, type Brand, type ChannelTab, type Personality } from './config-data'
import { BrandList } from './BrandList'
import { WidgetPreview } from './WidgetPreview'
import { BrandedWidgetPanel } from './BrandedWidgetPanel'
import { AiPersonalityPanel } from './AiPersonalityPanel'

const TAB_ICON: Record<ChannelTab['id'], GardenIconName> = {
  widget: 'speech-bubble-stroke',
  voice: 'phone-stroke',
  webcall: 'mobile-phone-stroke',
  headless: 'markup-stroke',
}

export function ConfigurationView() {
  const [activeTab, setActiveTab] = useState<ChannelTab['id']>('widget')
  const [brands, setBrands] = useState<Brand[]>(SEED_BRANDS)
  const [selectedId, setSelectedId] = useState('vip')
  const [activeSection, setActiveSection] = useState('brands')

  const selected = brands.find((b) => b.id === selectedId)!
  const updateSelected = (patch: Partial<Brand>) =>
    setBrands((bs) => bs.map((b) => (b.id === selectedId ? { ...b, ...patch } : b)))
  const updatePersonality = (patch: Partial<Personality>) =>
    setBrands((bs) => bs.map((b) => (b.id === selectedId ? { ...b, personality: { ...b.personality, ...patch } } : b)))

  return (
    <div data-testid="view-configuration" className="flex h-full flex-col bg-[#f9f8f7]">
      {/* Sticky top strip */}
      <div className="sticky top-0 z-10 flex items-center bg-white px-8 pb-4 pt-6">
        <h1 className="text-[20px] font-semibold text-ink">Configuration</h1>
        <div className="mx-auto flex w-[518px] items-center gap-px rounded-full bg-[#fbfbfb] p-px">
          {CHANNEL_TABS.map((tab) => {
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-[14px] ${active ? 'border border-[#e8e9eb] bg-white text-black shadow-[0px_2px_6px_0px_rgba(3,17,38,0.11)]' : 'text-[#545767]'}`}
              >
                <GardenIcon name={TAB_ICON[tab.id]} className="h-4 w-4" style={{ color: tab.color }} />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="text-[14px] text-ink-muted">Preview</button>
          <button type="button" className="rounded-full bg-ink px-4 py-1.5 text-[14px] font-medium text-white">Publish</button>
        </div>
      </div>

      {/* Body */}
      {activeTab === 'widget' ? (
        <div className="flex flex-1 overflow-hidden">
          <BrandList brands={brands} selectedId={selectedId} onSelect={setSelectedId} />
          <div className="flex flex-1 justify-center overflow-y-auto px-6 py-8">
            <WidgetPreview
              brandName={selected.name}
              brandLabel={BRAND_LIST_LABELS[selected.id] ?? selected.name}
              tagSummary={summarizeTags(selected.tags)}
            />
          </div>
          <div className="flex shrink-0 py-2 pr-2">
            {activeSection === 'sentiment' ? (
              <AiPersonalityPanel
                brand={selected}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                onPersonalityChange={updatePersonality}
              />
            ) : (
              <BrandedWidgetPanel
                brand={selected}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                onNameChange={(name) => updateSelected({ name })}
                onToggleEnabled={() => updateSelected({ enabled: !selected.enabled })}
                onToggleDefault={() => updateSelected({ isDefault: !selected.isDefault })}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-ink-muted">
          <div className="text-xl font-medium text-ink">{CHANNEL_TABS.find((t) => t.id === activeTab)?.label}</div>
          <div className="mt-2 text-sm opacity-70">Coming soon</div>
        </div>
      )}
    </div>
  )
}
