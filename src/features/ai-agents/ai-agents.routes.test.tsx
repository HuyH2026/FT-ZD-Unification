import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { findNavItemByPath } from '@/app/nav-config'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('AI Agents routing', () => {
  it('renders Agent Builder at /ai-agents (index)', () => {
    renderAt('/ai-agents')
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })

  it('renders Configuration at /ai-agents/configuration', () => {
    renderAt('/ai-agents/configuration')
    expect(screen.getByTestId('view-configuration')).toBeInTheDocument()
  })

  it('renders Agent Builder at /ai-agents/agent-builder', () => {
    renderAt('/ai-agents/agent-builder')
    expect(screen.getByTestId('view-agent-builder')).toBeInTheDocument()
  })

  it('resolves /ai-agents/configuration to the AI Agents nav item', () => {
    expect(findNavItemByPath('/ai-agents/configuration')?.label).toBe('AI Agents')
  })
})
