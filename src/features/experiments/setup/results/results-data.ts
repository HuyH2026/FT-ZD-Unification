// Mock data for the A/B Test Results tab. Values are exact from Figma frame
// 755:170380 ("06 Experiments expanded" → Results). No backend.

export const CONTROL_COLOR = '#01567a'
export const VARIANT_A_COLOR = '#e05c34'
export const VARIANT_B_COLOR = '#2f69c7'
export const POSITIVE_COLOR = '#048c80'
export const NEGATIVE_COLOR = '#e53112'

export type WinnerVariant = {
  key: string
  badge: string
  badgeColor: string
  title: string
  detail: string
  isWinner?: boolean
}

export const WINNER_VARIANTS: WinnerVariant[] = [
  {
    key: 'variant-b',
    badge: 'Variant B',
    badgeColor: '#be297b',
    title: 'Auto Password Reset Account Authentication',
    detail: 'Conversation count (split %): 3,011 (33.6%)',
    isWinner: true,
  },
  {
    key: 'control',
    badge: 'Control',
    badgeColor: '#385075',
    title: 'Live',
    detail: 'Conversation count (split %): 3,000 (33.2%)',
  },
  {
    key: 'variant-a',
    badge: 'Variant A',
    badgeColor: '#2f69c7',
    title: 'Auto Ticket Creation',
    detail: 'Conversation count (split %): 2,989 (33.1%)',
  },
]

export const WINNER_LABEL = 'Variant B'

export type ResultsRecommendation = {
  title: string
  bullets: string[]
}

export const RESULTS_RECOMMENDATION: ResultsRecommendation = {
  title: 'Recommendation',
  bullets: ['Roll out this feature to only English speaking audience', 'Identify and fix so and so'],
}

export const KEY_LEARNING: ResultsRecommendation = {
  title: 'Key Learning',
  bullets: [
    'Variation B shows a notable 80% improvement in deflection rate.',
    'Users are 34% happier with Variation A based on CSAT result.',
    'Users were 18% happier with Variation A, based on Forethought sentiment analysis.',
    'Variation B generates 22% more messages per session, showing higher engagement.',
  ],
}

export type TrafficSplitSlice = { name: string; value: number; pct: string; color: string }

export const TRAFFIC_SPLIT: TrafficSplitSlice[] = [
  { name: 'control', value: 3000, pct: '33.3%', color: CONTROL_COLOR },
  { name: 'Variant A', value: 3000, pct: '33.3%', color: VARIANT_A_COLOR },
  { name: 'Variant B', value: 3000, pct: '33.3%', color: VARIANT_B_COLOR },
]

export const TRAFFIC_SPLIT_TOTAL = 9000

export type AvgDeltaEntry = { name: string; delta: string; color: string; positive: boolean }

export const AVG_DELTA: AvgDeltaEntry[] = [
  { name: 'Variant A', delta: '-27.4%', color: VARIANT_A_COLOR, positive: false },
  { name: 'Variant B', delta: '+16%', color: VARIANT_B_COLOR, positive: true },
]

export type MetricBarItem = {
  name: 'Control' | 'Variant A' | 'Variant B'
  value: number
  display: string
  delta?: string
  positive?: boolean
}

export type MetricCard = {
  key: string
  title: string
  significant: boolean
  domainMax: number
  ticks: number[]
  tickSuffix?: string
  items: MetricBarItem[]
}

const BAR_COLORS = { Control: CONTROL_COLOR, 'Variant A': VARIANT_A_COLOR, 'Variant B': VARIANT_B_COLOR } as const

export { BAR_COLORS }

export const METRIC_CARDS: MetricCard[] = [
  {
    key: 'deflection',
    title: 'Deflection',
    significant: true,
    domainMax: 3000,
    ticks: [0, 1000, 2000, 3000],
    tickSuffix: 'k',
    items: [
      { name: 'Control', value: 2400, display: '2,400' },
      { name: 'Variant A', value: 1800, display: '1,800', delta: '-600', positive: false },
      { name: 'Variant B', value: 2799, display: '2,799', delta: '+399', positive: true },
    ],
  },
  {
    key: 'deflection-rate',
    title: 'Deflection rate',
    significant: true,
    domainMax: 100,
    ticks: [0, 33, 67, 100],
    tickSuffix: '%',
    items: [
      { name: 'Control', value: 80, display: '80%' },
      { name: 'Variant A', value: 55, display: '55%', delta: '-25%', positive: false },
      { name: 'Variant B', value: 92, display: '92%', delta: '+12%', positive: true },
    ],
  },
  {
    key: 'avg-csat',
    title: 'Avg. CSAT',
    significant: false,
    domainMax: 5,
    ticks: [2, 3, 4, 5],
    items: [
      { name: 'Control', value: 3.2, display: '3.2' },
      { name: 'Variant A', value: 2.8, display: '2.8', delta: '-0.4', positive: false },
      { name: 'Variant B', value: 3.8, display: '3.8', delta: '+0.6', positive: true },
    ],
  },
  {
    key: 'positive-sentiment',
    title: '% of positive sentiment',
    significant: true,
    domainMax: 100,
    ticks: [0, 33, 67, 100],
    tickSuffix: '%',
    items: [
      { name: 'Control', value: 80, display: '80%' },
      { name: 'Variant A', value: 55, display: '55%', delta: '-25%', positive: false },
      { name: 'Variant B', value: 92, display: '92%', delta: '+12%', positive: true },
    ],
  },
  {
    key: 'engagement',
    title: 'Engagement',
    significant: true,
    domainMax: 100,
    ticks: [0, 33, 67, 100],
    tickSuffix: '%',
    items: [
      { name: 'Control', value: 80, display: '80%' },
      { name: 'Variant A', value: 55, display: '55%', delta: '-25%', positive: false },
      { name: 'Variant B', value: 92, display: '92%', delta: '+12%', positive: true },
    ],
  },
  {
    key: 'relevance-rate',
    title: 'Relevance rate',
    significant: true,
    domainMax: 100,
    ticks: [0, 33, 67, 100],
    tickSuffix: '%',
    items: [
      { name: 'Control', value: 80, display: '80%' },
      { name: 'Variant A', value: 55, display: '55%', delta: '-25%', positive: false },
      { name: 'Variant B', value: 92, display: '92%', delta: '+12%', positive: true },
    ],
  },
  {
    key: 'realized-saving',
    title: 'Realized saving',
    significant: true,
    domainMax: 100,
    ticks: [0, 33, 67, 100],
    items: [
      { name: 'Control', value: 80, display: '80k' },
      { name: 'Variant A', value: 55, display: '55k', delta: '-25%', positive: false },
      { name: 'Variant B', value: 92, display: '92k', delta: '+12%', positive: true },
    ],
  },
]

export const RESOLUTIONS_TABS = ['Conversations', 'Resolutions', 'Sentiment', 'CSAT', 'Duration', 'AI QA'] as const

export type ResolutionsPoint = { bucket: string; Control: number; 'Variant A': number; 'Variant B': number }

export const RESOLUTIONS_SERIES: ResolutionsPoint[] = [
  { bucket: '10/3', Control: 72, 'Variant A': 61, 'Variant B': 84 },
  { bucket: '10/10', Control: 64, 'Variant A': 75, 'Variant B': 74 },
  { bucket: '10/17', Control: 57, 'Variant A': 62, 'Variant B': 54 },
  { bucket: '10/24', Control: 69, 'Variant A': 92, 'Variant B': 89 },
  { bucket: '11/1', Control: 54, 'Variant A': 68, 'Variant B': 56 },
]
