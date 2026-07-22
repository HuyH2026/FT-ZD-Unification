import { describe, it, expect } from 'vitest'
import { PM_DATA } from './pm-data'
import { PM_OPPORTUNITY_DETAILS, getOpportunityDetail, LIFECYCLE_ORDER } from './pm-detail-data'

describe('pm-detail-data', () => {
  it('has a detail record for every feed opportunity', () => {
    for (const o of PM_DATA.opportunities) {
      expect(PM_OPPORTUNITY_DETAILS[o.id]).toBeDefined()
    }
  })

  it('each detail reuses the base opportunity as its .opp (single source of truth)', () => {
    for (const o of PM_DATA.opportunities) {
      expect(PM_OPPORTUNITY_DETAILS[o.id].opp).toBe(o)
    }
  })

  it('timeline is 4 nodes in canonical lifecycle order', () => {
    for (const id of Object.keys(PM_OPPORTUNITY_DETAILS)) {
      const t = PM_OPPORTUNITY_DETAILS[id].timeline
      expect(t.map((n) => n.stage)).toEqual(LIFECYCLE_ORDER)
    }
  })

  it('the node matching the opportunity stage carries a date label', () => {
    for (const id of Object.keys(PM_OPPORTUNITY_DETAILS)) {
      const d = PM_OPPORTUNITY_DETAILS[id]
      const current = d.timeline.find((n) => n.stage === d.opp.stage)
      expect(current?.dateLabel).toBeTruthy()
    }
  })

  it('detail records are well-formed', () => {
    for (const id of Object.keys(PM_OPPORTUNITY_DETAILS)) {
      const d = PM_OPPORTUNITY_DETAILS[id]
      expect(d.volumeCount).toBeGreaterThan(0)
      expect(d.segments.length).toBeGreaterThan(0)
      expect(d.affectedCustomers.length).toBeGreaterThan(0)
      expect(d.conversations.length).toBeGreaterThan(0)
      expect(d.narrative.length).toBeGreaterThan(0)
      expect(d.totalConversations).toBeGreaterThan(0)
    }
  })

  it('getOpportunityDetail resolves a known id and rejects others', () => {
    expect(getOpportunityDetail('o2')).toBe(PM_OPPORTUNITY_DETAILS.o2)
    expect(getOpportunityDetail('bogus')).toBeUndefined()
    expect(getOpportunityDetail(undefined)).toBeUndefined()
  })

  it('SCIM (o2) matches the Figma stats strip', () => {
    const d = PM_OPPORTUNITY_DETAILS.o2
    expect(d.opp.impact).toBe(78)
    expect(d.volumeCount).toBe(164)
    expect(d.reproSteps && d.reproSteps.length).toBeGreaterThan(0) // o2 is a bug
    expect(d.segments.map((s) => s.label)).toEqual(['Enterprise', 'Pro', 'Team'])
  })
})
