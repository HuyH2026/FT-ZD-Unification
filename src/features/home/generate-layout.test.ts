import { describe, it, expect } from 'vitest'
import { generateLayout, ROLES, FOCUS_AREAS, type Role } from './generate-layout'

const ALL_IDS = [
  'health', 'qa', 'gaps', 'approvals', 'notifications',
  'cost', 'activity', 'intents', 'policies', 'knowledge',
]

describe('generateLayout', () => {
  it('exposes four roles and five focus areas for the UI', () => {
    expect(ROLES.map((r) => r.key)).toEqual(['ops', 'quality', 'knowledge', 'exec'])
    expect(FOCUS_AREAS.map((f) => f.key)).toEqual([
      'resolution', 'actions', 'quality', 'knowledge', 'cost',
    ])
  })

  it('only ever emits valid widget ids with no duplicates across columns', () => {
    for (const role of ROLES.map((r) => r.key) as Role[]) {
      const layout = generateLayout({ role, focuses: [] })
      const all = [...layout.left, ...layout.right]
      expect(all.every((id) => ALL_IDS.includes(id))).toBe(true)
      expect(new Set(all).size).toBe(all.length)
      expect(all.length).toBeGreaterThan(0)
    }
  })

  it('always includes the core widgets (health, approvals)', () => {
    const layout = generateLayout({ role: 'exec', focuses: [] })
    const all = [...layout.left, ...layout.right]
    expect(all).toContain('health')
    expect(all).toContain('approvals')
  })

  it('ranks quality-tagged widgets to the top of the left column when quality is the focus', () => {
    const layout = generateLayout({ role: 'quality', focuses: ['quality'] })
    // qa and policies are the quality-tagged widgets; the interleaved split places them
    // at the first position of each column (left[0] and right[0]).
    expect([layout.left[0], layout.right[0]].sort()).toEqual(['policies', 'qa'])
  })

  it('boosts a widget when the free-text prompt mentions its theme', () => {
    const withCost = generateLayout({ role: 'exec', focuses: ['actions'], prompt: 'keep an eye on cost' })
    const withoutCost = generateLayout({ role: 'exec', focuses: ['actions'] })
    const rank = (l: { left: string[]; right: string[] }) =>
      [...l.left, ...l.right].indexOf('cost')
    expect(rank(withCost)).toBeLessThan(rank(withoutCost))
  })

  it('is deterministic — same input yields same output', () => {
    const a = generateLayout({ role: 'ops', focuses: ['resolution', 'actions'], prompt: 'x' })
    const b = generateLayout({ role: 'ops', focuses: ['resolution', 'actions'], prompt: 'x' })
    expect(a).toEqual(b)
  })
})
