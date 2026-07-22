// src/features/orchestrator/journey/journey-data.test.ts
import { describe, it, expect } from 'vitest'
import { PALETTE, SEED_JOURNEYS, seedFor } from './journey-data'

describe('journey-data', () => {
  it('exposes the three palette categories in order', () => {
    expect(PALETTE.map((c) => c.title)).toEqual([
      'Channel Agents',
      'Logic',
      'Triage models',
    ])
  })

  it('every palette item has a unique id', () => {
    const ids = PALETTE.flatMap((c) => c.items.map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('seeds a rich graph for a1 with a start node and at least one end node', () => {
    const g = SEED_JOURNEYS.a1
    expect(g.nodes.some((n) => n.type === 'start')).toBe(true)
    expect(g.nodes.filter((n) => n.type === 'end').length).toBeGreaterThanOrEqual(1)
    // every edge references existing nodes
    const ids = new Set(g.nodes.map((n) => n.id))
    for (const e of g.edges) {
      expect(ids.has(e.source)).toBe(true)
      expect(ids.has(e.target)).toBe(true)
    }
  })

  it('seeds valid smaller graphs for a2 and a3', () => {
    for (const id of ['a2', 'a3'] as const) {
      const g = SEED_JOURNEYS[id]
      expect(g.nodes.length).toBeGreaterThanOrEqual(3)
      expect(g.nodes.some((n) => n.type === 'start')).toBe(true)
    }
  })

  it('seedFor returns an empty graph for an unknown id', () => {
    expect(seedFor('nope')).toEqual({ nodes: [], edges: [] })
  })
})
