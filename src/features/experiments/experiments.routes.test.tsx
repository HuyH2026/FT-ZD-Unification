import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { findNavItemByPath } from '@/app/nav-config'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('Experiments routing', () => {
  it('shows A/B Test by default at /experiments', () => {
    renderAt('/experiments')
    expect(screen.getByTestId('view-ab-test')).toBeInTheDocument()
  })

  it('shows A/B Test at /experiments/ab-test', () => {
    renderAt('/experiments/ab-test')
    expect(screen.getByTestId('view-ab-test')).toBeInTheDocument()
  })

  it('does not render the placeholder at /experiments', () => {
    renderAt('/experiments')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('resolves /experiments to the Experiments nav item', () => {
    expect(findNavItemByPath('/experiments')?.label).toBe('Experiments')
  })

  it('resolves /experiments/ab-test to the Experiments nav item', () => {
    expect(findNavItemByPath('/experiments/ab-test')?.label).toBe('Experiments')
  })
})

describe('A/B Test Setup routing', () => {
  it('renders the Setup screen at /experiments/new', () => {
    renderAt('/experiments/new')
    expect(screen.getByTestId('screen-experiment-setup')).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('navigates from Create new to the Setup screen', () => {
    renderAt('/experiments')
    fireEvent.click(screen.getByRole('button', { name: 'Create new' }))
    expect(screen.getByTestId('screen-experiment-setup')).toBeInTheDocument()
  })
})
