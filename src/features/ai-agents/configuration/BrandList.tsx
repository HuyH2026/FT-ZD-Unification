// Left column of the Configuration screen: a "Create new" button (inert) and a
// selectable list of brands. Presentational — selection state lives in the view.
import { type Brand, BRAND_LIST_LABELS } from './config-data'

type BrandListProps = {
  brands: Brand[]
  selectedId: string
  onSelect: (id: string) => void
}

export function BrandList({ brands, selectedId, onSelect }: BrandListProps) {
  return (
    <div className="flex w-[180px] shrink-0 flex-col bg-white/80 pt-6 shadow-[1px_0_0_0_rgba(228,231,240,0.3)]">
      <div className="px-3 pb-6">
        <button
          type="button"
          className="w-full rounded-full border border-grey-500 px-3 py-2 text-[12px] font-semibold text-ink"
        >
          Create new
        </button>
      </div>
      <div className="flex flex-col">
        {brands.map((brand) => {
          const selected = brand.id === selectedId
          return (
            <button
              key={brand.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(brand.id)}
              className={`flex h-12 items-center gap-1.5 border-b border-[#f6f6f6] px-5 text-left text-[12px] text-ink ${selected ? 'bg-[#ebf5f7]' : ''}`}
            >
              <span className="h-4 w-[15px] shrink-0 rounded-[3px]" style={{ backgroundColor: brand.swatch }} />
              <span className="flex-1">{BRAND_LIST_LABELS[brand.id] ?? brand.name}</span>
              {selected ? <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
