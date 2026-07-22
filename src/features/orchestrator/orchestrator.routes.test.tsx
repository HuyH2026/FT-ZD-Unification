import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { findNavItemByPath } from '@/app/nav-config'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('Orchestrator routing', () => {
  it('renders the Orchestrator screen at /orchestrator', () => {
    renderAt('/orchestrator')
    expect(screen.getByTestId('screen-orchestrator')).toBeInTheDocument()
  })

  it('does not render the placeholder at /orchestrator', () => {
    renderAt('/orchestrator')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('resolves /orchestrator to the Orchestrator nav item', () => {
    expect(findNavItemByPath('/orchestrator')?.label).toBe('Orchestrator')
  })
})
