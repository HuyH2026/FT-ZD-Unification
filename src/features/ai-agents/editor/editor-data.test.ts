import { describe, expect, it } from 'vitest'
import { STEP_ICON, CHIP_STYLE } from './editor-data'
import { STEP_TYPES } from '../agent-store'

describe('editor-data', () => {
  it('has an icon for every step type', () => {
    for (const s of STEP_TYPES) expect(STEP_ICON[s.type]).toBeTruthy()
  })
  it('has a style for every chip variant', () => {
    for (const v of ['form', 'routing', 'event', 'action', 'trigger'] as const) {
      expect(CHIP_STYLE[v]).toHaveProperty('text')
    }
  })
})
