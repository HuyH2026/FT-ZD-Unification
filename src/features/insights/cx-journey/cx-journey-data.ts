// Mock data + types for the CX Journey → Overview screen. All values are
// illustrative (no backend). Numbers match the Figma design where legible.

export type Granularity = 'weekly' | 'monthly' | 'quarterly'

// Chart series colors (mirrors HomeScreen.tsx).
export const BLUE = '#1f73b7'
export const TEAL = '#158a80'
export const AMBER = '#c8792b'
export const RED = '#c8402f'
export const GREY = '#8b8e89'

// --- Section 1: conversation flow -----------------------------------------
export type FlowStat = { label: string; value: string; pct?: string }

export const FLOW_HEADER: FlowStat[] = [
  { label: 'Total conversation', value: '550,000' },
  { label: 'Handled', value: '530,000', pct: '83%' },
  { label: 'Resolved', value: '453,000', pct: '90%' },
]

export type FlowNode = { name: string; value: string; pct?: string; color: string }
export type FlowLink = { source: number; target: number; value: number; color: string }

// Node indices:
// 0 Total conversations | 1 AI handled | 2 Human handled | 3 Not handled
// 4 AI resolved | 5 Human resolved | 6 Not resolved | 7 Total cost
export const FLOW_SANKEY: { nodes: FlowNode[]; links: FlowLink[] } = {
  nodes: [
    { name: 'Total conversations', value: '550,000', pct: '100%', color: TEAL },
    { name: 'AI handled', value: '234,800', pct: '55%', color: BLUE },
    { name: 'Human handled', value: '221,720', pct: '35%', color: BLUE },
    { name: 'Not handled', value: '55,000', pct: '10%', color: GREY },
    { name: 'AI resolved', value: '205,000', pct: '40%', color: TEAL },
    { name: 'Human resolved', value: '218,000', pct: '50%', color: AMBER },
    { name: 'Not resolved', value: '13,475', pct: '10%', color: RED },
    { name: 'Total cost', value: '$2.3M', color: TEAL },
  ],
  links: [
    { source: 0, target: 1, value: 234800, color: BLUE },
    { source: 0, target: 2, value: 221720, color: BLUE },
    { source: 0, target: 3, value: 55000, color: GREY },
    { source: 1, target: 4, value: 205000, color: TEAL },
    { source: 2, target: 5, value: 218000, color: AMBER },
    { source: 1, target: 6, value: 13475, color: RED },
    { source: 4, target: 7, value: 205000, color: TEAL },
    { source: 5, target: 7, value: 218000, color: TEAL },
  ],
}

// --- Section 2: agents breakdown ------------------------------------------
export type SubStat = { emphasis: string; label: string }
export type AgentCell = { primary: string; csat?: string; subs: SubStat[] }
export type AgentRow = {
  agent: string
  conversations: AgentCell
  handled: AgentCell
  resolved: AgentCell
  efficiency: AgentCell
}

export const AGENT_ROWS: AgentRow[] = [
  {
    agent: 'AI + Human',
    conversations: {
      primary: '550,000',
      subs: [
        { emphasis: '85%', label: 'total eligible (450,000)' },
        { emphasis: '15%', label: 'total not eligible (150,000)' },
      ],
    },
    handled: {
      primary: '530,000',
      subs: [
        { emphasis: '83%', label: 'of eligible' },
        { emphasis: '60%', label: 'Handled by AI' },
        { emphasis: '40%', label: 'Handled by human' },
      ],
    },
    resolved: {
      primary: '453,000',
      subs: [
        { emphasis: '90%', label: 'of handled' },
        { emphasis: '40%', label: 'Resolved by AI' },
        { emphasis: '50%', label: 'Resolved by human' },
        { emphasis: '10%', label: 'Not resolved' },
      ],
    },
    efficiency: {
      primary: '$2.3M',
      csat: '4.5',
      subs: [
        { emphasis: '$200K', label: 'AI total cost' },
        { emphasis: '$810k', label: 'Human total cost' },
        { emphasis: '87%', label: 'Positive Avg. sentiment' },
      ],
    },
  },
  {
    agent: 'AI',
    conversations: {
      primary: '300,000',
      subs: [
        { emphasis: '58%', label: 'total conversations' },
        { emphasis: '87%', label: 'eligible' },
        { emphasis: '13%', label: 'not eligible' },
      ],
    },
    handled: {
      primary: '234,800',
      subs: [
        { emphasis: '87%', label: 'of ai eligible' },
        { emphasis: '80%', label: 'deflected' },
        { emphasis: '20%', label: 'handoff to human' },
      ],
    },
    resolved: {
      primary: '205,000',
      subs: [
        { emphasis: '80%', label: 'of ai handled' },
        { emphasis: '60%', label: 'First interaction resolution' },
        { emphasis: '1 sec.', label: 'Avg. time to first response' },
        { emphasis: '3', label: 'Avg. interactions' },
      ],
    },
    efficiency: {
      primary: '$205K',
      csat: '4.3',
      subs: [
        { emphasis: '40%', label: 'of total conversations' },
        { emphasis: '92%', label: 'Positive Avg. sentiment' },
        { emphasis: '2 min.', label: 'Avg. full resolution time' },
        { emphasis: '$1', label: 'cost per resolution' },
      ],
    },
  },
  {
    agent: 'Human',
    conversations: {
      primary: '250,000',
      subs: [
        { emphasis: '42%', label: 'total conversations' },
        { emphasis: '90%', label: 'eligible' },
        { emphasis: '10%', label: 'not eligible' },
      ],
    },
    handled: {
      primary: '221,720',
      subs: [
        { emphasis: '90%', label: 'of human eligible' },
        { emphasis: '90%', label: 'resolved' },
        { emphasis: '10%', label: 'from AI handoff' },
        { emphasis: '15%', label: 'not resolved' },
      ],
    },
    resolved: {
      primary: '218,000',
      subs: [
        { emphasis: '94%', label: 'of human handled' },
        { emphasis: '80%', label: 'First contact resolution' },
        { emphasis: '30 min.', label: 'Avg. time to first response' },
        { emphasis: '3', label: 'Avg. replies' },
      ],
    },
    efficiency: {
      primary: '$2.1M',
      csat: '4.7',
      subs: [
        { emphasis: '50%', label: 'of total conversation' },
        { emphasis: '84%', label: 'Positive Avg. sentiment' },
        { emphasis: '2.5 hrs', label: 'Avg. full resolution time' },
        { emphasis: '$8.5', label: 'cost per resolution' },
      ],
    },
  },
]

