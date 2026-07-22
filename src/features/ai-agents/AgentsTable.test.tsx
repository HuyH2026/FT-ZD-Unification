import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AgentsTable } from './AgentsTable'
import type { Agent } from './agent-builder-data'

const agents: Agent[] = [
  { id: 'w1', name: 'Knowledge Retrieval', on: true, isSubagent: false, type: 'Knowledge Retrieval', conversations: 3000, deflections: 2500, deflectionRate: '95%', csat: 3, tags: ['member_center'] },
]

describe('AgentsTable row click', () => {
  it('calls onRowClick with the agent id when the name is clicked', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<AgentsTable agents={agents} isOn={() => true} onToggle={() => {}} onRowClick={onRowClick} />)
    await user.click(screen.getByRole('button', { name: 'Open Knowledge Retrieval' }))
    expect(onRowClick).toHaveBeenCalledWith('w1')
  })

  it('does not trigger row click when the toggle is clicked', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<AgentsTable agents={agents} isOn={() => true} onToggle={() => {}} onRowClick={onRowClick} />)
    await user.click(screen.getByRole('switch', { name: 'Activate Knowledge Retrieval' }))
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
