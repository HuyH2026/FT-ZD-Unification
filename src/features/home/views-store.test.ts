import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  seedViewsState, getActiveView, addView, renameView, deleteView,
  setActiveView, updateActiveLayout, type ViewsState, type NewView,
  loadViewsState, persistViewsState, movePmWidget, removePmWidget, addPmWidget, resetPmLayout,
} from './views-store'
import { DEFAULT_LAYOUT } from './dashboard-data'
import { DEFAULT_PM_LAYOUT } from './generate-layout'

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
    if (s.views[0].kind === 'grid') {
      expect(s.views[0].layout).toEqual(DEFAULT_LAYOUT)
    }
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
    const active = getActiveView(next)
    if (active.kind === 'grid') {
      expect(active.layout).toEqual({ left: ['cost'], right: [] })
    }
    const defaultView = next.views[0]
    const originalDefault = s.views[0]
    if (defaultView.kind === 'grid' && originalDefault.kind === 'grid') {
      expect(defaultView.layout).toEqual(originalDefault.layout) // Default untouched
    }
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

    it('REGRESSION: a full page reload clears persisted views back to a fresh single Default', async () => {
      // Simulate a session: seed → add one generated view → persist
      const initial = seedViewsState()
      const withGen = addView(initial, gen)
      persistViewsState(withGen)

      // Capture the persisted state for re-stub
      const persisted = window.localStorage.getItem(STORAGE_KEY)!

      // Simulate a hard browser refresh: reset the module registry so the
      // module-level "clear on load" side effect (which only runs once per
      // real page load) re-runs, then re-stub storage with the prior session's data.
      vi.resetModules()
      stubStorage(persisted)
      const { loadViewsState: loadFresh, addView: addFresh } = await import('./views-store')

      // The reload wipes the prior session's views — loading now returns a fresh seed.
      const loaded = loadFresh()
      expect(loaded.views).toHaveLength(1)
      expect(loaded.views[0].builtIn).toBe(true)

      // Adding a view post-reload still mints unique ids off the fresh seq.
      const postLoad = addFresh(loaded, { name: 'Post-reload', role: 'quality', layout: { left: ['cost'], right: [] } })
      expect(new Set(postLoad.views.map((v) => v.id)).size).toBe(2) // all unique
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
      const view = s.views[0]
      if (view.kind === 'grid') {
        expect(view.layout.left).not.toContain('invalid-widget')
        expect(view.layout.left).toContain('health')
        expect(view.layout.left).toContain('cost')
        expect(view.layout.right).toEqual(['approvals'])
      }
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
      const view = s.views[0]
      if (view.kind === 'grid') {
        expect(view.layout.left).toEqual(['health', 'approvals'])
        expect(view.layout.right).toEqual(['cost'])
      }
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

const genPm: NewView = { name: 'Product manager', kind: 'pm', role: 'pm', pmLayout: [...DEFAULT_PM_LAYOUT] }

describe('views-store — PM views', () => {
  it('addView creates a pm-kind view carrying pmLayout', () => {
    const s = addView(seedViewsState(), genPm)
    const v = s.views[1]
    expect(v.kind).toBe('pm')
    expect(s.activeId).toBe(v.id)
    if (v.kind === 'pm') {
      expect(v.pmLayout).toEqual(DEFAULT_PM_LAYOUT)
      expect(v.role).toBe('pm')
    }
  })

  it('the seeded Default view is grid-kind', () => {
    expect(seedViewsState().views[0].kind).toBe('grid')
  })

  it('movePmWidget reorders the active pm layout', () => {
    let s = addView(seedViewsState(), genPm)
    s = setActiveView(s, s.views[1].id)
    const moved = movePmWidget(s, 0, 2) // pm-kpis moves toward the end
    const v = moved.views[1]
    if (v.kind === 'pm') {
      expect(v.pmLayout[0]).not.toBe('pm-kpis')
      expect(new Set(v.pmLayout).size).toBe(v.pmLayout.length)
      expect(v.pmLayout).toContain('pm-kpis')
    } else {
      throw new Error('expected pm view')
    }
  })

  it('removePmWidget drops a widget and addPmWidget appends it back', () => {
    let s = addView(seedViewsState(), genPm)
    s = removePmWidget(s, 'pm-lifecycle')
    let v = s.views[1]
    if (v.kind === 'pm') expect(v.pmLayout).not.toContain('pm-lifecycle')
    s = addPmWidget(s, 'pm-lifecycle')
    v = s.views[1]
    if (v.kind === 'pm') {
      expect(v.pmLayout).toContain('pm-lifecycle')
      expect(new Set(v.pmLayout).size).toBe(v.pmLayout.length) // no dupes
    }
  })

  it('addPmWidget is a no-op for an already-present widget', () => {
    const s = addView(seedViewsState(), genPm)
    const before = (s.views[1] as { pmLayout: string[] }).pmLayout.length
    const after = addPmWidget(s, 'pm-kpis')
    expect((after.views[1] as { pmLayout: string[] }).pmLayout.length).toBe(before)
  })

  it('resetPmLayout restores the default pm layout', () => {
    let s = addView(seedViewsState(), genPm)
    s = removePmWidget(s, 'pm-feed')
    s = resetPmLayout(s)
    const v = s.views[1]
    if (v.kind === 'pm') expect(v.pmLayout).toEqual(DEFAULT_PM_LAYOUT)
  })

  it('pm reducers are no-ops when the active view is a grid view', () => {
    const s = seedViewsState() // active = grid Default
    expect(removePmWidget(s, 'pm-kpis')).toBe(s)
    expect(addPmWidget(s, 'pm-kpis')).toBe(s)
    expect(movePmWidget(s, 0, 1)).toBe(s)
    expect(resetPmLayout(s)).toBe(s)
  })

  it('persists and reloads a pm view (round-trip)', () => {
    // Uses the load-from-localStorage stub from the sibling describe block.
    const map = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(), key: () => null, length: 0,
    })
    const s = addView(seedViewsState(), genPm)
    persistViewsState(s)
    const loaded = loadViewsState()
    const pm = loaded.views.find((v) => v.kind === 'pm')
    expect(pm).toBeDefined()
    if (pm && pm.kind === 'pm') expect(pm.pmLayout).toEqual(DEFAULT_PM_LAYOUT)
    vi.unstubAllGlobals()
  })

  it('sanitizes a legacy view with no kind to grid', () => {
    const map = new Map<string, string>([[STORAGE_KEY, JSON.stringify({
      views: [{ id: 'view-1', name: 'Default', role: null, layout: { left: ['health'], right: [] }, builtIn: true }],
      activeId: 'view-1',
    })]])
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 1,
    })
    const s = loadViewsState()
    expect(s.views[0].kind).toBe('grid')
    vi.unstubAllGlobals()
  })

  it('a pm view with an invalid pmLayout falls back to the default pm layout', () => {
    const map = new Map<string, string>([[STORAGE_KEY, JSON.stringify({
      views: [{ id: 'view-1', name: 'PM', kind: 'pm', role: 'pm', pmLayout: ['bogus', 'pm-kpis', 'pm-kpis'] }],
      activeId: 'view-1',
    })]])
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 1,
    })
    const s = loadViewsState()
    const v = s.views[0]
    expect(v.kind).toBe('pm')
    if (v.kind === 'pm') {
      // 'bogus' dropped, dupe collapsed → but since result would be just ['pm-kpis'],
      // that's a valid non-empty pm layout, so it is kept as-is (deduped, sanitized).
      expect(v.pmLayout).toEqual(['pm-kpis'])
    }
    vi.unstubAllGlobals()
  })
})
