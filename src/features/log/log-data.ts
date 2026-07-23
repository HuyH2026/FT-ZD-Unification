// Mock data for the Log screen (Audit + Error tabs). All presentational — no
// backend. Timestamps are pre-formatted display strings (no Date usage here).
export type LogTab = 'Audit' | 'Error'
export const LOG_TABS: LogTab[] = ['Audit', 'Error']

export type AuditEntry = {
  id: string
  timestamp: string
  product: string
  action: string
  userEmail: string
}

export type Severity = 'High' | 'Medium' | 'Low'

export type ErrorEntry = {
  id: string
  timestamp: string
  product: string
  channel: string
  conversationId: string
  message: string
  severity: Severity
}

export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a1', timestamp: 'Jul 21, 2026, 1:39 PM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a2', timestamp: 'Jul 21, 2026, 1:38 PM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a3', timestamp: 'Jul 21, 2026, 1:37 PM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a4', timestamp: 'Jul 21, 2026, 1:36 PM', product: 'Solve', action: 'intent-deleted', userEmail: 'Forethought User' },
  { id: 'a5', timestamp: 'Jul 21, 2026, 1:17 PM', product: 'Solve', action: 'intent-deleted', userEmail: 'Forethought User' },
  { id: 'a6', timestamp: 'Jul 21, 2026, 11:38 AM', product: 'Solve', action: 'workflow-draft-discarded', userEmail: 'Forethought User' },
  { id: 'a7', timestamp: 'Jul 21, 2026, 11:37 AM', product: 'Solve', action: 'workflow-draft-discarded', userEmail: 'Forethought User' },
  { id: 'a8', timestamp: 'Jul 21, 2026, 10:51 AM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a9', timestamp: 'Jul 21, 2026, 10:40 AM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a10', timestamp: 'Jul 21, 2026, 8:48 AM', product: 'Solve', action: 'widget-configuration-updated', userEmail: 'Forethought User' },
  { id: 'a11', timestamp: 'Jul 20, 2026, 4:22 PM', product: 'Solve', action: 'intent-deleted', userEmail: 'Forethought User' },
  { id: 'a12', timestamp: 'Jul 20, 2026, 2:05 PM', product: 'Solve', action: 'workflow-draft-discarded', userEmail: 'Forethought User' },
]

const CONV_ID = 'e61f7ebd-2624-4c71-8225-bb3f0abc136c'

export const ERROR_ENTRIES: ErrorEntry[] = [
  { id: 'e1', timestamp: 'Jun 25, 2026, 9:41 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Context Variable name not found in decoded JWT', severity: 'Medium' },
  { id: 'e2', timestamp: 'Jun 25, 2026, 9:41 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Failed to decode JWT', severity: 'Medium' },
  { id: 'e3', timestamp: 'Jun 25, 2026, 8:55 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Context Variable name not found in decoded JWT', severity: 'Medium' },
  { id: 'e4', timestamp: 'Jun 25, 2026, 8:55 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Failed to decode JWT', severity: 'Medium' },
  { id: 'e5', timestamp: 'Jun 25, 2026, 7:12 AM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Upstream tool call timed out', severity: 'High' },
  { id: 'e6', timestamp: 'Jun 24, 2026, 6:03 PM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Retry succeeded after transient failure', severity: 'Low' },
  { id: 'e7', timestamp: 'Jun 24, 2026, 5:40 PM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Failed to decode JWT', severity: 'Medium' },
  { id: 'e8', timestamp: 'Jun 24, 2026, 3:18 PM', product: 'Solve', channel: 'Widget', conversationId: CONV_ID, message: 'Rate limit exceeded on knowledge lookup', severity: 'High' },
]
