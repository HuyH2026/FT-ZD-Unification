// Mock data + types for the CX Journey → Topics screen. All values are
// illustrative (no backend); numbers match the Figma design (CX Journey_01).
import { AMBER, BLUE, DEEP_TEAL, GREY, RED, TEAL } from '../cx-journey-data'

// --- Zone 1a: top movers table --------------------------------------------
// `comparisonPct` is signed: negative = fewer tickets than the previous period
// (good, green); positive = more (red). Colored at render from the sign.
export type TopMoverRow = { topic: string; tickets: number; previous: number; comparisonPct: number }

export const TOP_MOVERS: TopMoverRow[] = [
  { topic: 'Website Link Errors', tickets: 35, previous: 101, comparisonPct: -50.21 },
  { topic: 'Checkout Issues', tickets: 12, previous: 45, comparisonPct: -12.15 },
  { topic: 'Shipping Address Problems', tickets: 18, previous: 23, comparisonPct: 18.76 },
  { topic: 'Payment Processing Errors', tickets: 9, previous: 56, comparisonPct: -23.89 },
  { topic: 'Login Problems', tickets: 21, previous: 78, comparisonPct: 34.56 },
]

// --- Zone 1b: coaching bar chart ------------------------------------------
export type CoachingBar = { topic: string; volume: number }

export const COACHING_BARS: CoachingBar[] = [
  { topic: 'Unable to log in', volume: 102 },
  { topic: 'Billing Discrepancies', volume: 123 },
  { topic: 'Cancel subscription', volume: 82 },
  { topic: 'Cancel subscription', volume: 67 },
  { topic: 'Unable to send email', volume: 36 },
]

// --- Zone 2: stat cards ----------------------------------------------------
export type TopicStat = { title: string; value: string; sentiment?: boolean; valueColor?: string }

export const TOPIC_STATS: TopicStat[] = [
  { title: 'Categorized tickets', value: '23,877' },
  { title: 'First contact resolution', value: '75%' },
  { title: 'Avg. first resolution time', value: '24 hrs' },
  { title: 'Avg. full resolution time', value: '29.9 hrs' },
  { title: 'Sentiment', value: '50%', sentiment: true },
  { title: 'CSAT', value: '4.2', valueColor: TEAL },
  { title: 'Agent reply time', value: '11.7 hrs' },
  { title: 'Agent replies', value: '1.15' },
]

// --- Zone 4: nested topics table ------------------------------------------
// A leaf row shown inside an expanded sub-topic. Change percentages are signed
// (colored at render); the absolute figure travels alongside as a display string.
export type TopicLeaf = {
  id: string
  name: string
  tickets: number
  ticketsPct: string
  ticketsChangePct: number
  ticketsChangeAbs: string
  fullResTime: string
  fullResChangePct: number
  fullResChangeAbs: string
  // Tooltip metrics (treemap view)
  avgFirstResTime: string
  avgFullResTime: string
  agentReplyTime: string
  agentReplies: string
  csat: string
}

// A sub-topic row (level 2): a leaf that itself expands to `children`.
export type TopicSub = TopicLeaf & { count: number; children: TopicLeaf[] }

// A top-level topic row (level 1). Its own columns differ from the nested
// sub-table's columns (tickets / first-contact-resolution / sentiment).
export type TopicRow = {
  id: string
  name: string
  count: number
  tickets: number
  ticketsPct: string
  firstContactResolution: string
  sentiment: number
  color: string
  avgFirstResTime: string
  avgFullResTime: string
  agentReplyTime: string
  agentReplies: string
  csat: string
  children: TopicSub[]
}

// Per-top-level-topic treemap colors. Reuses the CX Journey accent palette and
// adds a few distinct hues so all eight top-level rows read apart.
export const TOPIC_COLORS = [RED, BLUE, TEAL, AMBER, '#7b5ea7', DEEP_TEAL, GREY, '#5a8f4d'] as const

// Terse leaf builder so the mock tree stays readable.
function leaf(
  id: string,
  name: string,
  tickets: number,
  ticketsPct: string,
  ticketsChangePct: number,
  ticketsChangeAbs: string,
  fullResTime: string,
  fullResChangePct: number,
  fullResChangeAbs: string,
): TopicLeaf {
  return {
    id,
    name,
    tickets,
    ticketsPct,
    ticketsChangePct,
    ticketsChangeAbs,
    fullResTime,
    fullResChangePct,
    fullResChangeAbs,
    avgFirstResTime: '20.9 hrs',
    avgFullResTime: '25.6 hrs',
    agentReplyTime: '9.5 hrs',
    agentReplies: '1.12',
    csat: '4.1',
  }
}

