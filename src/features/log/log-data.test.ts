import { describe, it, expect } from 'vitest'
import { LOG_TABS, AUDIT_ENTRIES, ERROR_ENTRIES } from './log-data'

describe('log-data', () => {
  it('exposes both tabs in order', () => {
    expect(LOG_TABS).toEqual(['Audit', 'Error'])
  })

  it('has non-empty audit and error entries with unique ids', () => {
    expect(AUDIT_ENTRIES.length).toBeGreaterThan(0)
    expect(ERROR_ENTRIES.length).toBeGreaterThan(0)
    const auditIds = AUDIT_ENTRIES.map((e) => e.id)
    const errorIds = ERROR_ENTRIES.map((e) => e.id)
    expect(new Set(auditIds).size).toBe(auditIds.length)
    expect(new Set(errorIds).size).toBe(errorIds.length)
  })

  it('only uses allowed severities', () => {
    const allowed = new Set(['High', 'Medium', 'Low'])
    for (const e of ERROR_ENTRIES) expect(allowed.has(e.severity)).toBe(true)
  })
})
