import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, useReactFlow,
  applyNodeChanges, applyEdgeChanges, addEdge,
  type Node, type Edge, type NodeChange, type EdgeChange, type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PanelRightOpen } from 'lucide-react'
import { useJourneyStorage } from './useJourneyStorage'
import { PALETTE, type JourneyNode } from './journey-data'
import { StartNode } from './nodes/StartNode'
import { RuleNode } from './nodes/RuleNode'
import { ActionNode } from './nodes/ActionNode'
import { EndNode } from './nodes/EndNode'
import { AddButtonEdge } from './edges/AddButtonEdge'
import { NodePalette, PALETTE_DND_TYPE } from './NodePalette'

const nodeTypes = { start: StartNode, rule: RuleNode, action: ActionNode, end: EndNode }
const edgeTypes = { addButton: AddButtonEdge }

const ALL_ITEMS = PALETTE.flatMap((c) => c.items)

// Computes the next available node id from the current node list to avoid collisions
// with persisted graphs (e.g. after reload).
function nextNodeId(nodes: JourneyNode[]): string {
  const max = nodes.reduce((m, n) => {
    const match = /^n(\d+)$/.exec(n.id)
    return match ? Math.max(m, Number(match[1]) + 1) : m
  }, 0)
  return `n${max}`
}

// Maps a dropped palette item to a new journey node. Channel agents become
// action nodes; 'end' becomes an end node; everything else becomes a rule node.
export function paletteItemToNode(itemId: string, position: { x: number; y: number }, existingNodes: JourneyNode[]): JourneyNode {
  const item = ALL_ITEMS.find((i) => i.id === itemId)
  const id = nextNodeId(existingNodes)
  const label = item?.label ?? 'Node'
  if (itemId === 'end') {
    return { id, type: 'end', position, data: { kind: 'end', title: 'End', ticketTags: ['ft-automated'] } }
  }
  if (itemId === 'widget' || itemId === 'email' || itemId === 'voice') {
    return { id, type: 'action', position, data: { kind: 'action', channel: itemId, actionLabel: label, title: label, description: label } }
  }
  return { id, type: 'rule', position, data: { kind: 'rule', title: label, conditions: [{ label: '', tokens: [] }] } }
}

function Canvas({ automationId }: { automationId: string }) {
  const { nodes, edges, setNodes, setEdges } = useJourneyStorage(automationId)
  const [paletteOpen, setPaletteOpen] = useState(true)
  const { screenToFlowPosition } = useReactFlow()

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((n) => applyNodeChanges(changes, n as Node[]) as JourneyNode[]), [setNodes])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((e) => applyEdgeChanges(changes, e as Edge[]) as typeof edges), [setEdges])
  const onConnect = useCallback((c: Connection) => setEdges((e) => addEdge({ ...c, type: 'addButton' }, e as Edge[]) as typeof edges), [setEdges])

  const openPalette = useCallback(() => setPaletteOpen(true), [])

  const edgesWithData = useMemo(
    () => edges.map((e) => ({ ...e, type: 'addButton', data: { onAdd: openPalette } })),
    [edges, openPalette],
  )

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const itemId = event.dataTransfer.getData(PALETTE_DND_TYPE)
    if (!itemId) return
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    setNodes((n) => [...n, paletteItemToNode(itemId, position, n)])
  }, [screenToFlowPosition, setNodes])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div className="relative h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes as Node[]}
        edges={edgesWithData as Edge[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
      {paletteOpen ? (
        <div className="absolute right-4 top-4">
          <NodePalette onClose={() => setPaletteOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open node palette"
          onClick={() => setPaletteOpen(true)}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-surface-border bg-white"
        >
          <PanelRightOpen size={18} className="text-ink" aria-hidden />
        </button>
      )}
    </div>
  )
}

export function JourneyCanvas({ automationId }: { automationId: string }) {
  return (
    <ReactFlowProvider>
      <Canvas automationId={automationId} />
    </ReactFlowProvider>
  )
}
