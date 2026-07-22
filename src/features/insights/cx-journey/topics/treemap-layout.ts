// Squarified treemap layout (Bruls, Huizing & van Wijk 2000).
// Pure function: maps weighted items to non-overlapping rectangles that tile the
// given box, each cell's area proportional to its value. Used by TopicTreemap.
export type TreemapItem = { id: string; value: number }
export type PlacedCell = { id: string; x: number; y: number; w: number; h: number }

type Rect = { x: number; y: number; w: number; h: number }

// Worst (largest) aspect ratio in a row of already-scaled areas laid along a
// side of length `side`. `sum` is the total scaled area of the row.
function worst(areas: number[], side: number, sum: number): number {
  if (areas.length === 0 || side === 0) return Infinity
  const max = Math.max(...areas)
  const min = Math.min(...areas)
  const s2 = sum * sum
  const side2 = side * side
  return Math.max((side2 * max) / s2, s2 / (side2 * min))
}

// Place a finished row of `areas` (scaled to px²) along the shorter side of
// `rect`, returning the placed cells and the remaining rect. Mutates nothing.
function layoutRow(
  row: { id: string; area: number }[],
  rect: Rect,
): { cells: PlacedCell[]; rest: Rect } {
  const rowSum = row.reduce((s, r) => s + r.area, 0)
  const cells: PlacedCell[] = []
  const horizontal = rect.w >= rect.h
  if (horizontal) {
    const rowW = rowSum / rect.h // thickness of the row (a vertical strip)
    let y = rect.y
    for (const r of row) {
      const h = r.area / rowW
      cells.push({ id: r.id, x: rect.x, y, w: rowW, h })
      y += h
    }
    return { cells, rest: { x: rect.x + rowW, y: rect.y, w: rect.w - rowW, h: rect.h } }
  }
  const rowH = rowSum / rect.w // thickness of the row (a horizontal strip)
  let x = rect.x
  for (const r of row) {
    const w = r.area / rowH
    cells.push({ id: r.id, x, y: rect.y, w, h: rowH })
    x += w
  }
  return { cells, rest: { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH } }
}

export function squarify(items: TreemapItem[], size: { width: number; height: number }): PlacedCell[] {
  if (items.length === 0) return []
  const totalValue = items.reduce((s, i) => s + Math.max(i.value, 0), 0)
  const totalArea = size.width * size.height
  // Scale each value into px² so row areas are directly comparable to side lengths.
  const scaled = items.map((i) => ({
    id: i.id,
    area: totalValue > 0 ? (Math.max(i.value, 0) / totalValue) * totalArea : 0,
  }))

  const placed: PlacedCell[] = []
  let rect: Rect = { x: 0, y: 0, w: size.width, h: size.height }
  let row: { id: string; area: number }[] = []
  let i = 0

  while (i < scaled.length) {
    const side = Math.min(rect.w, rect.h)
    const rowSum = row.reduce((s, r) => s + r.area, 0)
    const current = worst(row.map((r) => r.area), side, rowSum)
    const withNext = worst(
      [...row, scaled[i]].map((r) => r.area),
      side,
      rowSum + scaled[i].area,
    )
    if (row.length === 0 || withNext <= current) {
      row.push(scaled[i])
      i++
    } else {
      const { cells, rest } = layoutRow(row, rect)
      placed.push(...cells)
      rect = rest
      row = []
    }
  }
  if (row.length > 0) {
    const { cells } = layoutRow(row, rect)
    placed.push(...cells)
  }
  return placed
}
