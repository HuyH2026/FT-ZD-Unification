// Center column: a filter summary row (which brand + tag scope this preview
// reflects) above a static mock of the live chat widget. Only the header brand
// name is dynamic; the conversation is illustrative (no backend).
import { GardenIcon } from '@/components/garden-icon'

type WidgetPreviewProps = {
  brandName: string
  brandLabel: string
  tagSummary: string
}

export function WidgetPreview({ brandName, brandLabel, tagSummary }: WidgetPreviewProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-6">
      {/* Filter summary row */}
      {tagSummary ? (
        <div className="flex items-center gap-1.5 text-[14px]">
          <p className="font-semibold text-ink">
            {`'${brandLabel}' `}
            <span className="font-semibold text-[#9194a0]">for</span>
          </p>
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-[3px] text-[12px] text-ink">
            <GardenIcon name="tag-stroke" className="h-4 w-4 text-accent-blue" />
            {tagSummary}
          </span>
        </div>
      ) : null}

      <div className="flex h-[640px] w-[382px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_11px_46px_0_rgba(0,0,0,0.05)]">
        {/* Header */}
        <div className="flex items-center gap-2 bg-black px-4 py-4 text-white">
          <GardenIcon name="rocket-stroke" className="h-4 w-4" />
          <span className="text-[15px] font-medium">{brandName}</span>
        </div>
        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 px-4 py-4">
          <p className="text-center text-[13px] italic text-accent-blue">
            Personalize your chat by using the menu on the right
          </p>
          <div className="mt-6 flex max-w-[85%] items-end gap-2 self-start">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app-backdrop text-ink-muted">
              <GardenIcon name="user-solo-stroke" className="h-4 w-4" />
            </span>
            <p className="rounded-2xl bg-app-backdrop px-3 py-2 text-[13px] text-ink">
              Bonjour, Hola, Hello and welcome! How can I help make your day awesome? What can I do to assist you today?
            </p>
          </div>
          <p className="max-w-[85%] self-end rounded-2xl bg-black px-3 py-2 text-[13px] text-white">
            I have some issues with my account
          </p>
        </div>
        {/* Composer */}
        <div className="mx-4 mb-3 rounded-full border border-surface-border px-4 py-2 text-[13px] text-ink-muted">
          Ask a question…
        </div>
        {/* Footer */}
        <div className="flex items-center justify-center gap-1 py-2 text-[12px] text-ink-muted">
          Built with Zendesk
        </div>
      </div>
    </div>
  )
}
