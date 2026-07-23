// The Autoflow policy editor screen (/ai-agents/:agentId). One DndProvider over
// the header, the policy editor + block canvas (center), and the Steps palette
// (right). Unknown ids redirect to the list. Edits persist via the agent store.
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useAgentStore } from '../agent-store'
import type { ChannelKey } from '../agent-builder-data'
import { EditorHeader } from './EditorHeader'
import { PolicyEditor } from './PolicyEditor'
import { BlockCanvas } from './BlockCanvas'
import { StepsPalette } from './StepsPalette'
import { EditorRail, type RailKey } from './EditorRail'

export function AgentEditorScreen() {
  const { agentId = '' } = useParams()
  const navigate = useNavigate()
  const store = useAgentStore()
  const agent = store.getAgent(agentId)

  const [channel, setChannel] = useState<ChannelKey>(agent?.channel ?? 'widget')
  // The far-right rail drives the right panel. "steps" shows the palette;
  // any other selection hides it (those panels are unspecced/empty).
  const [rail, setRail] = useState<RailKey>('steps')

  if (!agent) return <Navigate to="/ai-agents" replace />

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-testid="view-agent-editor" className="flex h-full flex-col">
        <EditorHeader
          title={agent.name}
          version="Version 001"
          channel={channel}
          onChannelChange={setChannel}
          onBack={() => navigate('/ai-agents')}
          onTitleChange={(name) => store.updateAgent(agent.id, { name })}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 gap-6 overflow-hidden p-8">
            <div className="flex-1 overflow-y-auto">
              <PolicyEditor doc={agent.policy} onChange={(policy) => store.updateAgent(agent.id, { policy })} />
              <BlockCanvas blocks={agent.blocks} onChange={(blocks) => store.updateAgent(agent.id, { blocks })} />
            </div>
            {rail === 'steps' && <StepsPalette onClose={() => setRail('outline')} />}
          </div>
          <EditorRail selected={rail} onSelect={setRail} />
        </div>
      </div>
    </DndProvider>
  )
}
