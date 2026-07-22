import { describe, expect, it } from 'vitest'
import { AUTOMATION_ROWS, AUTOMATION_STATS, AUTOMATION_SUBTABS } from './automation-data'

describe('automation-data', () => {
  it('has three sub-tabs starting with Agent gaps', () => {
    expect(AUTOMATION_SUBTABS.map((t) => t.label)).toEqual([
      'Agent gaps',
      'Knowledge gaps',
      'Realized impact',
    ])
  })

  it('has three headline stats and three rows', () => {
    expect(AUTOMATION_STATS).toHaveLength(3)
    expect(AUTOMATION_STATS[0]).toMatchObject({ value: '6,908' })
    expect(AUTOMATION_ROWS).toHaveLength(3)
    expect(AUTOMATION_ROWS[0].topic).toBe('Reactivate account')
  })
})
