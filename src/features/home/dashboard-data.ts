// Mock data + shared types for the Home dashboard. All values are illustrative
// (no backend in this foundation phase) and vary between the two "levels":
// Platform (all orgs) and Organization (a single org).

export type Level = 'platform' | 'organization'

export type HealthMetric = {
  key: string
  label: string
  value: string
  delta: string
  up: boolean
  good: boolean
}

export type LevelData = {
  score: number
  scoreLabel: string
  trend: number[]
  metrics: HealthMetric[]
  notifications: { id: string; kind: 'studio' | 'billing' | 'error'; title: string; body: string; time: string }[]
  approvals: { id: string; title: string; body: string; impact: string; author: string }[]
  gaps: { id: string; topic: string; misses: number; trend: 'up' | 'down' }[]
  qa: { id: string; suite: string; pass: number; fail: number }[]
  cost: { spend: number; limit: number; unit: string; note: string }
  activity: { id: string; text: string; time: string }[]
  intents: { id: string; name: string; share: number }[]
  policies: {
    summary: { improved: number; lift: string; period: string }
    items: { id: string; title: string; change: string; impact: string; status: 'applied' | 'proposed'; scope: string; time: string }[]
  }
}

export type WidgetId =
  | 'health' | 'qa' | 'gaps' | 'approvals' | 'notifications'
  | 'cost' | 'activity' | 'intents' | 'policies'

export type Layout = { left: WidgetId[]; right: WidgetId[] }
export type ColumnKey = keyof Layout

export const DEFAULT_LAYOUT: Layout = {
  left: ['health', 'policies', 'qa', 'gaps'],
  right: ['approvals', 'notifications'],
}

