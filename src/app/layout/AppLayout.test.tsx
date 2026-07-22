import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('routing + layout', () => {
  it('renders the Home screen at /', () => {
    renderAt('/')
    expect(screen.getByTestId('screen-home')).toBeInTheDocument()
  })

  it('renders the Placeholder for an undesigned destination', () => {
    renderAt('/knowledge')
    expect(screen.getByText('Knowledge')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('marks the active nav item based on the URL', () => {
    renderAt('/insights')
    expect(screen.getByRole('link', { name: /insights/i })).toHaveAttribute('aria-current', 'page')
  })
})
