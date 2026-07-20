import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('Insights routing', () => {
  it('shows AI Performances by default at /insights', () => {
    renderAt('/insights')
    expect(screen.getByTestId('view-ai-performances')).toBeInTheDocument()
  })

  it('shows CX Journey at /insights/cx-journey', () => {
    renderAt('/insights/cx-journey')
    expect(screen.getByTestId('view-cx-journey')).toBeInTheDocument()
  })
})
