import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ExperimentTable } from './ExperimentTable'
import { EXPERIMENTS } from './experiments-data'

function renderTable() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <ExperimentTable experiments={EXPERIMENTS} /> },
      { path: '/experiments/new', element: <div data-testid="detail" /> },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('ExperimentTable', () => {
  it('renders column headers and a row per experiment', () => {
    renderTable()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Traffic split')).toBeInTheDocument()
    expect(screen.getByText('Abandoned Cart Recovery')).toBeInTheDocument()
    expect(screen.getByText('Guided Troubleshoot Flow')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('navigates to the experiment detail with its id when a row is clicked', () => {
    const router = renderTable()
    fireEvent.click(screen.getByText('Abandoned Cart Recovery'))
    expect(router.state.location.pathname).toBe('/experiments/new')
    expect(router.state.location.search).toBe('?id=e2')
  })
})
