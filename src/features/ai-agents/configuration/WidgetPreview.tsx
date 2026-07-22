// Center column: a static mock of the live chat widget. Only the header brand
// name is dynamic; the conversation is illustrative (no backend).
import { Rocket } from 'lucide-react'

export function WidgetPreview({ brandName }: { brandName: string }) {
  return (
    <div className="flex flex-1 items-start justify-center">
      <div className="flex w-[320px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_30px_0_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="flex items-center gap-2 bg-[#1b1b1b] px-4 py-4 text-white">
          <Rocket className="h-4 w-4" />
          <span className="text-[15px] font-medium">{brandName}</span>
        </div>
        {/* Body */}
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-[13px] italic text-accent-blue">
            Personalize your chat by using the menu on the right
          </p>
          <p className="max-w-[85%] self-start rounded-2xl bg-app-backdrop px-3 py-2 text-[13px] text-ink">
            Bonjour, Hola, Hello and welcome! How can I help make your day awesome? What can I do to assist you today?
          </p>
          <p className="max-w-[85%] self-end rounded-2xl bg-[#1b1b1b] px-3 py-2 text-[13px] text-white">
            I have some issues with my account
          </p>
        </div>
        {/* Composer */}
        <div className="mx-4 mb-3 rounded-full border border-surface-border px-4 py-2 text-[13px] text-ink-muted">
          Ask a question…
        </div>
        {/* Footer */}
        <div className="flex items-center justify-center gap-1 border-t border-surface-border py-2 text-[12px] text-ink-muted">
          Built with Zendesk
        </div>
      </div>
    </div>
  )
}
