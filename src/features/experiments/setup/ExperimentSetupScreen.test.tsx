import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ExperimentSetupScreen } from './ExperimentSetupScreen'

function renderScreen() {
  const router = createMemoryRouter(
    [{ path: '/experiments/new', element: <ExperimentSetupScreen /> }],
    { initialEntries: ['/experiments/new'] },
  )
  return render(<RouterProvider router={router} />)
}

describe('ExperimentSetupScreen', () => {
  it('renders the shell: tabs, section titles, and Run action', () => {
    renderScreen()
    const el = screen.getByTestId('screen-experiment-setup')
    expect(within(el).getByText('Setup')).toBeInTheDocument()
    expect(within(el).getByText('Results')).toBeInTheDocument()
    expect(within(el).getByText('Agents')).toBeInTheDocument()
    expect(within(el).getByText('Conversations')).toBeInTheDocument()
    expect(within(el).getByText('A/B Test detail')).toBeInTheDocument()
    expect(within(el).getByText('Agent and variants')).toBeInTheDocument()
    expect(within(el).getByText('Winner & Test end')).toBeInTheDocument()
    expect(within(el).getByRole('button', { name: 'Run A/B Test' })).toBeInTheDocument()
  })

  it('reflects the Test name in the top-bar title', () => {
    renderScreen()
    const el = screen.getByTestId('screen-experiment-setup')
    const input = within(el).getByDisplayValue('Login fix method comparison')
    fireEvent.change(input, { target: { value: 'My new test' } })
    // top-bar title node also shows the new name
    expect(within(el).getAllByText('My new test').length).toBeGreaterThanOrEqual(1)
  })

  it('switches to the Results tab when Run A/B Test is clicked', () => {
    renderScreen()
    const el = screen.getByTestId('screen-experiment-setup')
    fireEvent.click(within(el).getByRole('button', { name: 'Run A/B Test' }))
    expect(within(el).getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('view-ab-test-results')).toBeInTheDocument()
  })
})
