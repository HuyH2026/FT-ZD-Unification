import { describe, it, expect } from 'vitest'
import {
  seedViewsState, getActiveView, addView, renameView, deleteView,
  setActiveView, updateActiveLayout, type ViewsState,
} from './views-store'
import { DEFAULT_LAYOUT } from './dashboard-data'

const gen = { name: 'Ops lead', role: 'ops' as const, layout: { left: ['health'], right: ['approvals'] } }

describe('views-store', () => {
  it('seeds a single built-in Default view, active', () => {
    const s = seedViewsState()
    expect(s.views).toHaveLength(1)
    expect(s.views[0].name).toBe('Default')
    expect(s.views[0].role).toBeNull()
    expect(s.views[0].builtIn).toBe(true)
    expect(s.activeId).toBe(s.views[0].id)
    expect(s.views[0].layout).toEqual(DEFAULT_LAYOUT)
  })

  it('getActiveView returns the active view', () => {
    const s = seedViewsState()
    expect(getActiveView(s)).toBe(s.views[0])
  })

  it('addView appends a new view and makes it active with a unique id', () => {
    const s = addView(seedViewsState(), gen)
    expect(s.views).toHaveLength(2)
    expect(s.views[1].name).toBe('Ops lead')
    expect(s.views[1].role).toBe('ops')
    expect(s.activeId).toBe(s.views[1].id)
    expect(s.views[1].id).not.toBe(s.views[0].id)
  })

  it('renameView renames; rejects empty/whitespace names', () => {
    const s = addView(seedViewsState(), gen)
    const id = s.views[1].id
    expect(getActiveView(renameView(s, id, 'My Ops')).name).toBe('My Ops')
    expect(renameView(s, id, '   ')).toBe(s) // unchanged
  })

  it('deleteView removes a view; refuses to delete the built-in Default', () => {
    const s = addView(seedViewsState(), gen)
    const builtInId = s.views[0].id
    const genId = s.views[1].id
    expect(deleteView(s, builtInId)).toBe(s) // built-in protected
    const after = deleteView(s, genId)
    expect(after.views).toHaveLength(1)
    expect(after.views[0].id).toBe(builtInId)
  })

  it('deleting the active view falls back to the built-in view', () => {
    let s: ViewsState = addView(seedViewsState(), gen)
    const builtInId = s.views[0].id
    const genId = s.views[1].id // active
    s = deleteView(s, genId)
    expect(s.activeId).toBe(builtInId)
  })

  it('setActiveView switches active; ignores unknown ids', () => {
    const s = addView(seedViewsState(), gen)
    const builtInId = s.views[0].id
    expect(setActiveView(s, builtInId).activeId).toBe(builtInId)
    expect(setActiveView(s, 'nope')).toBe(s)
  })

  it('updateActiveLayout replaces only the active view layout', () => {
    const s = addView(seedViewsState(), gen)
    const next = updateActiveLayout(s, { left: ['cost'], right: [] })
    expect(getActiveView(next).layout).toEqual({ left: ['cost'], right: [] })
    expect(next.views[0].layout).toEqual(s.views[0].layout) // Default untouched
  })
})
