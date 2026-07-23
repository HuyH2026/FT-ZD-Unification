// Mutable agent layer for the Agent Builder create/edit flow. Seeds from the
// frozen CHANNELS const and extends each agent with editor fields (policy doc +
// canvas blocks) and create-form metadata. Pure reducers here are unit-tested
// without jsdom; the React hook (below) wires them to state + localStorage.
import { useCallback, useMemo, useState } from 'react'
import { CHANNELS, type Agent, type ChannelKey } from './agent-builder-data'

export type StepType =
  | 'options' | 'condition' | 'form' | 'text' | 'dynamic-card'
  | 'image' | 'csat' | 'attachment' | 'code'

export const STEP_TYPES: { type: StepType; label: string }[] = [
  { type: 'options', label: 'Options' },
  { type: 'condition', label: 'Condition' },
  { type: 'form', label: 'Form' },
  { type: 'text', label: 'Text' },
  { type: 'dynamic-card', label: 'Dynamic card' },
  { type: 'image', label: 'Image' },
  { type: 'csat', label: 'CSAT Survey Trigger Point' },
  { type: 'attachment', label: 'Attachment' },
  { type: 'code', label: 'Code' },
]

export type ChipVariant = 'form' | 'routing' | 'event' | 'action' | 'trigger'

export type PolicyChip = { kind: 'chip'; id: string; variant: ChipVariant; label: string }
export type PolicyProse = { kind: 'prose'; id: string; text: string }
export type PolicySegment = PolicyProse | PolicyChip
export type PolicyDoc = { title: string; segments: PolicySegment[] }

export type ConditionRow = { id: string; label: string }
export type CanvasBlock = {
  id: string
  stepType: StepType
  title: string
  collapsed?: boolean
  // Condition content (present for condition-type blocks). The last row acts as
  // the "Otherwise…" fallthrough when its label is the sentinel.
  header?: string
  subtitle?: string
  rows?: ConditionRow[]
}

export type StoredAgent = Agent & {
  channel: ChannelKey
  policy: PolicyDoc
  blocks: CanvasBlock[]
  universalBrand: boolean
  tags: string[]
  triggeredWhen: string
  trainingPhrases: string[]
}

let seq = 0
export function nextId(prefix: string): string {
  return `${prefix}-${++seq}`
}
export function syncSeq(agents: { id: string }[]): void {
  for (const a of agents) {
    const m = /-(\d+)$/.exec(a.id)
    if (m) seq = Math.max(seq, Number(m[1]))
  }
}

export function chipVariantForStep(step: StepType): ChipVariant {
  switch (step) {
    case 'form': return 'form'
    case 'condition': return 'routing'
    case 'csat': return 'event'
    case 'text': return 'trigger'
    default: return 'action'
  }
}