export const DATA: Record<Level, LevelData> = {
  platform: {
    score: 94,
    scoreLabel: 'Healthy',
    trend: [70, 74, 72, 80, 78, 86, 90, 88, 92, 94],
    metrics: [
      { key: 'res', label: 'Resolution rate', value: '82%', delta: '+3.1%', up: true, good: true },
      { key: 'csat', label: 'CSAT', value: '4.6', delta: '+0.2', up: true, good: true },
      { key: 'esc', label: 'Escalations', value: '6.4%', delta: '-1.2%', up: false, good: true },
      { key: 'aht', label: 'Avg handle time', value: '1m 48s', delta: '-9s', up: false, good: true },
    ],
    notifications: [
      { id: 'n1', kind: 'studio', title: 'Studio build is ready', body: 'Voice agent v12 finished training and is ready to deploy.', time: '12m ago' },
      { id: 'n2', kind: 'billing', title: 'Billing summary is ready', body: 'July invoice is available across 4 organizations.', time: '1h ago' },
      { id: 'n3', kind: 'error', title: '3 integration errors', body: 'Zendesk sync failing for SpaceX and 2 others.', time: '2h ago' },
    ],
    approvals: [
      { id: 'a1', title: 'Self-improving agent created a plan', body: 'Add 8 macros and reroute refund intents to the billing skill to lift resolution by an estimated 4%.', impact: '+4% resolution', author: 'Orchestrator' },
      { id: 'a2', title: 'New knowledge source proposed', body: 'Ingest the updated returns policy PDF into the shared knowledge base.', impact: '12 gaps closed', author: 'Knowledge agent' },
    ],
    gaps: [
      { id: 'g1', topic: 'Refund eligibility windows', misses: 42, trend: 'up' },
      { id: 'g2', topic: 'Enterprise SSO setup', misses: 28, trend: 'down' },
      { id: 'g3', topic: 'Data residency (EU)', misses: 19, trend: 'up' },
    ],
    qa: [
      { id: 'q1', suite: 'Billing & refunds', pass: 118, fail: 6 },
      { id: 'q2', suite: 'Account management', pass: 94, fail: 2 },
      { id: 'q3', suite: 'Voice flows', pass: 61, fail: 11 },
    ],
    cost: { spend: 8420, limit: 12000, unit: '$', note: 'Across all organizations this month' },
    activity: [
      { id: 'ac1', text: 'Orchestrator deployed voice agent v12', time: '12m ago' },
      { id: 'ac2', text: 'Tesla org reached 80% resolution rate', time: '1h ago' },
      { id: 'ac3', text: 'Knowledge base synced 240 new articles', time: '3h ago' },
      { id: 'ac4', text: 'A/B test “Refund tone” concluded', time: '6h ago' },
    ],
    intents: [
      { id: 'in1', name: 'Order status', share: 34 },
      { id: 'in2', name: 'Refund request', share: 22 },
      { id: 'in3', name: 'Account access', share: 18 },
      { id: 'in4', name: 'Product info', share: 14 },
    ],
    policies: {
      summary: { improved: 18, lift: '+5.2% resolution', period: 'Last 30 days' },
      items: [
        { id: 'p1', title: 'Refund escalation policy', change: 'Auto-approve refunds under $50 instead of routing to a human.', impact: '-32% escalations', status: 'applied', scope: 'All organizations', time: '2h ago' },
        { id: 'p2', title: 'VIP tone guardrail', change: 'Enforce empathetic phrasing for enterprise customers.', impact: '+0.3 CSAT', status: 'applied', scope: '6 channels', time: '1d ago' },
        { id: 'p3', title: 'Data residency handling', change: 'Route EU data questions to the compliance skill.', impact: '12 gaps closed', status: 'proposed', scope: 'EU customers', time: '3h ago' },
      ],
    },
  },
  organization: {
    score: 88,
    scoreLabel: 'Good',
    trend: [60, 66, 64, 70, 76, 74, 80, 82, 85, 88],
    metrics: [
      { key: 'res', label: 'Resolution rate', value: '79%', delta: '+2.4%', up: true, good: true },
      { key: 'csat', label: 'CSAT', value: '4.5', delta: '+0.1', up: true, good: true },
      { key: 'esc', label: 'Escalations', value: '8.1%', delta: '+0.6%', up: true, good: false },
      { key: 'aht', label: 'Avg handle time', value: '2m 03s', delta: '-4s', up: false, good: true },
    ],
    notifications: [
      { id: 'n1', kind: 'studio', title: 'Widget agent is ready', body: 'SpaceX web widget v8 passed evaluation and is ready to publish.', time: '20m ago' },
      { id: 'n2', kind: 'error', title: '1 integration error', body: 'Slack channel token expired — reconnect required.', time: '3h ago' },
      { id: 'n3', kind: 'billing', title: 'Usage at 82% of plan', body: "You're on track to reach the monthly conversation limit.", time: '5h ago' },
    ],
    approvals: [
      { id: 'a1', title: 'Self-improving agent created a plan', body: 'Rewrite 5 low-scoring answers about shipping and add a tone guardrail for VIP customers.', impact: '+3% CSAT', author: 'Orchestrator' },
    ],
    gaps: [
      { id: 'g1', topic: 'International shipping times', misses: 31, trend: 'up' },
      { id: 'g2', topic: 'Warranty claims', misses: 17, trend: 'down' },
      { id: 'g3', topic: 'Bulk order pricing', misses: 9, trend: 'up' },
    ],
    qa: [
      { id: 'q1', suite: 'Shipping & delivery', pass: 74, fail: 5 },
      { id: 'q2', suite: 'Product questions', pass: 88, fail: 3 },
      { id: 'q3', suite: 'Returns', pass: 40, fail: 9 },
    ],
    cost: { spend: 2140, limit: 3000, unit: '$', note: 'This organization this month' },
    activity: [
      { id: 'ac1', text: 'Widget agent v8 published to production', time: '20m ago' },
      { id: 'ac2', text: '5 answers rewritten by self-improving agent', time: '2h ago' },
      { id: 'ac3', text: 'Slack integration token expired', time: '3h ago' },
      { id: 'ac4', text: 'New macro added: “Late delivery apology”', time: '5h ago' },
    ],
    intents: [
      { id: 'in1', name: 'Where is my order', share: 41 },
      { id: 'in2', name: 'Return an item', share: 19 },
      { id: 'in3', name: 'Shipping cost', share: 16 },
      { id: 'in4', name: 'Change address', share: 11 },
    ],
    policies: {
      summary: { improved: 7, lift: '+3.1% CSAT', period: 'Last 30 days' },
      items: [
        { id: 'p1', title: 'Shipping delay responses', change: 'Rewrote 5 low-scoring answers about late deliveries.', impact: '+0.4 CSAT', status: 'applied', scope: 'Web widget', time: '2h ago' },
        { id: 'p2', title: 'Late delivery apology macro', change: 'Added a proactive apology + credit offer for delays over 3 days.', impact: '+6% resolution', status: 'applied', scope: 'Email & chat', time: '5h ago' },
        { id: 'p3', title: 'Bulk order pricing', change: 'Route bulk pricing questions to the sales knowledge base.', impact: '9 gaps closed', status: 'proposed', scope: 'All channels', time: '1d ago' },
      ],
    },
  },
}
