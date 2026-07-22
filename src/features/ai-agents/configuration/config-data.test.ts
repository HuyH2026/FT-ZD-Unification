import { describe, it, expect } from 'vitest'
import { CHANNEL_TABS, SEED_BRANDS, BRAND_LIST_LABELS, RAIL_SECTIONS } from './config-data'

describe('config-data', () => {
  it('has four channel tabs starting with widget', () => {
    expect(CHANNEL_TABS.map((t) => t.id)).toEqual(['widget', 'voice', 'webcall', 'headless'])
  })

  it('seeds three brands with vip default+enabled', () => {
    expect(SEED_BRANDS.map((b) => b.id)).toEqual(['vip', 'member', 'partner'])
    const vip = SEED_BRANDS.find((b) => b.id === 'vip')!
    expect(vip.isDefault).toBe(true)
    expect(vip.enabled).toBe(true)
    expect(vip.name).toBe('SpaceX support')
    expect(vip.tags.length).toBe(4)
  })

  it('maps brand ids to short list labels', () => {
    expect(BRAND_LIST_LABELS.vip).toBe('VIP')
    expect(BRAND_LIST_LABELS.member).toBe('Member')
    expect(BRAND_LIST_LABELS.partner).toBe('Partner')
  })

  it('rail sections lead with brands and each carries an icon', () => {
    expect(RAIL_SECTIONS[0].id).toBe('brands')
    expect(RAIL_SECTIONS.every((s) => typeof s.icon === 'function' || typeof s.icon === 'object')).toBe(true)
  })
})
