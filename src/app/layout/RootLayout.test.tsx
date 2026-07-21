import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('full-page create-org routing', () => {
  it('renders the create flow with no app chrome (no top bar product switcher)', () => {
    renderAt('/organization/new')
    // The create flow itself is present.
    expect(screen.getByText('Organization Setup')).toBeInTheDocument()
    // The TopBar (rendered only inside AppLayout) is absent: its "AI Agent"
    // product switcher must not be on the page.
    expect(screen.queryByText('AI Agent')).not.toBeInTheDocument()
  })

  it('still renders the shell (top bar) for in-app routes', () => {
    renderAt('/organization')
    expect(screen.getByText('AI Agent')).toBeInTheDocument()
    expect(screen.getByTestId('screen-organization')).toBeInTheDocument()
  })
})
