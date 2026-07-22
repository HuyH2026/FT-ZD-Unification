// src/features/orchestrator/journey/useJourneyStorage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJourneyStorage, JOURNEY_KEY } from './useJourneyStorage'
import { SEED_JOURNEYS } from './journey-data'

describe('useJourneyStorage', () => {
  beforeEach(() => {
    try { window.localStorage?.clear() } catch { /* jsdom has no localStorage */ }
  })

  it('returns the seed graph for a known id on first load', () => {
    const { result } = renderHook(() => useJourneyStorage('a1'))
    expect(result.current.nodes.length).toBe(SEED_JOURNEYS.a1.nodes.length)
    expect(result.current.edges.length).toBe(SEED_JOURNEYS.a1.edges.length)
  })

  it('returns an empty graph for an unknown id', () => {
    const { result } = renderHook(() => useJourneyStorage('unknown'))
    expect(result.current.nodes).toEqual([])
    expect(result.current.edges).toEqual([])
  })

  it('does not throw when setNodes is called (in-memory update works)', () => {
    const { result } = renderHook(() => useJourneyStorage('a2'))
    act(() => { result.current.setNodes((n) => n.slice(0, 1)) })
    expect(result.current.nodes.length).toBe(1)
  })

  it('builds the storage key from the automation id', () => {
    expect(JOURNEY_KEY('a1')).toBe('orchestrator-journey-a1-v1')
  })
})
