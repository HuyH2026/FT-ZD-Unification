// Backend-free store for the Home dashboard's saved views. Owns load/validate/
// seed/persist plus pure reducers. Kept out of the component so the logic is
// unit-testable and HomeScreen stays focused. Ids are minted from a module seq
// counter (no Date.now()/Math.random(), which are unavailable here) — same
// pattern as src/app/org-context.tsx.
import { DEFAULT_LAYOUT, WIDGET_ID_LIST, type Layout, type WidgetId } from './dashboard-data'
import { DEFAULT_PM_LAYOUT, PM_WIDGET_ID_LIST, type Role, type PmWidgetId } from './generate-layout'

export type GridView = {
  id: string; name: string; kind: 'grid'
  role: Role | null; layout: Layout
  builtIn?: boolean // the Default view: renamable but NOT deletable
}
export type PmView = {
  id: string; name: string; kind: 'pm'
  role: 'pm'; pmLayout: PmWidgetId[]
  builtIn?: boolean
}
export type DashboardView = GridView | PmView
export type ViewsState = { views: DashboardView[]; activeId: string }

export type NewGridView = { name: string; kind?: 'grid'; role: Role | null; layout: Layout }
export type NewPmView = { name: string; kind: 'pm'; role: 'pm'; pmLayout: PmWidgetId[] }
export type NewView = NewGridView | NewPmView

const STORAGE_KEY = 'home-dashboard-views-v1'

// Clear persisted dashboard views once per full page load (this module body
// runs exactly once per browser refresh, not per SPA navigation), so a hard
// refresh always starts the Home dashboard from the clean seeded view instead
// of carrying over previous demo/session edits.
try {
  window.localStorage?.removeItem(STORAGE_KEY)
} catch {
  /* ignore missing/unavailable storage */
}

const WIDGET_IDS = new Set<string>(WIDGET_ID_LIST)
const PM_WIDGET_IDS = new Set<string>(PM_WIDGET_ID_LIST)
const ROLE_KEYS = new Set<string>(['ops', 'quality', 'knowledge', 'exec', 'pm'])

let seq = 0
function mintId(): string {
  return `view-${++seq}`
}

function syncSeqTo(views: DashboardView[]): void {
  for (const v of views) {
    const m = /^view-(\d+)$/.exec(v.id)
    if (m) seq = Math.max(seq, Number(m[1]))
  }
}

export function seedViewsState(): ViewsState {
  const id = mintId()
  return {
    views: [{ id, name: 'Default', kind: 'grid', role: null, layout: DEFAULT_LAYOUT, builtIn: true }],
    activeId: id,
  }
}

// --- Load / validate / persist ----------------------------------------------
// Own-key membership (WIDGET_IDS.has), never the `in` operator, so a crafted
// blob can't resolve inherited prototype keys to a non-widget and crash render.
function sanitizeLayoutArr(arr: unknown): WidgetId[] {
  if (!Array.isArray(arr)) return []
  return arr.filter((x): x is WidgetId => typeof x === 'string' && WIDGET_IDS.has(x))
}

function sanitizeLayout(layout: unknown): Layout | null {
  if (typeof layout !== 'object' || layout === null) return null
  const { left, right } = layout as { left?: unknown; right?: unknown }
  const leftSanitized = sanitizeLayoutArr(left)
  const rightSanitized = sanitizeLayoutArr(right)
  if (leftSanitized.length === 0 && rightSanitized.length === 0) return null
  const seen = new Set<WidgetId>()
  const dedupe = (a: WidgetId[]) => a.filter((id) => !seen.has(id) && seen.add(id))
  return { left: dedupe(leftSanitized), right: dedupe(rightSanitized) }
}

function sanitizePmLayout(arr: unknown): PmWidgetId[] {
  if (!Array.isArray(arr)) return [...DEFAULT_PM_LAYOUT]
  const seen = new Set<PmWidgetId>()
  const cleaned = arr.filter((x): x is PmWidgetId =>
    typeof x === 'string' && PM_WIDGET_IDS.has(x) && !seen.has(x as PmWidgetId) && seen.add(x as PmWidgetId) !== undefined,
  )
  return cleaned.length > 0 ? cleaned : [...DEFAULT_PM_LAYOUT]
}