// Payment Management is the one row shown expanded in Figma; its sub-tree is
// fully specified. The other top-level rows carry a representative sub-tree so
// every row is expandable.
const PAYMENT_CHILDREN: TopicSub[] = [
  {
    ...leaf('pm-refund', 'Refund Requests and Inquiries', 2000, '26.4%', -6.7, '2,137', '94.4', -40, '56.8'),
    count: 3,
    children: [
      leaf('pm-refund-status', 'Refund Status Check', 700, '4.4%', 3, '646', '104.5', 60, '56'),
      leaf('pm-refund-cancel', 'Subscription Cancellation Refund', 700, '4.4%', 12, '617', '104.5', -60, '145'),
      leaf('pm-refund-failed', 'Failed Transaction Refund', 600, '3.7%', -20, '723', '104.5', -60, '145'),
    ],
  },
  {
    ...leaf('pm-method', 'Payment Method Issues', 2000, '50%', -60.7, '937', '94.4', -40, '56.8'),
    count: 5,
    children: [
      leaf('pm-method-1', 'Card Declined', 500, '12.5%', -30, '234', '94.4', -20, '28'),
      leaf('pm-method-2', 'Expired Card', 400, '10%', -15, '188', '94.4', -25, '31'),
      leaf('pm-method-3', 'Wrong Billing Address', 400, '10%', -18, '190', '94.4', -22, '29'),
      leaf('pm-method-4', 'Unsupported Method', 350, '8.75%', -12, '160', '94.4', -18, '24'),
      leaf('pm-method-5', 'Currency Mismatch', 350, '8.75%', -10, '165', '94.4', -15, '22'),
    ],
  },
  {
    ...leaf('pm-withdrawal-a', 'Withdrawal Issues', 2000, '50%', -60.7, '937', '94.4', -40, '56.8'),
    count: 5,
    children: [
      leaf('pm-wa-1', 'Pending Withdrawal', 500, '12.5%', -30, '234', '94.4', -20, '28'),
      leaf('pm-wa-2', 'Failed Transfer', 400, '10%', -15, '188', '94.4', -25, '31'),
      leaf('pm-wa-3', 'Bank Rejected', 400, '10%', -18, '190', '94.4', -22, '29'),
      leaf('pm-wa-4', 'Limit Exceeded', 350, '8.75%', -12, '160', '94.4', -18, '24'),
      leaf('pm-wa-5', 'Verification Hold', 350, '8.75%', -10, '165', '94.4', -15, '22'),
    ],
  },
  {
    ...leaf('pm-withdrawal-b', 'Withdrawal Issues', 2000, '50%', -60.7, '937', '94.4', -40, '56.8'),
    count: 5,
    children: [
      leaf('pm-wb-1', 'Pending Withdrawal', 500, '12.5%', -30, '234', '94.4', -20, '28'),
      leaf('pm-wb-2', 'Failed Transfer', 400, '10%', -15, '188', '94.4', -25, '31'),
      leaf('pm-wb-3', 'Bank Rejected', 400, '10%', -18, '190', '94.4', -22, '29'),
      leaf('pm-wb-4', 'Limit Exceeded', 350, '8.75%', -12, '160', '94.4', -18, '24'),
      leaf('pm-wb-5', 'Verification Hold', 350, '8.75%', -10, '165', '94.4', -15, '22'),
    ],
  },
]

// A generic two-child sub-tree for the rows Figma leaves collapsed, so each is
// still expandable. Ids are namespaced by the parent id to stay unique.
function genericChildren(parentId: string): TopicSub[] {
  return [
    {
      ...leaf(`${parentId}-s1`, 'Common requests', 1200, '35%', -8, '104', '80.2', -12, '11'),
      count: 2,
      children: [
        leaf(`${parentId}-s1-a`, 'Status inquiry', 700, '20%', -5, '37', '78.0', -10, '9'),
        leaf(`${parentId}-s1-b`, 'Update details', 500, '15%', -3, '15', '82.4', -8, '7'),
      ],
    },
    {
      ...leaf(`${parentId}-s2`, 'Escalations', 800, '23%', 6, '45', '96.1', 9, '8'),
      count: 2,
      children: [
        leaf(`${parentId}-s2-a`, 'Manual review', 500, '14%', 4, '19', '95.0', 7, '6'),
        leaf(`${parentId}-s2-b`, 'Policy exception', 300, '9%', 2, '6', '97.2', 5, '4'),
      ],
    },
  ]
}

