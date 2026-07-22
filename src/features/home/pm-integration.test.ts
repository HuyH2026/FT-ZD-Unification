import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadPmIntegration, persistPmIntegration, type PmIntegration } from './pm-integration'

const KEY = 'home-pm-integration-v1'

function stubStorage(stored?: string) {
  const map = new Map<string, string>(stored ? [[KEY, stored]] : [])
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: map.size,
  })
}

describe('pm-integration', () => {
  beforeEach(() => stubStorage())

  it('defaults to disconnected when nothing stored', () => {
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })

  it('round-trips a connected state', () => {
    const s: PmIntegration = { connected: true, tool: 'jira' }
    persistPmIntegration(s)
    expect(loadPmIntegration()).toEqual(s)
  })

  it('sanitizes an unknown tool to disconnected', () => {
    stubStorage(JSON.stringify({ connected: true, tool: 'bogus' }))
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })

  it('treats connected:true with null tool as disconnected', () => {
    stubStorage(JSON.stringify({ connected: true, tool: null }))
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })

  it('falls back to default on malformed JSON', () => {
    stubStorage('{bad json')
    expect(loadPmIntegration()).toEqual({ connected: false, tool: null })
  })
})
