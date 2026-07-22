// Deterministic per-opportunity detail records for the L3 opportunity view.
// Extends the base Opportunity (from pm-data) with the narrative, conversations,
// customer-segment breakdown, affected accounts, and lifecycle timeline shown in
// the Figma. SCIM (o2) is transcribed from the Figma; o1/o3 are coherent
// equivalents. No backend, no Date.now(): dates are literal labels.
import { PM_DATA, type Opportunity, type LifecycleStageKey } from './pm-data'

export type DetailSegment = {
  key: string; label: string; convoCount: number; pct: number; revenue: string
}
export type AffectedCustomer = {
  id: string; name: string; plan: string; renewalDate: string; arrLabel: string
}
export type DetailConversation = {
  id: string; quote: string; customer: string; revenueLabel: string; plan: string
}
export type NarrativeRun = { text: string; bold?: boolean }
export type TimelineNode = { stage: LifecycleStageKey; dateLabel: string | null }

export type OpportunityDetail = {
  opp: Opportunity
  volumeCount: number
  narrative: NarrativeRun[]
  reproSteps?: string[]
  suggestedAction: string
  linkedSuggestion?: { ref: string; text: string }
  timeline: TimelineNode[]
  segments: DetailSegment[]
  affectedCustomers: AffectedCustomer[]
  totalConversations: number
  conversations: DetailConversation[]
}

export const LIFECYCLE_ORDER: LifecycleStageKey[] = ['detected', 'planned', 'in-dev', 'shipped']

// Index the canonical opportunities by id so each detail's .opp is the SAME
// object (no drift between the feed card and the detail page).
const byId: Record<string, Opportunity> = Object.fromEntries(
  PM_DATA.opportunities.map((o) => [o.id, o]),
)

// Build the 4-node timeline: the node at the opportunity's current stage gets the
// supplied date; earlier stages are marked done with their date; later stages are
// null ("--"). `dates` maps a stage key to its label for the stages that have one.
function timeline(dates: Partial<Record<LifecycleStageKey, string>>): TimelineNode[] {
  return LIFECYCLE_ORDER.map((stage) => ({ stage, dateLabel: dates[stage] ?? null }))
}

