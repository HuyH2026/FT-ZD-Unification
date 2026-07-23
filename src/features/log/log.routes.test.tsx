import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { findNavItemByPath } from '@/app/nav-config'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('Log routing', () => {
  it('renders the Log screen at /log', () => {
    renderAt('/log')
    expect(screen.getByTestId('screen-log')).toBeInTheDocument()
  })

  it('does not render the placeholder at /log', () => {
    renderAt('/log')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('resolves /log to the Log nav item', () => {
    expect(findNavItemByPath('/log')?.label).toBe('Log')
  })
})
