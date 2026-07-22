import { describe, expect, it } from 'vitest'
import {
  COACHING_BARS,
  sentimentBand,
  TOP_MOVERS,
  TOPIC_ROWS,
  TOPIC_STATS,
} from './topics-data'

describe('topics-data', () => {
  it('exposes five top-mover rows', () => {
    expect(TOP_MOVERS).toHaveLength(5)
    expect(TOP_MOVERS[0].topic).toBe('Website Link Errors')
  })

  it('exposes five coaching bars with positive volumes', () => {
    expect(COACHING_BARS).toHaveLength(5)
    for (const bar of COACHING_BARS) expect(bar.volume).toBeGreaterThan(0)
  })

  it('exposes eight stat cards, exactly one flagged as sentiment', () => {
    expect(TOPIC_STATS).toHaveLength(8)
    expect(TOPIC_STATS.filter((s) => s.sentiment)).toHaveLength(1)
  })

  it('has unique ids across every level of the topic tree', () => {
    const ids: string[] = []
    for (const row of TOPIC_ROWS) {
      ids.push(row.id)
      for (const sub of row.children) {
        ids.push(sub.id)
        for (const leaf of sub.children) ids.push(leaf.id)
      }
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps each parent count in sync with its children length', () => {
    for (const row of TOPIC_ROWS) {
      expect(row.count).toBeGreaterThan(0)
      for (const sub of row.children) {
        expect(sub.count).toBe(sub.children.length)
      }
    }
  })

  it('bands sentiment scores into green / amber / red', () => {
    expect(sentimentBand(75).label).toBe('good')
    expect(sentimentBand(50).label).toBe('ok')
    expect(sentimentBand(30).label).toBe('bad')
  })
})
