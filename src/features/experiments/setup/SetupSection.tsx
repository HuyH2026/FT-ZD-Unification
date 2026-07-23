// A collapsible section for the A/B Test Setup form: icon + title + subtitle
// with a chevron toggle. Local open state; open by default.
import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function SetupSection({
  icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="py-6">
      <button
        type="button"
        aria-expanded={open}
        aria-label={title}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left outline-none"
      >
        <span className="flex size-[18px] items-center justify-center text-ink">{icon}</span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold text-ink">{title}</span>
          <span className="block text-[12px] text-ink-muted">{subtitle}</span>
        </span>
        <ChevronDown
          size={20}
          className={`text-ink-muted transition-transform ${open ? '' : '-rotate-90'}`}
          aria-hidden
        />
      </button>
      {open && <div className="mt-4 flex flex-col gap-4">{children}</div>}
    </section>
  )
}
