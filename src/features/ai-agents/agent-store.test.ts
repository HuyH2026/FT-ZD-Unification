import { describe, expect, it } from 'vitest'
import {
  STEP_TYPES, chipVariantForStep,
  insertChip, removeChip, appendBlock, moveBlock, removeBlock,
  addConditionRow, editConditionRow, removeConditionRow, toggleBlockCollapse,
  removeAgents,
  seedAgents, nextId, type PolicyDoc, type CanvasBlock,
} from './agent-store'

const doc: PolicyDoc = {
  title: 'Autoflow policy',
  segments: [
    { kind: 'prose', id: 'p1', text: 'Reveal ' },
    { kind: 'chip', id: 'c1', variant: 'form', label: 'Survey' },
    { kind: 'prose', id: 'p2', text: ' to identify.' },
  ],
}

describe('agent-store reducers', () => {
  it('exposes the palette step types with labels', () => {
    expect(STEP_TYPES.map((s) => s.type)).toContain('condition')
    expect(STEP_TYPES.find((s) => s.type === 'code')?.label).toBe('Code')
  })

  it('maps a step type to a chip variant', () => {
    expect(chipVariantForStep('form')).toBe('form')
    expect(chipVariantForStep('condition')).toBe('routing')
    expect(chipVariantForStep('code')).toBe('action')
  })

  it('inserts a chip at a segment index', () => {
    const next = insertChip(doc, 1, { kind: 'chip', id: 'c2', variant: 'action', label: 'Apply' })
    expect(next.segments[1]).toMatchObject({ id: 'c2', label: 'Apply' })
    expect(next.segments).toHaveLength(4)
    expect(doc.segments).toHaveLength(3) // original untouched
  })

  it('removes a chip by id', () => {
    const next = removeChip(doc, 'c1')
    expect(next.segments.some((s) => s.kind === 'chip')).toBe(false)
  })

  it('appends, moves, and removes canvas blocks', () => {
    const a: CanvasBlock = { id: 'b1', stepType: 'condition', title: 'Untitled classic block 01' }
    const b: CanvasBlock = { id: 'b2', stepType: 'code', title: 'Untitled classic block 02' }
    const two = appendBlock(appendBlock([], a), b)
    expect(two.map((x) => x.id)).toEqual(['b1', 'b2'])
    expect(moveBlock(two, 0, 1).map((x) => x.id)).toEqual(['b2', 'b1'])
    expect(removeBlock(two, 'b1').map((x) => x.id)).toEqual(['b2'])
  })

  it('adds, edits, and removes condition rows on a block', () => {
    const block: CanvasBlock = {
      id: 'b1', stepType: 'condition', title: 'Untitled classic block 01',
      rows: [{ id: 'r1', label: 'First' }],
    }
    const two = addConditionRow([block], 'b1', { id: 'r2', label: 'Second' })
    expect(two[0].rows?.map((r) => r.id)).toEqual(['r1', 'r2'])

    const edited = editConditionRow(two, 'b1', 'r2', 'Renamed')
    expect(edited[0].rows?.find((r) => r.id === 'r2')?.label).toBe('Renamed')

    const removed = removeConditionRow(edited, 'b1', 'r1')
    expect(removed[0].rows?.map((r) => r.id)).toEqual(['r2'])

    // other blocks untouched; original array not mutated
    expect(block.rows).toHaveLength(1)
  })

  it('seeds a first row on a block that has none when adding', () => {
    const block: CanvasBlock = { id: 'b1', stepType: 'condition', title: 'x' }
    const next = addConditionRow([block], 'b1', { id: 'r1', label: 'First' })
    expect(next[0].rows).toEqual([{ id: 'r1', label: 'First' }])
  })

  it('toggles a block collapsed flag', () => {
    const block: CanvasBlock = { id: 'b1', stepType: 'condition', title: 'x' }
    expect(toggleBlockCollapse([block], 'b1')[0].collapsed).toBe(true)
    expect(toggleBlockCollapse(toggleBlockCollapse([block], 'b1'), 'b1')[0].collapsed).toBe(false)
  })

  it('seeds Service cancellation with policy chips and a condition block', () => {
    const agents = seedAgents()
    const svc = agents.find((x) => x.id === 'w3')!
    expect(svc.policy.segments.some((s) => s.kind === 'chip')).toBe(true)
    expect(svc.blocks.length).toBeGreaterThan(0)
    const block = svc.blocks[0]
    expect(block.header).toBe('Conditions')
    expect(block.subtitle).toBe('Shipping status')
    expect(block.rows?.length).toBeGreaterThan(0)
  })

  it('removes agents by a set of ids', () => {
    const agents = seedAgents()
    const [a, b] = agents
    const remaining = removeAgents(agents, [a.id, b.id])
    expect(remaining.some((x) => x.id === a.id || x.id === b.id)).toBe(false)
    expect(remaining).toHaveLength(agents.length - 2)
    // original untouched
    expect(agents.some((x) => x.id === a.id)).toBe(true)
  })

  it('removeAgents with no ids returns the list unchanged', () => {
    const agents = seedAgents()
    expect(removeAgents(agents, [])).toHaveLength(agents.length)
  })

  it('mints unique deterministic ids', () => {
    expect(nextId('agent')).not.toBe(nextId('agent'))
  })
})
