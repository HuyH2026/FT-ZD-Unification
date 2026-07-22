// src/features/orchestrator/journey/journey-data.ts

// Type definitions
export type JourneyNodeKind = 'start' | 'rule' | 'action' | 'end'

export type ActionChannel = 'voice' | 'email' | 'widget'

export type Condition = { label: string; tokens?: string[] }

export type JourneyNodeData = {
  kind: JourneyNodeKind
  title: string
  event?: string
  conditions?: Condition[]
  channel?: ActionChannel
  actionLabel?: string
  description?: string
  ticketTags?: string[]
}

export type JourneyNode = {
  id: string
  type: JourneyNodeKind
  position: { x: number; y: number }
  data: JourneyNodeData
}

export type JourneyEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  label?: string
}

export type Journey = {
  nodes: JourneyNode[]
  edges: JourneyEdge[]
}

export type PaletteIconName =
  | 'MessageSquare'
  | 'Mail'
  | 'Phone'
  | 'Split'
  | 'Repeat'
  | 'RefreshCw'
  | 'CalendarCheck'
  | 'Timer'
  | 'Square'
  | 'Activity'
  | 'Languages'
  | 'Smile'
  | 'ShieldAlert'

export type PaletteItem = {
  id: string
  label: string
  color: string
  icon: PaletteIconName
}

export type NodeCategory = {
  title: string
  items: PaletteItem[]
}

// Palette data
export const PALETTE: NodeCategory[] = [
  {
    title: 'Channel Agents',
    items: [
      { id: 'widget', label: 'Widget', color: '#e05c34', icon: 'MessageSquare' },
      { id: 'email', label: 'Email', color: '#247acb', icon: 'Mail' },
      { id: 'voice', label: 'Voice', color: '#be297b', icon: 'Phone' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { id: 'if-otherwise', label: 'If/Otherwise', color: '#ffd483', icon: 'Split' },
      { id: 'human-loop', label: 'Human in the loop', color: '#9abaca', icon: 'Repeat' },
      { id: 'loop-items', label: 'Loop over items', color: '#000000', icon: 'RefreshCw' },
      { id: 'on-schedule', label: 'On Schedule', color: '#8ca5c2', icon: 'CalendarCheck' },
      { id: 'delay', label: 'Delay', color: '#2f99b3', icon: 'Timer' },
      { id: 'end', label: 'End', color: '#ea5a41', icon: 'Square' },
    ],
  },
  {
    title: 'Triage models',
    items: [
      { id: 'injury-severity', label: 'Injury severity', color: '#7c3aed', icon: 'Activity' },
      { id: 'language-detection', label: 'Language Detection', color: '#16a34a', icon: 'Languages' },
      { id: 'sentiment-detection', label: 'Sentiment Detection', color: '#f59e0b', icon: 'Smile' },
      { id: 'spam-detection', label: 'Spam Detection', color: '#2563eb', icon: 'ShieldAlert' },
    ],
  },
]

// Seed journey graphs
export const SEED_JOURNEYS: Record<string, Journey> = {
  a1: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 360, y: 0 },
        data: { kind: 'start', title: 'Start', event: 'On Event: Cart abandoned' } },
      { id: 'rule1', type: 'rule', position: { x: 360, y: 220 },
        data: { kind: 'rule', title: 'Cart abandoned for > 24 hours',
          conditions: [{ label: 'has not purchased item', tokens: ['$cart.abandoned', '$User'] }] } },
      { id: 'voice', type: 'action', position: { x: 190, y: 620 },
        data: { kind: 'action', channel: 'voice', actionLabel: 'Voice',
          title: 'Voice', description: 'Call customers with abandoned carts' } },
      { id: 'end1', type: 'end', position: { x: 560, y: 620 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
      { id: 'rule2', type: 'rule', position: { x: 190, y: 800 },
        data: { kind: 'rule', title: 'Cart abandoned for > 24 hours',
          conditions: [{ label: '', tokens: ['$purchase.made'] }] } },
      { id: 'email', type: 'action', position: { x: 20, y: 1120 },
        data: { kind: 'action', channel: 'email', actionLabel: 'Email',
          title: 'Email', description: 'Email users receipt' } },
      { id: 'end2', type: 'end', position: { x: 370, y: 1120 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
      { id: 'end3', type: 'end', position: { x: 20, y: 1340 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
    ],
    edges: [
      { id: 'e-start-rule1', source: 'start', target: 'rule1' },
      { id: 'e-rule1-voice', source: 'rule1', target: 'voice', sourceHandle: 'c0', label: '1' },
      { id: 'e-rule1-end1', source: 'rule1', target: 'end1', sourceHandle: 'otherwise', label: 'Otherwise' },
      { id: 'e-voice-rule2', source: 'voice', target: 'rule2' },
      { id: 'e-rule2-email', source: 'rule2', target: 'email', sourceHandle: 'c0', label: '1' },
      { id: 'e-rule2-end2', source: 'rule2', target: 'end2', sourceHandle: 'otherwise', label: 'Otherwise' },
      { id: 'e-email-end3', source: 'email', target: 'end3' },
    ],
  },
  a2: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 200, y: 0 },
        data: { kind: 'start', title: 'Start', event: 'On Event: Refund requested' } },
      { id: 'rule1', type: 'rule', position: { x: 200, y: 220 },
        data: { kind: 'rule', title: 'Refund amount > $100',
          conditions: [{ label: 'requires approval', tokens: ['$refund.amount'] }] } },
      { id: 'end1', type: 'end', position: { x: 200, y: 520 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
    ],
    edges: [
      { id: 'e-start-rule1', source: 'start', target: 'rule1' },
      { id: 'e-rule1-end1', source: 'rule1', target: 'end1', sourceHandle: 'c0', label: '1' },
    ],
  },
  a3: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 200, y: 0 },
        data: { kind: 'start', title: 'Start', event: 'On Event: Low CSAT submitted' } },
      { id: 'email', type: 'action', position: { x: 200, y: 220 },
        data: { kind: 'action', channel: 'email', actionLabel: 'Email',
          title: 'Email', description: 'Email a discount code' } },
      { id: 'end1', type: 'end', position: { x: 200, y: 440 },
        data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } },
    ],
    edges: [
      { id: 'e-start-email', source: 'start', target: 'email' },
      { id: 'e-email-end1', source: 'email', target: 'end1' },
    ],
  },
}

export function seedFor(automationId: string): Journey {
  return SEED_JOURNEYS[automationId] ?? { nodes: [], edges: [] }
}