export function insertChip(doc: PolicyDoc, index: number, chip: PolicyChip): PolicyDoc {
  const segments = [...doc.segments]
  segments.splice(index, 0, chip)
  return { ...doc, segments }
}
export function removeChip(doc: PolicyDoc, chipId: string): PolicyDoc {
  return { ...doc, segments: doc.segments.filter((s) => !(s.kind === 'chip' && s.id === chipId)) }
}
export function appendBlock(blocks: CanvasBlock[], block: CanvasBlock): CanvasBlock[] {
  return [...blocks, block]
}
export function moveBlock(blocks: CanvasBlock[], from: number, to: number): CanvasBlock[] {
  const next = [...blocks]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
export function removeBlock(blocks: CanvasBlock[], id: string): CanvasBlock[] {
  return blocks.filter((b) => b.id !== id)
}

function patchBlock(blocks: CanvasBlock[], id: string, fn: (b: CanvasBlock) => CanvasBlock): CanvasBlock[] {
  return blocks.map((b) => (b.id === id ? fn(b) : b))
}
export function addConditionRow(blocks: CanvasBlock[], blockId: string, row: ConditionRow): CanvasBlock[] {
  return patchBlock(blocks, blockId, (b) => ({ ...b, rows: [...(b.rows ?? []), row] }))
}
export function editConditionRow(blocks: CanvasBlock[], blockId: string, rowId: string, label: string): CanvasBlock[] {
  return patchBlock(blocks, blockId, (b) => ({
    ...b,
    rows: (b.rows ?? []).map((r) => (r.id === rowId ? { ...r, label } : r)),
  }))
}
export function removeConditionRow(blocks: CanvasBlock[], blockId: string, rowId: string): CanvasBlock[] {
  return patchBlock(blocks, blockId, (b) => ({ ...b, rows: (b.rows ?? []).filter((r) => r.id !== rowId) }))
}
export function toggleBlockCollapse(blocks: CanvasBlock[], blockId: string): CanvasBlock[] {
  return patchBlock(blocks, blockId, (b) => ({ ...b, collapsed: !b.collapsed }))
}

export function removeAgents<T extends { id: string }>(agents: T[], ids: string[]): T[] {
  if (ids.length === 0) return agents
  const drop = new Set(ids)
  return agents.filter((a) => !drop.has(a.id))
}

// Exact "Service cancellation" policy transcribed from the Figma frame.
function serviceCancellationPolicy(): PolicyDoc {
  return {
    title: 'Autoflow policy',
    segments: [
      { kind: 'prose', id: 'p1', text: 'Reveal ' },
      { kind: 'chip', id: 'c1', variant: 'form', label: 'Form: Cancellation Diagnostic Survey' },
      { kind: 'prose', id: 'p2', text: ' to identify the root cause. Trigger ' },
      { kind: 'chip', id: 'c2', variant: 'routing', label: 'Retention Routing' },
      { kind: 'prose', id: 'p3', text: ' Based on retention classification, explain to the customer that their problem is solvable and offer 30 days free while the team works on resolving it. Ask if they want to take the offer. Collect their decision via ' },
      { kind: 'chip', id: 'c3', variant: 'form', label: '30-Day Free - Accept or Decline' },
      { kind: 'prose', id: 'p4', text: ' If the customer accepts, fire event ' },
      { kind: 'chip', id: 'c4', variant: 'event', label: 'Retention Saved' },
      { kind: 'prose', id: 'p5', text: ' and trigger ' },
      { kind: 'chip', id: 'c5', variant: 'action', label: 'Apply 30-Day Free' },
      { kind: 'prose', id: 'p6', text: ' and ' },
      { kind: 'chip', id: 'c6', variant: 'action', label: 'Schedule Day-30 Check-in' },
      { kind: 'prose', id: 'p7', text: ' If the customer declines, trigger ' },
      { kind: 'chip', id: 'c7', variant: 'action', label: 'Process Cancellation' },
      { kind: 'prose', id: 'p8', text: ' At close, trigger ' },
      { kind: 'chip', id: 'c8', variant: 'form', label: 'CSAT Survey' },
    ],
  }
}

function starterPolicy(name: string): PolicyDoc {
  return {
    title: 'Autoflow policy',
    segments: [{ kind: 'prose', id: 'p1', text: `Describe how the ${name} agent should respond.` }],
  }
}

export function seedAgents(): StoredAgent[] {
  const agents: StoredAgent[] = []
  for (const channel of CHANNELS) {
    for (const a of channel.agents) {
      agents.push({
        ...a,
        channel: channel.key,
        policy: a.id === 'w3' ? serviceCancellationPolicy() : starterPolicy(a.name),
        blocks: a.id === 'w3'
          ? [{
              id: 'b-seed-1', stepType: 'condition', title: 'Untitled classic block 01',
              header: 'Conditions', subtitle: 'Shipping status',
              rows: [
                { id: 'r-seed-1', label: 'Condition description' },
                { id: 'r-seed-2', label: 'Condition description' },
                { id: 'r-seed-3', label: 'Otherwise…' },
              ],
            }]
          : [],
        universalBrand: false,
        tags: a.tags,
        triggeredWhen: '',
        trainingPhrases: [],
      })
    }
  }
  return agents
}

const STORAGE_KEY = 'agent-builder-store-v1'
const STEP_TITLE: Record<StepType, string> = STEP_TYPES.reduce(
  (acc, s) => ({ ...acc, [s.type]: s.label }), {} as Record<StepType, string>,
)

export type CreateAgentFields = {
  name: string
  channel: ChannelKey
  universalBrand: boolean
  tags: string[]
  triggeredWhen: string
  trainingPhrases: string[]
}

function loadAgents(): StoredAgent[] {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAgent[]
      if (Array.isArray(parsed) && parsed.every((a) => a && typeof a.id === 'string')) {
        syncSeq(parsed)
        return parsed
      }
    }
  } catch {
    /* ignore missing/malformed storage */
  }
  const seeded = seedAgents()
  syncSeq(seeded)
  return seeded
}

export function useAgentStore() {
  const [agents, setAgents] = useState<StoredAgent[]>(() => loadAgents())

  const persist = useCallback((next: StoredAgent[]) => {
    setAgents(next)
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore quota/availability errors */
    }
  }, [])

  return useMemo(() => ({
    agents,
    getAgent: (id: string) => agents.find((a) => a.id === id),
    createAgent: (fields: CreateAgentFields) => {
      const id = nextId('agent')
      const agent: StoredAgent = {
        id, name: fields.name, on: true, isSubagent: false, type: 'With intent',
        conversations: 0, deflections: 0, deflectionRate: '0%', csat: 0,
        channel: fields.channel, tags: fields.tags,
        universalBrand: fields.universalBrand, triggeredWhen: fields.triggeredWhen,
        trainingPhrases: fields.trainingPhrases,
        policy: { title: 'Autoflow policy', segments: [{ kind: 'prose', id: nextId('p'), text: '' }] },
        blocks: [],
      }
      persist([...agents, agent])
      return id
    },
    updateAgent: (id: string, patch: Partial<StoredAgent>) =>
      persist(agents.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    toggleAgent: (id: string) =>
      persist(agents.map((a) => (a.id === id ? { ...a, on: !a.on } : a))),
    deleteAgents: (ids: string[]) => persist(removeAgents(agents, ids)),
  }), [agents, persist])
}

export { STEP_TITLE }
