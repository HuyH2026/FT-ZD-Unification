// Deterministic, backend-free dashboard generator. Given a role, focus areas, and
// an optional free-text prompt, it scores the existing widgets and returns a
// { left, right } layout. No LLM, no Date.now()/Math.random() — same input always
// yields the same output. The widget id universe mirrors WidgetId in dashboard-data.
import type { WidgetId, Layout } from './dashboard-data'

export type Role = 'ops' | 'quality' | 'knowledge' | 'exec' | 'pm'
// Grid roles reorder the shared support widgets; 'pm' renders a bespoke layout.
export type GridRole = Exclude<Role, 'pm'>
export type FocusArea = 'resolution' | 'actions' | 'quality' | 'knowledge' | 'cost'

// UI option lists (order matters — tests and the panel rely on it).
export const ROLES: { key: Role; label: string }[] = [
  { key: 'ops', label: 'Ops lead' },
  { key: 'quality', label: 'Quality lead' },
  { key: 'knowledge', label: 'Knowledge manager' },
  { key: 'exec', label: 'Executive' },
  { key: 'pm', label: 'Product manager' },
]

export const FOCUS_AREAS: { key: FocusArea; label: string }[] = [
  { key: 'resolution', label: 'Resolution & health' },
  { key: 'actions', label: 'Approvals & actions' },
  { key: 'quality', label: 'Quality & testing' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'cost', label: 'Cost & usage' },
]

// Each widget's themes. A widget with no matching focus scores 0 (still eligible
// via the canonical order tail so layouts are never sparse).
const WIDGET_TAGS: Record<WidgetId, FocusArea[]> = {
  health: ['resolution'],
  intents: ['resolution'],
  approvals: ['actions'],
  activity: ['actions'],
  notifications: ['actions'],
  qa: ['quality'],
  policies: ['quality'],
  gaps: ['knowledge'],
  knowledge: ['knowledge'],
  cost: ['cost'],
}

// Focus areas implied by a role when the user picks none.
const ROLE_BASELINE: Record<GridRole, FocusArea[]> = {
  ops: ['resolution', 'actions'],
  quality: ['quality', 'resolution'],
  knowledge: ['knowledge', 'actions'],
  exec: ['resolution', 'cost'],
}

// Free-text keywords → the focus area they imply.
const PROMPT_KEYWORDS: { term: string; focus: FocusArea }[] = [
  { term: 'cost', focus: 'cost' },
  { term: 'spend', focus: 'cost' },
  { term: 'budget', focus: 'cost' },
  { term: 'resolution', focus: 'resolution' },
  { term: 'health', focus: 'resolution' },
  { term: 'csat', focus: 'resolution' },
  { term: 'approval', focus: 'actions' },
  { term: 'action', focus: 'actions' },
  { term: 'quality', focus: 'quality' },
  { term: 'test', focus: 'quality' },
  { term: 'knowledge', focus: 'knowledge' },
  { term: 'gap', focus: 'knowledge' },
  { term: 'article', focus: 'knowledge' },
]

// Stable tie-break order (also the fallback tail so no layout is empty).
const WIDGET_ORDER: WidgetId[] = [
  'health', 'approvals', 'policies', 'qa', 'gaps',
  'knowledge', 'intents', 'cost', 'activity', 'notifications',
]

// Widgets always present regardless of scoring.
const CORE: WidgetId[] = ['health', 'approvals']

export function generateLayout(input: {
  role: Role
  focuses: FocusArea[]
  prompt?: string
}): Layout {
  const baseline = input.role === 'pm' ? [] : ROLE_BASELINE[input.role]
  const effective = input.focuses.length > 0 ? input.focuses : baseline
  const focusSet = new Set<FocusArea>(effective)

  // Prompt keywords add extra weight to their focus.
  const promptText = (input.prompt ?? '').toLowerCase()
  const promptFocuses = new Set<FocusArea>(
    PROMPT_KEYWORDS.filter((k) => promptText.includes(k.term)).map((k) => k.focus),
  )

  const score = (id: WidgetId): number => {
    const tags = WIDGET_TAGS[id]
    let s = 0
    for (const t of tags) {
      if (focusSet.has(t)) s += 2
      if (promptFocuses.has(t)) s += 1
    }
    if (CORE.includes(id)) s += 0.5 // gentle nudge so core sits high, not forced to top
    return s
  }

  // Rank all widgets: score desc, then canonical order for stable ties.
  const ranked = [...WIDGET_ORDER].sort((a, b) => {
    const diff = score(b) - score(a)
    if (diff !== 0) return diff
    return WIDGET_ORDER.indexOf(a) - WIDGET_ORDER.indexOf(b)
  })

  // Split into two columns: highest-ranked to the top of the left column,
  // alternating so both columns fill. Even indices (0, 2, 4…) — the highest-ranked
  // picks — go to the left/primary column.
  const left: WidgetId[] = []
  const right: WidgetId[] = []
  ranked.forEach((id, i) => {
    if (i % 2 === 0) left.push(id)
    else right.push(id)
  })

  return { left, right }
}

// --- PM dashboard widgets (bespoke layout, ordered list not two columns) -----
export type PmWidgetId = 'pm-kpis' | 'pm-spotlight' | 'pm-lifecycle' | 'pm-feed'
export const PM_WIDGET_ID_LIST: PmWidgetId[] = ['pm-kpis', 'pm-spotlight', 'pm-lifecycle', 'pm-feed']
export const DEFAULT_PM_LAYOUT: PmWidgetId[] = ['pm-kpis', 'pm-spotlight', 'pm-lifecycle', 'pm-feed']
