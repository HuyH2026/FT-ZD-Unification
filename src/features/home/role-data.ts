// Deterministic, backend-free role tailoring. Given the shared platform mock and
// a role, returns a LevelData with the SAME numbers but the health metrics
// reordered and the AI summary reframed for that role. role === null (the
// built-in Default view) returns the base untouched. No LLM, no Date.now().
import type { LevelData } from './dashboard-data'
import type { Role, GridRole } from './generate-layout'

// Per-role ordering of the health metric tiles, by metric key. Any metric key
// not listed is appended in its original order, so adding metrics later is safe.
const METRIC_PRIORITY: Record<GridRole, string[]> = {
  ops: ['res', 'esc', 'aht', 'csat'],
  quality: ['esc', 'aht', 'csat', 'res'],
  knowledge: ['res', 'csat', 'esc', 'aht'],
  exec: ['csat', 'res', 'esc', 'aht'],
}

// One-line, role-framed read on agent health (mock copy).
const ROLE_SUMMARY: Record<GridRole, string> = {
  ops: 'Resolution is up and escalations are down — throughput is healthy. Voice handle time is the one area worth a look.',
  quality: 'Failure signals are low: escalations down 1.2% and handle time trending down. Voice flows carry the most test failures.',
  knowledge: 'Outcomes are strong and CSAT is climbing. Refund-eligibility gaps are still driving avoidable misses.',
  exec: 'Customer satisfaction and resolution are both trending up, and spend is on track against budget — no action needed.',
}

function reorderByKey<T extends { key: string }>(items: T[], order: string[]): T[] {
  const rank = new Map(order.map((k, i) => [k, i]))
  const orig = new Map(items.map((it, i) => [it.key, i]))
  return [...items].sort((a, b) => {
    const ra = rank.has(a.key) ? rank.get(a.key)! : order.length + orig.get(a.key)!
    const rb = rank.has(b.key) ? rank.get(b.key)! : order.length + orig.get(b.key)!
    return ra - rb
  })
}

export function deriveRoleData(base: LevelData, role: Role | null): LevelData {
  if (role === null || role === 'pm') return base
  return {
    ...base,
    metrics: reorderByKey(base.metrics, METRIC_PRIORITY[role]),
    aiSummary: ROLE_SUMMARY[role] ?? base.aiSummary,
  }
}
