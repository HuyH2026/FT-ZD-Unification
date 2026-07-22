import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  seedViewsState, getActiveView, addView, renameView, deleteView,
  setActiveView, updateActiveLayout, type ViewsState, type NewView,
  loadViewsState, persistViewsState,
} from './views-store'
import { DEFAULT_LAYOUT } from './dashboard-data'

const gen: NewView = { name: 'Ops lead', role: 'ops', layout: { left: ['health'], right: ['approvals'] } }

const STORAGE_KEY = 'home-dashboard-views-v1'

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

  describe('load from localStorage', () => {
    function stubStorage(stored?: string) {
      const map = new Map<string, string>(stored ? [[STORAGE_KEY, stored]] : [])
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
        clear: () => map.clear(),
        key: () => null,
        length: map.size,
      })
    }

    beforeEach(() => {
      stubStorage()
    })

    it('REGRESSION: seq counter syncs on load to prevent id collisions after reload', async () => {
      // Simulate a session: seed → add one generated view → persist
      const initial = seedViewsState()
      const defaultId = initial.views[0].id // will be view-1
      const withGen = addView(initial, gen)
      const genId = withGen.views[1].id // will be view-2
      persistViewsState(withGen)

      // Capture the persisted state for re-stub
      const persisted = window.localStorage.getItem(STORAGE_KEY)!

      // Simulate reload: reset module (seq counter resets to 0)
      vi.resetModules()
      stubStorage(persisted) // re-stub with persisted data
      const { loadViewsState: loadFresh, addView: addFresh } = await import('./views-store')

      // Load persisted state
      const loaded = loadFresh()
      expect(loaded.views).toHaveLength(2)
      const loadedIds = loaded.views.map((v) => v.id)
      expect(loadedIds).toContain(defaultId)
      expect(loadedIds).toContain(genId)

      // Add a new view post-load — its id MUST NOT collide with any loaded id
      const postLoad = addFresh(loaded, { name: 'Post-reload', role: 'quality', layout: { left: ['cost'], right: [] } })
      const newId = postLoad.views[2].id
      expect(newId).not.toBe(defaultId)
      expect(newId).not.toBe(genId)
      // This assertion will FAIL pre-fix because seq=0 mints view-1 again
      expect(new Set(postLoad.views.map((v) => v.id)).size).toBe(3) // all unique
    })

    it('loads and validates persisted views; drops invalid widget ids', () => {
      const blob = {
        views: [
          {
            id: 'view-1',
            name: 'Default',
            role: null,
            layout: { left: ['health', 'invalid-widget', 'cost'], right: ['approvals'] },
            builtIn: true,
          },
        ],
        activeId: 'view-1',
      }
      stubStorage(JSON.stringify(blob))
      const s = loadViewsState()
      expect(s.views).toHaveLength(1)
      const layout = s.views[0].layout
      expect(layout.left).not.toContain('invalid-widget')
      expect(layout.left).toContain('health')
      expect(layout.left).toContain('cost')
      expect(layout.right).toEqual(['approvals'])
    })

    it('deduplicates widget ids in a persisted layout', () => {
      const blob = {
        views: [
          {
            id: 'view-1',
            name: 'Default',
            role: null,
            layout: { left: ['health', 'health', 'approvals'], right: ['cost', 'cost'] },
          },
        ],
        activeId: 'view-1',
      }
      stubStorage(JSON.stringify(blob))
      const s = loadViewsState()
      expect(s.views[0].layout.left).toEqual(['health', 'approvals'])
      expect(s.views[0].layout.right).toEqual(['cost'])
    })

    it('sanitizes an unknown role to null', () => {
      const blob = {
        views: [
          {
            id: 'view-1',
            name: 'Bad Role',
            role: 'bogus-role',
            layout: { left: ['health'], right: [] },
          },
        ],
        activeId: 'view-1',
      }
      stubStorage(JSON.stringify(blob))
      const s = loadViewsState()
      expect(s.views[0].role).toBeNull()
    })

    it('falls back to seed when views is not an array', () => {
      stubStorage(JSON.stringify({ views: 'not-an-array' }))
      const s = loadViewsState()
      expect(s.views).toHaveLength(1)
      expect(s.views[0].name).toBe('Default')
      expect(s.views[0].builtIn).toBe(true)
    })

    it('falls back to seed when JSON is malformed', () => {
      stubStorage('{bad json')
      const s = loadViewsState()
      expect(s.views).toHaveLength(1)
      expect(s.views[0].name).toBe('Default')
    })

    it('falls back to seed when all persisted views are invalid', () => {
      const blob = {
        views: [
          { id: 'view-1', name: 'Bad', layout: 'not-an-object' },
          { id: 'view-2', layout: { left: [], right: [] } }, // missing name
        ],
        activeId: 'view-1',
      }
      stubStorage(JSON.stringify(blob))
      const s = loadViewsState()
      expect(s.views).toHaveLength(1)
      expect(s.views[0].name).toBe('Default')
    })

    it('corrects activeId when it points to a nonexistent view', () => {
      const blob = {
        views: [
          {
            id: 'view-1',
            name: 'Default',
            role: null,
            layout: { left: ['health'], right: [] },
          },
        ],
        activeId: 'nonexistent-id',
      }
      stubStorage(JSON.stringify(blob))
      const s = loadViewsState()
      expect(s.activeId).toBe('view-1')
    })
  })
})
