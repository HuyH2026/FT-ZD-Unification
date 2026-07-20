import { describe, it, expect } from 'vitest'
import { channelMeta } from './channel-meta'

describe('channelMeta', () => {
  it('maps a known channel to its display, color, and icon', () => {
    const meta = channelMeta('Web Widget')
    expect(meta.display).toBe('Widget')
    expect(meta.color).toBe('#e05c34')
    expect(meta.Icon).toBeDefined()
  })

  it('falls back for an unknown channel', () => {
    const meta = channelMeta('Carrier Pigeon')
    expect(meta.display).toBe('Carrier Pigeon')
    expect(meta.color).toBe('#646864')
    expect(meta.Icon).toBeDefined()
  })
})
