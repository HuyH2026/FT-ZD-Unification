import { describe, it, expect } from 'vitest'
import { TOOL_TABS, TOOL_ACTIONS, NAME_COUNT } from './tools-data'

describe('tools-data', () => {
  it('defines the four tabs in Figma order', () => {
    expect(TOOL_TABS).toEqual(['Available', 'Recommended', 'Authentication', 'History'])
  })

  it('defines the five Figma action rows in order', () => {
    expect(TOOL_ACTIONS.map((a) => a.name)).toEqual([
      'Action name 001', 'Action name 002', 'Action name 003',
      'Action name 004', 'Action name 005',
    ])
  })

  it('matches the Figma-exact type/state/conversations per row', () => {
    expect(TOOL_ACTIONS[0]).toMatchObject({ type: 'API', state: 'Live', conversations: 100, iconTint: 'blue' })
    expect(TOOL_ACTIONS[1]).toMatchObject({ type: 'Imported', state: 'Read only', conversations: 40, iconTint: 'slate' })
    expect(TOOL_ACTIONS[2]).toMatchObject({ type: 'Imported', state: 'Read only', conversations: 1000, iconTint: 'slate' })
    expect(TOOL_ACTIONS[3]).toMatchObject({ type: 'MCP', state: 'Live', conversations: 950, iconTint: 'blue' })
    expect(TOOL_ACTIONS[4]).toMatchObject({ type: 'Browser', state: 'Auto-saved', conversations: 200, iconTint: 'blue' })
  })

  it('gives only the first two rows an agents chip', () => {
    expect(TOOL_ACTIONS[0].agents).toMatchObject({ label: 'Agent name', extra: 5 })
    expect(TOOL_ACTIONS[1].agents).toMatchObject({ label: 'Agent name', extra: 5 })
    expect(TOOL_ACTIONS[2].agents).toBeNull()
    expect(TOOL_ACTIONS[3].agents).toBeNull()
    expect(TOOL_ACTIONS[4].agents).toBeNull()
  })

  it('uses a static Name header count of 113', () => {
    expect(NAME_COUNT).toBe(113)
  })
})
