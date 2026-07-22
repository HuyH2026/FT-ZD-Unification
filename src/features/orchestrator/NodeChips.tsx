// A rounded pill naming an automation's primary node, with a small kind-colored
// icon and a "+N" suffix for the remaining nodes. Presentational.
import { Activity, Zap, Star } from 'lucide-react'
import { type NodeKind } from './orchestrator-data'

const KIND: Record<NodeKind, { icon: typeof Activity; color: string }> = {
  sentiment: { icon: Activity, color: '#8b5cf6' },
  event: { icon: Zap, color: '#2563eb' },
  csat: { icon: Star, color: '#e0699a' },
}

export function NodeChips({ label, kind, extra }: { label: string; kind: NodeKind; extra: number }) {
  const { icon: Icon, color } = KIND[kind]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-2.5 py-1 text-[12px] text-ink-muted">
      <Icon size={12} aria-hidden style={{ color }} />
      {label}
      {extra > 0 && <span className="text-ink-muted">+{extra}</span>}
    </span>
  )
}