function sanitizeView(v: unknown): DashboardView | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  const builtIn = o.builtIn === true ? { builtIn: true as const } : {}

  if (o.kind === 'pm') {
    return { id: o.id, name: o.name, kind: 'pm', role: 'pm', pmLayout: sanitizePmLayout(o.pmLayout), ...builtIn }
  }
  // Default/legacy → grid
  const layout = sanitizeLayout(o.layout)
  if (!layout) return null
  const role =
    o.role === null || (typeof o.role === 'string' && ROLE_KEYS.has(o.role) && o.role !== 'pm')
      ? (o.role as Role | null)
      : null
  return { id: o.id, name: o.name, kind: 'grid', role, layout, ...builtIn }
}

export function loadViewsState(): ViewsState {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return seedViewsState()
    const parsed = JSON.parse(raw) as { views?: unknown; activeId?: unknown }
    if (!Array.isArray(parsed.views)) return seedViewsState()
    const views = parsed.views
      .map(sanitizeView)
      .filter((v): v is DashboardView => v !== null)
    if (views.length === 0) return seedViewsState()
    syncSeqTo(views)
    const activeId =
      typeof parsed.activeId === 'string' && views.some((v) => v.id === parsed.activeId)
        ? parsed.activeId
        : views[0].id
    return { views, activeId }
  } catch {
    return seedViewsState()
  }
}

export function persistViewsState(state: ViewsState): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

// --- Pure reducers -----------------------------------------------------------
export function getActiveView(state: ViewsState): DashboardView {
  return state.views.find((v) => v.id === state.activeId) ?? state.views[0]
}

export function addView(state: ViewsState, view: NewView): ViewsState {
  const id = mintId()
  const created: DashboardView =
    view.kind === 'pm'
      ? { id, name: view.name, kind: 'pm', role: 'pm', pmLayout: [...view.pmLayout] }
      : { id, name: view.name, kind: 'grid', role: view.role, layout: view.layout }
  return { views: [...state.views, created], activeId: id }
}

export function renameView(state: ViewsState, id: string, name: string): ViewsState {
  const trimmed = name.trim()
  if (trimmed === '') return state
  return { ...state, views: state.views.map((v) => (v.id === id ? { ...v, name: trimmed } : v)) }
}

export function deleteView(state: ViewsState, id: string): ViewsState {
  const target = state.views.find((v) => v.id === id)
  if (!target || target.builtIn) return state
  const views = state.views.filter((v) => v.id !== id)
  if (views.length === 0) return state
  const activeId =
    state.activeId === id ? (views.find((v) => v.builtIn)?.id ?? views[0].id) : state.activeId
  return { views, activeId }
}

export function setActiveView(state: ViewsState, id: string): ViewsState {
  if (!state.views.some((v) => v.id === id)) return state
  return { ...state, activeId: id }
}

export function updateActiveLayout(state: ViewsState, layout: Layout): ViewsState {
  return {
    ...state,
    views: state.views.map((v) =>
      v.id === state.activeId && v.kind === 'grid' ? { ...v, layout } : v,
    ),
  }
}

// --- PM view reducers (operate on the active view only when it is a pm view) --
function mapActivePm(state: ViewsState, fn: (pm: PmView) => PmView): ViewsState {
  const active = getActiveView(state)
  if (active.kind !== 'pm') return state
  return { ...state, views: state.views.map((v) => (v.id === state.activeId && v.kind === 'pm' ? fn(v) : v)) }
}

export function movePmWidget(state: ViewsState, fromIndex: number, toIndex: number): ViewsState {
  return mapActivePm(state, (pm) => {
    const next = [...pm.pmLayout]
    if (fromIndex < 0 || fromIndex >= next.length) return pm
    const [moved] = next.splice(fromIndex, 1)
    const clamped = Math.max(0, Math.min(toIndex, next.length))
    next.splice(clamped, 0, moved)
    return { ...pm, pmLayout: next }
  })
}

export function removePmWidget(state: ViewsState, id: PmWidgetId): ViewsState {
  return mapActivePm(state, (pm) => ({ ...pm, pmLayout: pm.pmLayout.filter((w) => w !== id) }))
}

export function addPmWidget(state: ViewsState, id: PmWidgetId): ViewsState {
  return mapActivePm(state, (pm) => (pm.pmLayout.includes(id) ? pm : { ...pm, pmLayout: [...pm.pmLayout, id] }))
}

export function resetPmLayout(state: ViewsState): ViewsState {
  return mapActivePm(state, (pm) => ({ ...pm, pmLayout: [...DEFAULT_PM_LAYOUT] }))
}
