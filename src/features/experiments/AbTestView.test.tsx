import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AbTestView } from './AbTestView'

function renderScreen() {
  const router = createMemoryRouter([{ path: '/', element: <AbTestView /> }], { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('AbTestView', () => {
  it('renders the title, metrics, toolbar, and experiment rows', () => {
    renderScreen()
    const screenEl = screen.getByTestId('view-ab-test')
    expect(within(screenEl).getByRole('heading', { name: 'A/B test' })).toBeInTheDocument()
    expect(within(screenEl).getByText('Total Tests')).toBeInTheDocument()
    expect(within(screenEl).getByPlaceholderText('Search')).toBeInTheDocument()
    expect(within(screenEl).getByRole('button', { name: 'Create new' })).toBeInTheDocument()
    expect(within(screenEl).getByText('Abandoned Cart Recovery')).toBeInTheDocument()
  })
})
