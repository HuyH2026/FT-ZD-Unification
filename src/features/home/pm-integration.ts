// Backend-free store for the PM dashboard's mock "connect a PM tool" flow.
// Persists which tool is connected so the opportunity cards can offer
// "Add to {Tool}". No real API — purely presentational connect state.
// Same load/validate/persist/guard pattern as views-store.ts.

export type PmTool = 'jira' | 'linear' | 'asana'
export type PmIntegration = { connected: boolean; tool: PmTool | null }

export const PM_TOOLS: { key: PmTool; label: string }[] = [
  { key: 'jira', label: 'Jira' },
  { key: 'linear', label: 'Linear' },
  { key: 'asana', label: 'Asana' },
]
export const PM_TOOL_LABEL: Record<PmTool, string> = {
  jira: 'Jira', linear: 'Linear', asana: 'Asana',
}

const STORAGE_KEY = 'home-pm-integration-v1'
const TOOL_KEYS = new Set<string>(['jira', 'linear', 'asana'])
const DISCONNECTED: PmIntegration = { connected: false, tool: null }

export function loadPmIntegration(): PmIntegration {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return { ...DISCONNECTED }
    const parsed = JSON.parse(raw) as { connected?: unknown; tool?: unknown }
    // Only a known tool string counts as connected — own-key membership, not `in`.
    if (parsed.connected === true && typeof parsed.tool === 'string' && TOOL_KEYS.has(parsed.tool)) {
      return { connected: true, tool: parsed.tool as PmTool }
    }
    return { ...DISCONNECTED }
  } catch {
    return { ...DISCONNECTED }
  }
}

export function persistPmIntegration(state: PmIntegration): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
