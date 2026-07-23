// Ticket Sources tab body: a ticket header (id link, channel chip, status,
// prev/next pager over detail.tickets), a 6-cell metrics grid, and the ticket
// detail thread (customer request + agent response). Pager wraps; presentational.
import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { channelMeta } from '@/lib/channel-meta'
import type { GeneratedAgentDetail } from './automation-data'

export function TicketSourcesTab({ detail }: { detail: GeneratedAgentDetail }) {
  const total = detail.tickets.length
  const [index, setIndex] = useState(0)
  const ticket = detail.tickets[index]
  const { display, color, Icon } = channelMeta(ticket.channel)
  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <div className="flex flex-col gap-6">
      {/* Ticket header row: id + status + pager */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px] text-black underline">Ticket ID: {ticket.id}</span>
          <ExternalLink size={16} className="text-black" aria-hidden />
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#fceae7] px-2 py-0.5 text-[12px] font-semibold text-[#e53112]">
            {ticket.status}
          </span>
          <div className="flex items-center gap-1 text-[12px] text-ink-muted">
            <button type="button" aria-label="Previous ticket" onClick={prev} className="p-1.5">
              <ChevronLeft size={16} aria-hidden />
            </button>
            <span>
              {index + 1} of {total}
            </span>
            <button type="button" aria-label="Next ticket" onClick={next} className="p-1.5">
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Meta line */}
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium text-[#727583]">
          Date created: <span className="text-black">{ticket.dateCreated}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#727583]">Channel:</span>
          <span
            className="flex items-center gap-1 rounded-full bg-[#eaf4fe] px-2 py-0.5 text-[12px] font-semibold"
            style={{ color }}
          >
            <Icon size={12} aria-hidden />
            {display}
          </span>
        </div>
      </div>

      {/* Metrics grid (6 cells) */}
      <div className="grid grid-cols-3 overflow-hidden rounded-[20px] border border-[#e4e7f0]">
        {ticket.metrics.map((m) => (
          <div key={m.label} className="border-b border-r border-[#e4e7f0] p-4">
            <p className="text-[12px] text-[#545767]">{m.label}</p>
            <p className="pt-2 text-[14px] text-black">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Ticket details */}
      <section className="flex flex-col gap-4">
        <p className="text-[12px] font-semibold text-black">Ticket details</p>
        <div className="flex flex-col gap-4 rounded-2xl bg-[#f9f8f7] p-4">
          <div className="flex items-center justify-between rounded-xl border border-[#e4e7f0] bg-white/70 px-4 py-2">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-black">
              <ArrowLeft size={16} aria-hidden />
              Customer request
            </span>
            <span className="text-[12px] text-[#727583]">{ticket.customerRequest.timestamp}</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium text-[#727583]">Subject:</p>
            <p className="text-[14px] text-black">{ticket.subject}</p>
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-5 text-black">
            {ticket.customerRequest.body}
          </p>
          <div className="flex items-center justify-between rounded-xl border border-[#e4e7f0] bg-white/70 px-4 py-2">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-black">
              <ArrowRight size={16} aria-hidden />
              Agent response
            </span>
            <span className="text-[12px] text-[#727583]">{ticket.agentResponse.timestamp}</span>
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-5 text-black">
            {ticket.agentResponse.body}
          </p>
        </div>
      </section>
    </div>
  )
}
