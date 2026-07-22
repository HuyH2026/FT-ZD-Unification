import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { OrchestratorScreen } from './OrchestratorScreen'

function renderOrchestratorScreen() {
  const router = createMemoryRouter([{ path: '/', element: <OrchestratorScreen /> }], { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('OrchestratorScreen', () => {
  it('renders the screen surface with title, metrics, and toolbar', () => {
    renderOrchestratorScreen()
    const screenEl = screen.getByTestId('screen-orchestrator')
    expect(within(screenEl).getByRole('heading', { name: 'Orchestrator' })).toBeInTheDocument()
    expect(within(screenEl).getByText('Total runs')).toBeInTheDocument()
    expect(within(screenEl).getByPlaceholderText('Search')).toBeInTheDocument()
    expect(within(screenEl).getByRole('button', { name: 'New automation' })).toBeInTheDocument()
  })

  it('toggles a row on and off', () => {
    renderOrchestratorScreen()
    const toggle = screen.getByLabelText('Activate Call users with issues')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})
