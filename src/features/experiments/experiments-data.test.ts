import { describe, it, expect } from 'vitest'
import { METRICS, EXPERIMENTS } from './experiments-data'

describe('experiments-data', () => {
  it('has four metrics including CSAT with a green accent', () => {
    expect(METRICS).toHaveLength(4)
    expect(METRICS.map((m) => m.label)).toEqual([
      'Total Tests',
      'Total conversations',
      'Resolutions',
      'CSAT',
    ])
    const resolutions = METRICS.find((m) => m.label === 'Resolutions')
    expect(resolutions?.value).toBe('41,312')
    expect(resolutions?.sub).toBe('80%')
    expect(METRICS.find((m) => m.label === 'CSAT')?.accent).toBe('green')
  })

  it('has five experiments with valid splits summing near 100', () => {
    expect(EXPERIMENTS).toHaveLength(5)
    expect(EXPERIMENTS.map((e) => e.name)).toContain('Abandoned Cart Recovery')
    for (const e of EXPERIMENTS) {
      expect(e.splits.length).toBeGreaterThanOrEqual(2)
      expect(e.splits.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(99)
    }
  })
})
