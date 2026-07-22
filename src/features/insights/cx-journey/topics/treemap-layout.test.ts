import { describe, expect, it } from 'vitest'
import { squarify, type TreemapItem } from './treemap-layout'

const SIZE = { width: 600, height: 400 }
const AREA = SIZE.width * SIZE.height

function areaOf(c: { w: number; h: number }) {
  return c.w * c.h
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: typeof a) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

describe('squarify', () => {
  const items: TreemapItem[] = [
    { id: 'a', value: 50 },
    { id: 'b', value: 30 },
    { id: 'c', value: 20 },
  ]

  it('returns one cell per item, preserving ids', () => {
    const cells = squarify(items, SIZE)
    expect(cells.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('tiles the full box (areas sum to box area)', () => {
    const cells = squarify(items, SIZE)
    const total = cells.reduce((s, c) => s + areaOf(c), 0)
    expect(total).toBeCloseTo(AREA, 1)
  })

  it('sizes each cell proportionally to its value', () => {
    const cells = squarify(items, SIZE)
    const byId = Object.fromEntries(cells.map((c) => [c.id, c]))
    // 'a' is 50% of value → ~50% of area
    expect(areaOf(byId.a) / AREA).toBeCloseTo(0.5, 2)
    expect(areaOf(byId.b) / AREA).toBeCloseTo(0.3, 2)
    expect(areaOf(byId.c) / AREA).toBeCloseTo(0.2, 2)
  })

  it('produces no overlapping cells', () => {
    const cells = squarify(items, SIZE)
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        expect(overlaps(cells[i], cells[j])).toBe(false)
      }
    }
  })

  it('keeps all cells inside the box', () => {
    const cells = squarify(items, SIZE)
    for (const c of cells) {
      expect(c.x).toBeGreaterThanOrEqual(-0.001)
      expect(c.y).toBeGreaterThanOrEqual(-0.001)
      expect(c.x + c.w).toBeLessThanOrEqual(SIZE.width + 0.001)
      expect(c.y + c.h).toBeLessThanOrEqual(SIZE.height + 0.001)
    }
  })

  it('is deterministic for identical input', () => {
    expect(squarify(items, SIZE)).toEqual(squarify(items, SIZE))
  })

  it('fills the box with a single item', () => {
    const cells = squarify([{ id: 'only', value: 7 }], SIZE)
    expect(cells).toEqual([{ id: 'only', x: 0, y: 0, w: SIZE.width, h: SIZE.height }])
  })

  it('returns [] for empty input', () => {
    expect(squarify([], SIZE)).toEqual([])
  })
})
