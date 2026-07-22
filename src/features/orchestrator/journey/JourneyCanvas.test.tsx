// src/features/orchestrator/journey/JourneyCanvas.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JourneyCanvas, paletteItemToNode } from './JourneyCanvas'
import type { JourneyNode } from './journey-data'

describe('JourneyCanvas', () => {
  beforeEach(() => {
    try { window.localStorage?.clear() } catch { /* no localStorage */ }
  })

  it('renders the seeded nodes for a1 (Start event + an action description)', () => {
    render(<JourneyCanvas automationId="a1" />)
    expect(screen.getByText('On Event: Cart abandoned')).toBeInTheDocument()
    expect(screen.getByText('Call customers with abandoned carts')).toBeInTheDocument()
  })

  it('renders the node palette and can close it', () => {
    render(<JourneyCanvas automationId="a1" />)
    expect(screen.getByText('Nodes')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close node palette'))
    expect(screen.queryByText('Nodes')).toBeNull()
  })

  it('can reopen the palette after closing', () => {
    render(<JourneyCanvas automationId="a1" />)
    fireEvent.click(screen.getByLabelText('Close node palette'))
    fireEvent.click(screen.getByLabelText('Open node palette'))
    expect(screen.getByText('Nodes')).toBeInTheDocument()
  })
})

describe('paletteItemToNode', () => {
  it('generates unique ids against existing nodes (no collision)', () => {
    const existingNodes: JourneyNode[] = [
      { id: 'n0', type: 'rule', position: { x: 0, y: 0 }, data: { kind: 'rule', title: 'Existing 0', conditions: [] } },
      { id: 'n1', type: 'rule', position: { x: 0, y: 0 }, data: { kind: 'rule', title: 'Existing 1', conditions: [] } },
    ]
    const newNode = paletteItemToNode('delay', { x: 100, y: 100 }, existingNodes)
    expect(newNode.id).not.toBe('n0')
    expect(newNode.id).not.toBe('n1')
    expect(existingNodes.find((n) => n.id === newNode.id)).toBeUndefined()
  })

  it('maps "end" item to end node', () => {
    const node = paletteItemToNode('end', { x: 50, y: 50 }, [])
    expect(node.type).toBe('end')
    expect(node.data.kind).toBe('end')
    expect(node.data.title).toBe('End')
    expect(node.position).toEqual({ x: 50, y: 50 })
  })

  it('maps "email" channel item to action node', () => {
    const node = paletteItemToNode('email', { x: 100, y: 200 }, [])
    expect(node.type).toBe('action')
    expect(node.data.kind).toBe('action')
    expect(node.data.channel).toBe('email')
    expect(node.data.actionLabel).toBe('Email')
  })

  it('maps "delay" (Logic) to rule node', () => {
    const node = paletteItemToNode('delay', { x: 150, y: 300 }, [])
    expect(node.type).toBe('rule')
    expect(node.data.kind).toBe('rule')
    expect(node.data.title).toBe('Delay')
    expect(node.data.conditions).toBeDefined()
  })

  it('maps "injury-severity" (Triage) to rule node', () => {
    const node = paletteItemToNode('injury-severity', { x: 200, y: 400 }, [])
    expect(node.type).toBe('rule')
    expect(node.data.kind).toBe('rule')
    expect(node.data.title).toBe('Injury severity')
  })
})