export const TOPIC_ROWS: TopicRow[] = [
  {
    id: 'account',
    name: 'Account Management',
    count: 16,
    tickets: 25286,
    ticketsPct: '40.89%',
    firstContactResolution: '69.4%',
    sentiment: 48.6,
    color: TOPIC_COLORS[0],
    avgFirstResTime: '20.9 hrs',
    avgFullResTime: '25.6 hrs',
    agentReplyTime: '9.5 hrs',
    agentReplies: '1.12',
    csat: '4.1',
    children: genericChildren('account'),
  },
  {
    id: 'verification',
    name: 'Verification and Security',
    count: 16,
    tickets: 14286,
    ticketsPct: '22.89%',
    firstContactResolution: '87.3%',
    sentiment: 54.7,
    color: TOPIC_COLORS[1],
    avgFirstResTime: '18.5 hrs',
    avgFullResTime: '22.3 hrs',
    agentReplyTime: '8.2 hrs',
    agentReplies: '1.08',
    csat: '4.3',
    children: genericChildren('verification'),
  },
  {
    id: 'payment',
    name: 'Payment Management',
    count: 18,
    tickets: 8879,
    ticketsPct: '14.39%',
    firstContactResolution: '71.5%',
    sentiment: 75.1,
    color: TOPIC_COLORS[2],
    avgFirstResTime: '22.4 hrs',
    avgFullResTime: '27.1 hrs',
    agentReplyTime: '10.3 hrs',
    agentReplies: '1.18',
    csat: '3.9',
    children: PAYMENT_CHILDREN,
  },
  {
    id: 'profile',
    name: 'Profile Management',
    count: 21,
    tickets: 3404,
    ticketsPct: '5.5%',
    firstContactResolution: '91.2%',
    sentiment: 38.3,
    color: TOPIC_COLORS[3],
    avgFirstResTime: '16.2 hrs',
    avgFullResTime: '19.8 hrs',
    agentReplyTime: '7.1 hrs',
    agentReplies: '0.95',
    csat: '4.4',
    children: genericChildren('profile'),
  },
  {
    id: 'contract',
    name: 'Contract and Job Management',
    count: 14,
    tickets: 2920,
    ticketsPct: '4.72%',
    firstContactResolution: '73.4%',
    sentiment: 90.4,
    color: TOPIC_COLORS[4],
    avgFirstResTime: '21.7 hrs',
    avgFullResTime: '26.9 hrs',
    agentReplyTime: '9.8 hrs',
    agentReplies: '1.14',
    csat: '4.0',
    children: genericChildren('contract'),
  },
  {
    id: 'legal',
    name: 'Legal and Compliance',
    count: 10,
    tickets: 2450,
    ticketsPct: '3.96%',
    firstContactResolution: '84.4%',
    sentiment: 60.4,
    color: TOPIC_COLORS[5],
    avgFirstResTime: '19.3 hrs',
    avgFullResTime: '24.5 hrs',
    agentReplyTime: '8.9 hrs',
    agentReplies: '1.10',
    csat: '4.2',
    children: genericChildren('legal'),
  },
  {
    id: 'support-a',
    name: 'Support Services',
    count: 15,
    tickets: 1188,
    ticketsPct: '1.89%',
    firstContactResolution: '55.4%',
    sentiment: 44.8,
    color: TOPIC_COLORS[6],
    avgFirstResTime: '23.1 hrs',
    avgFullResTime: '28.4 hrs',
    agentReplyTime: '11.2 hrs',
    agentReplies: '1.25',
    csat: '3.8',
    children: genericChildren('support-a'),
  },
  {
    id: 'support-b',
    name: 'Support Services',
    count: 15,
    tickets: 1188,
    ticketsPct: '1.89%',
    firstContactResolution: '55.4%',
    sentiment: 44.8,
    color: TOPIC_COLORS[7],
    avgFirstResTime: '20.5 hrs',
    avgFullResTime: '25.2 hrs',
    agentReplyTime: '9.3 hrs',
    agentReplies: '1.11',
    csat: '4.0',
    children: genericChildren('support-b'),
  },
]

// --- Sentiment banding -----------------------------------------------------
export function sentimentBand(score: number): { color: string; label: string } {
  if (score >= 60) return { color: TEAL, label: 'good' }
  if (score >= 45) return { color: AMBER, label: 'ok' }
  return { color: RED, label: 'bad' }
}
