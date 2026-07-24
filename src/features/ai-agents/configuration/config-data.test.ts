import { describe, it, expect } from 'vitest'
import {
  CHANNEL_TABS, SEED_BRANDS, BRAND_LIST_LABELS, RAIL_SECTIONS, summarizeTags,
  emptyPersonality, TONE_PRESET_OPTIONS, AI_PERSONALITY_COPY,
  HEADLESS_STEPS, A2A_AGENT_CARD_URL, A2A_MESSAGE_ENDPOINT, nextApiKey, seedApiKey,
} from './config-data'

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

  it('rail sections lead with brands and each carries a Garden icon name', () => {
    expect(RAIL_SECTIONS[0].id).toBe('brands')
    expect(RAIL_SECTIONS.every((s) => typeof s.icon === 'string' && s.icon.length > 0)).toBe(true)
  })

  it('summarizes tags with a +N overflow past two', () => {
    expect(summarizeTags([])).toBe('')
    expect(summarizeTags(['A'])).toBe('A')
    expect(summarizeTags(['A', 'B'])).toBe('A, B')
    expect(summarizeTags(['A', 'B', 'C', 'D'])).toBe('A, B, +2')
  })

  it('seeds every brand with an empty personality', () => {
    for (const b of SEED_BRANDS) {
      expect(b.personality).toEqual({
        generalContext: '',
        glossary: '',
        toneFreeform: '',
        toneUseFreeform: false,
        toneUsePresets: false,
        tonePresets: [],
      })
    }
  })

  it('exposes the six tone presets in order', () => {
    expect(TONE_PRESET_OPTIONS).toEqual([
      'Empathetic', 'Friendly', 'Professional', 'Straightforward', 'Humorous', 'Formal',
    ])
  })

  it('provides copy for the three AI Personality sections', () => {
    expect(AI_PERSONALITY_COPY.generalContext.label).toBe('General Context')
    expect(AI_PERSONALITY_COPY.glossary.label).toBe('Glossary')
    expect(AI_PERSONALITY_COPY.tone.label).toBe('Tone of Voice')
  })

  it('emptyPersonality returns a fresh empty object each call', () => {
    const a = emptyPersonality()
    const b = emptyPersonality()
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
  })
})

describe('config-data — headless', () => {
  it('has four headless steps with the expected titles in order', () => {
    expect(HEADLESS_STEPS.map((s) => s.title)).toEqual([
      'Add Forethought as an A2A agent',
      'Authenticate with your API key',
      "Pass the end-user's identity",
      'Send a message',
    ])
    expect(HEADLESS_STEPS.map((s) => s.n)).toEqual(['01', '02', '03', '04'])
    expect(HEADLESS_STEPS.every((s) => s.code.length > 0 && s.body.length > 0)).toBe(true)
  })

  it('exposes the A2A endpoint URLs', () => {
    expect(A2A_AGENT_CARD_URL).toMatch(/agent-card\.json$/)
    expect(A2A_MESSAGE_ENDPOINT).toMatch(/\/v1\/message$/)
  })

  it('nextApiKey returns distinct ft_a2a_live_ keys on successive calls', () => {
    const a = nextApiKey()
    const b = nextApiKey()
    expect(a).toMatch(/^ft_a2a_live_/)
    expect(b).toMatch(/^ft_a2a_live_/)
    expect(a).not.toBe(b)
  })

  it('seedApiKey is a stable ft_a2a_live_ key', () => {
    expect(seedApiKey()).toBe(seedApiKey())
    expect(seedApiKey()).toMatch(/^ft_a2a_live_/)
  })
})