export const PM_OPPORTUNITY_DETAILS: Record<string, OpportunityDetail> = {
  // --- SCIM auto-provisioning (Figma-exact) ---------------------------------
  o2: {
    opp: byId.o2,
    volumeCount: 164,
    narrative: [
      { text: 'Enterprise and Pro customers with an external identity provider report that new hires and departures are not reflected in their ' },
      { text: 'user access automatically', bold: true },
      { text: '. Without SCIM provisioning, admins manually add and remove seats, which leaves stale accounts active after employees leave and blocks org-wide rollout. The pattern is concentrated in accounts with 100+ seats and has grown sharply since the identity-sync beta opened on Jun 12, pointing to ' },
      { text: 'automated lifecycle management as the blocking requirement', bold: true },
      { text: '. Several customers say they cannot expand until provisioning is hands-off.' },
    ],
    reproSteps: [
      'Connect an external identity provider (reproduced with Okta, Entra ID)',
      'Deactivate a user in the identity provider',
      'Observe the account stays active in the app — no deprovisioning event is received',
      'New hires added in the IdP are likewise not provisioned automatically',
    ],
    suggestedAction:
      'Connect your identity provider to keep user access up to date. Sync with Jira to track the provisioning rollout across your Atlassian workspace, or with Claude Code to automatically assign and revoke seats as your team changes. No manual updates needed.',
    linkedSuggestion: {
      ref: 'SCIM-1423',
      text: '"SCIM deprovisioning delay" already exists.',
    },
    timeline: timeline({ detected: 'Jun 15' }),
    segments: [
      { key: 'enterprise', label: 'Enterprise', convoCount: 104, pct: 80, revenue: '$815K' },
      { key: 'pro', label: 'Pro', convoCount: 54, pct: 55, revenue: '$710K' },
      { key: 'team', label: 'Team', convoCount: 35, pct: 40, revenue: '$650K' },
    ],
    affectedCustomers: [
      { id: 'ac', name: 'Active Campaign', plan: 'Enterprise', renewalDate: 'Aug 15, 2026', arrLabel: '$140K ARR' },
      { id: 'lime', name: 'Lime', plan: 'Pro', renewalDate: 'Sep 15, 2026', arrLabel: '$86K ARR' },
      { id: 'acorns', name: 'Acorns', plan: 'Pro', renewalDate: 'Aug 1, 2026', arrLabel: '$60K ARR' },
    ],
    totalConversations: 142,
    conversations: [
      { id: 'c1', quote: 'Every 60 minutes our whole org gets kicked back to login. Killing adoption with 400 seats.', customer: 'Lime', revenueLabel: '$210K revenue', plan: 'Enterprise' },
      { id: 'c2', quote: 'Refresh silently fails and we lose unsaved work.', customer: 'Acorns', revenueLabel: '$60K revenue', plan: 'Pro' },
    ],
  },

  // --- SAML SSO drops users (request, in-dev) -------------------------------
  o1: {
    opp: byId.o1,
    volumeCount: 218,
    narrative: [
      { text: 'Large SSO customers report that users are ' },
      { text: 'silently signed out on token refresh', bold: true },
      { text: ', roughly every session hour, and bounced back to the login screen mid-task. The disruption scales with seat count and is most severe on Enterprise annual plans. It began after the v2.4 auth release and correlates with the silent-refresh code path, indicating a ' },
      { text: 'regression in SAML session renewal', bold: true },
      { text: '. Customers describe real adoption and productivity loss across hundreds of seats.' },
    ],
    reproSteps: [
      'Sign in via SAML SSO on an Enterprise account',
      'Leave the session idle until the access token nears expiry (~60 min)',
      'Trigger any authenticated request → silent refresh runs',
      'User is returned to the login screen; unsaved work is lost',
    ],
    suggestedAction:
      'Ship the session-renewal fix behind a flag for affected tenants, then sync the rollout to Jira so account teams can track it against renewals. Notify the top Enterprise accounts once verified.',
    linkedSuggestion: {
      ref: 'AUTH-982',
      text: '"Silent token refresh logout" already exists.',
    },
    timeline: timeline({ detected: 'May 28', planned: 'Jun 3', 'in-dev': 'Jun 12' }),
    segments: [
      { key: 'enterprise', label: 'Enterprise', convoCount: 118, pct: 86, revenue: '$920K' },
      { key: 'pro', label: 'Pro', convoCount: 61, pct: 58, revenue: '$540K' },
      { key: 'team', label: 'Team', convoCount: 39, pct: 42, revenue: '$310K' },
    ],
    affectedCustomers: [
      { id: 'lime', name: 'Lime', plan: 'Enterprise', renewalDate: 'Sep 15, 2026', arrLabel: '$210K ARR' },
      { id: 'ac', name: 'Active Campaign', plan: 'Enterprise', renewalDate: 'Aug 15, 2026', arrLabel: '$140K ARR' },
      { id: 'acorns', name: 'Acorns', plan: 'Pro', renewalDate: 'Aug 1, 2026', arrLabel: '$60K ARR' },
    ],
    totalConversations: 190,
    conversations: [
      { id: 'c1', quote: 'Every 60 minutes our whole org gets kicked back to login. Killing adoption with 400 seats.', customer: 'Lime', revenueLabel: '$210K revenue', plan: 'Enterprise' },
      { id: 'c2', quote: 'Our reps lose half-written tickets when the session drops. It happens all day.', customer: 'Active Campaign', revenueLabel: '$140K revenue', plan: 'Enterprise' },
    ],
  },

  // --- Bulk CSV export times out (request, planned) -------------------------
  o3: {
    opp: byId.o3,
    volumeCount: 91,
    narrative: [
      { text: 'Customers running scheduled exports report that ' },
      { text: 'large CSV exports time out past roughly 10,000 rows', bold: true },
      { text: ', returning no file and no clear error. Teams work around it by manually splitting files or abandoning the export entirely. Volume is concentrated on Growth-plan accounts with weekly reporting jobs and has climbed steadily over the last ten weeks, indicating a ' },
      { text: 'scaling limit in the export pipeline', bold: true },
      { text: ' rather than a one-off outage.' },
    ],
    reproSteps: [
      'Create an export whose result set exceeds ~10,000 rows',
      'Run the export (or wait for the scheduled job)',
      'The request exceeds the timeout and returns no file',
      'No actionable error is surfaced to the user',
    ],
    suggestedAction:
      'Move large exports to an async, chunked job with a download link on completion. Track the work in Jira and notify affected accounts when streaming exports ship.',
    timeline: timeline({ detected: 'May 6', planned: 'May 20' }),
    segments: [
      { key: 'enterprise', label: 'Enterprise', convoCount: 21, pct: 44, revenue: '$210K' },
      { key: 'pro', label: 'Pro', convoCount: 33, pct: 62, revenue: '$180K' },
      { key: 'team', label: 'Team', convoCount: 18, pct: 30, revenue: '$90K' },
    ],
    affectedCustomers: [
      { id: 'acorns', name: 'Acorns', plan: 'Pro', renewalDate: 'Aug 1, 2026', arrLabel: '$60K ARR' },
      { id: 'lime', name: 'Lime', plan: 'Pro', renewalDate: 'Sep 15, 2026', arrLabel: '$86K ARR' },
      { id: 'ac', name: 'Active Campaign', plan: 'Enterprise', renewalDate: 'Aug 15, 2026', arrLabel: '$140K ARR' },
    ],
    totalConversations: 91,
    conversations: [
      { id: 'c1', quote: 'We schedule weekly exports and half of them silently fail now.', customer: 'Acorns', revenueLabel: '$60K revenue', plan: 'Pro' },
      { id: 'c2', quote: 'We had to split our monthly report into six files by hand. It is not workable.', customer: 'Lime', revenueLabel: '$86K revenue', plan: 'Pro' },
    ],
  },
}

export function getOpportunityDetail(id: string | undefined): OpportunityDetail | undefined {
  if (id === undefined) return undefined
  return PM_OPPORTUNITY_DETAILS[id]
}
