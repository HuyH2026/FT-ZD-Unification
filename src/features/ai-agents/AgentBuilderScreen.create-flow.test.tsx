import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

// Mock localStorage for cross-component state sharing in these tests.
const storage = new Map<string, string>()
beforeEach(() => {
  storage.clear()
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
    writable: true,
  })
})

function renderApp(path = '/ai-agents') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('AgentBuilderScreen — create flow', () => {
  it('opens the Create Agent panel from New Agent', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'New Agent' }))
    expect(screen.getByRole('dialog', { name: 'Create Agent' })).toBeInTheDocument()
  })

  it('creates an agent and lands in the editor', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'New Agent' }))
    await user.type(screen.getByLabelText('Agent display name'), 'Refund helper')
    await user.click(screen.getByRole('button', { name: 'Create Agent' }))
    // Wait for navigation to complete.
    await screen.findByTestId('view-agent-editor')
    expect(screen.getByTestId('view-agent-editor')).toBeInTheDocument()
    expect(screen.getByLabelText('Agent title')).toHaveValue('Refund helper')
  })

  it('opens the editor when an agent row is clicked', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Open Knowledge Retrieval' }))
    expect(screen.getByTestId('view-agent-editor')).toBeInTheDocument()
  })

  it('shows the newly-created agent in the builder list after navigating back', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'New Agent' }))
    await user.type(screen.getByLabelText('Agent display name'), 'Refund helper')
    await user.click(screen.getByRole('button', { name: 'Create Agent' }))
    // Wait for navigation to editor.
    await screen.findByTestId('view-agent-editor')
    // Navigate back to the builder.
    await user.click(screen.getByLabelText('Back to agents'))
    // The created agent should now appear in the list.
    const builderView = within(screen.getByTestId('view-agent-builder'))
    expect(builderView.getByRole('button', { name: 'Open Refund helper' })).toBeInTheDocument()
  })
})
