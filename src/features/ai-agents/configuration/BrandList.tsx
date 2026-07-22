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
    <div className="flex w-[180px] shrink-0 flex-col gap-2">
      <button
        type="button"
        className="rounded-full border border-surface-border px-4 py-2 text-[14px] text-ink"
      >
        Create new
      </button>
      {brands.map((brand) => {
        const selected = brand.id === selectedId
        return (
          <button
            key={brand.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(brand.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] text-ink ${selected ? 'bg-app-backdrop' : ''}`}
          >
            <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: brand.swatch }} />
            <span className="flex-1">{BRAND_LIST_LABELS[brand.id] ?? brand.name}</span>
            {selected ? <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" /> : null}
          </button>
        )
      })}
    </div>
  )
}