// --- Section 3: trends -----------------------------------------------------
export type ChartUnit = 'percent' | 'currency' | 'minutes' | 'hours' | 'count'
export type TrendDatum = { bucket: string; value: number; value2?: number }
export type TrendChart = {
  key: string
  title: string
  unit: ChartUnit
  hasInfo?: boolean
  stacked?: boolean
  data: Record<Granularity, TrendDatum[]>
}

const WEEKLY = ['Nov 13', 'Nov 20', 'Nov 27', 'Dec 4']
const MONTHLY = ['Sep', 'Oct', 'Nov', 'Dec']
const QUARTERLY = ['Q1', 'Q2', 'Q3', 'Q4']

// Build a chart's three-granularity dataset from three value arrays (+ optional
// second series for the stacked chart). Keeps the mock data terse but typed.
function series(
  weekly: number[],
  monthly: number[],
  quarterly: number[],
  weekly2?: number[],
  monthly2?: number[],
  quarterly2?: number[],
): Record<Granularity, TrendDatum[]> {
  const zip = (buckets: string[], v: number[], v2?: number[]): TrendDatum[] =>
    buckets.map((bucket, i) => ({ bucket, value: v[i], ...(v2 ? { value2: v2[i] } : {}) }))
  return {
    weekly: zip(WEEKLY, weekly, weekly2),
    monthly: zip(MONTHLY, monthly, monthly2),
    quarterly: zip(QUARTERLY, quarterly, quarterly2),
  }
}

export const TREND_CHARTS: TrendChart[] = [
  {
    key: 'total-conversations',
    title: 'Total conversations',
    unit: 'count',
    stacked: true,
    data: series(
      [520000, 610000, 430000, 500000],
      [480000, 560000, 590000, 550000],
      [1.4e6, 1.6e6, 1.5e6, 1.55e6],
      [90000, 120000, 70000, 95000],
      [80000, 100000, 110000, 95000],
      [260000, 300000, 280000, 290000],
    ),
  },
  {
    key: 'resolution-rate',
    title: 'Resolution rate',
    unit: 'percent',
    data: series([95, 100, 72, 78], [80, 90, 95, 90], [82, 88, 90, 91]),
  },
  {
    key: 'total-resolution-cost',
    title: 'Total resolution cost',
    unit: 'currency',
    data: series([620000, 1e6, 500000, 560000], [700000, 820000, 900000, 860000], [2.1e6, 2.4e6, 2.3e6, 2.35e6]),
  },
  {
    key: 'first-contact-resolution-rate',
    title: 'First contact resolution rate',
    unit: 'percent',
    hasInfo: true,
    data: series([70, 78, 52, 60], [58, 66, 72, 68], [60, 65, 70, 71]),
  },
  {
    key: 'avg-first-resolution-time',
    title: 'Avg. first resolution time',
    unit: 'minutes',
    hasInfo: true,
    data: series([30, 45, 22, 33], [28, 34, 40, 36], [30, 33, 38, 35]),
  },
  {
    key: 'avg-reply-time',
    title: 'Avg. reply time',
    unit: 'minutes',
    hasInfo: true,
    data: series([9, 15, 5, 8], [8, 11, 13, 12], [9, 10, 12, 11]),
  },
  {
    key: 'avg-full-resolutions-time',
    title: 'Avg. full resolutions time',
    unit: 'hours',
    hasInfo: true,
    data: series([9, 15, 5, 8], [8, 11, 13, 12], [9, 10, 12, 11]),
  },
  {
    key: 'sentiment',
    title: 'Sentiment',
    unit: 'percent',
    hasInfo: true,
    data: series([95, 100, 72, 78], [80, 90, 95, 90], [82, 88, 90, 91]),
  },
]
