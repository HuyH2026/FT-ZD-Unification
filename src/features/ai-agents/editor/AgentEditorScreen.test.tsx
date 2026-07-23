import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('AgentEditorScreen', () => {
  it('renders the editor for a seeded agent', () => {
    renderAt('/ai-agents/w3')
    expect(screen.getByTestId('view-agent-editor')).toBeInTheDocument()
    // Seeded Service cancellation policy chip.
    expect(screen.getByText('Retention Routing')).toBeInTheDocument()
    // Steps palette present.
    expect(screen.getByText('Steps')).toBeInTheDocument()
  })

  it('redirects to the list for an unknown agent id', () => {
    renderAt('/ai-agents/does-not-exist')
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })

  it('navigates back to the list from the editor', async () => {
    const user = userEvent.setup()
    renderAt('/ai-agents/w3')
    await user.click(screen.getByRole('button', { name: 'Back to agents' }))
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })

  it('renders the seeded condition block expanded with numbered rows', () => {
    renderAt('/ai-agents/w3')
    expect(screen.getByText('Shipping status')).toBeInTheDocument()
    expect(screen.getAllByText('Condition description')).toHaveLength(2)
    expect(screen.getByText('Otherwise…')).toBeInTheDocument()
  })

  it('collapses and expands the condition block', async () => {
    const user = userEvent.setup()
    renderAt('/ai-agents/w3')
    await user.click(screen.getByRole('button', { name: 'Collapse Untitled classic block 01' }))
    expect(screen.queryByText('Shipping status')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand Untitled classic block 01' }))
    expect(screen.getByText('Shipping status')).toBeInTheDocument()
  })

  it('adds a condition row', async () => {
    const user = userEvent.setup()
    renderAt('/ai-agents/w3')
    await user.click(screen.getByRole('button', { name: 'Add condition' }))
    // Two seeded + one added.
    expect(screen.getAllByText('Condition description')).toHaveLength(3)
  })

  it('rail selection toggles the Steps palette', async () => {
    const user = userEvent.setup()
    renderAt('/ai-agents/w3')
    expect(screen.getByText('Steps')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Outline' }))
    expect(screen.queryByText('Steps')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Steps' }))
    expect(screen.getByText('Steps')).toBeInTheDocument()
  })
})
