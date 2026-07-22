// Mock data + types for the Tool Builder screen. Values are illustrative
// (no backend) and match the Figma frame (node 747:86563) exactly.

export type ToolTab = 'Available' | 'Recommended' | 'Authentication' | 'History'
export const TOOL_TABS: ToolTab[] = ['Available', 'Recommended', 'Authentication', 'History']

export type ToolType = 'API' | 'Imported' | 'MCP' | 'Browser'
export type ToolState = 'Live' | 'Read only' | 'Auto-saved'

export type ToolAction = {
  id: string
  name: string                 // "Action name 001"
  description: string          // "Placeholder for action description"
  type: ToolType
  iconTint: 'blue' | 'slate'   // #3492ef vs #acbdd5 avatar
  agents: { label: string; extra: number } | null  // "Agent name +5" | null → "n/a"
  conversations: number        // 100, 40, 1000, 950, 200
  state: ToolState
  lastModified: string         // "Feb 13, 2024, 12:43 PM"
}

// The "Name (113)" header count is a fixed design label, not TOOL_ACTIONS.length.
export const NAME_COUNT = 113

const DESC = 'Placeholder for action description'
const MODIFIED = 'Feb 13, 2024, 12:43 PM'
const AGENTS = { label: 'Agent name', extra: 5 }

export const TOOL_ACTIONS: ToolAction[] = [
  { id: 't1', name: 'Action name 001', description: DESC, type: 'API', iconTint: 'blue', agents: AGENTS, conversations: 100, state: 'Live', lastModified: MODIFIED },
  { id: 't2', name: 'Action name 002', description: DESC, type: 'Imported', iconTint: 'slate', agents: AGENTS, conversations: 40, state: 'Read only', lastModified: MODIFIED },
  { id: 't3', name: 'Action name 003', description: DESC, type: 'Imported', iconTint: 'slate', agents: null, conversations: 1000, state: 'Read only', lastModified: MODIFIED },
  { id: 't4', name: 'Action name 004', description: DESC, type: 'MCP', iconTint: 'blue', agents: null, conversations: 950, state: 'Live', lastModified: MODIFIED },
  { id: 't5', name: 'Action name 005', description: DESC, type: 'Browser', iconTint: 'blue', agents: null, conversations: 200, state: 'Auto-saved', lastModified: MODIFIED },
]
