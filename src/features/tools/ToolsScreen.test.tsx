import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ToolsScreen } from './ToolsScreen'

function renderToolsScreen() {
  const router = createMemoryRouter([{ path: '/', element: <ToolsScreen /> }], { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('ToolsScreen', () => {
  it('renders the Tool Builder title and the Available table by default', () => {
    renderToolsScreen()
    const el = screen.getByTestId('screen-tools')
    expect(within(el).getByRole('heading', { name: 'Tool Builder' })).toBeInTheDocument()
    expect(within(el).getByText('Name (113)')).toBeInTheDocument()
    expect(within(el).getByRole('tab', { name: 'Available' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to an empty placeholder tab when clicked', async () => {
    const user = userEvent.setup()
    renderToolsScreen()
    const el = screen.getByTestId('screen-tools')
    await user.click(within(el).getByRole('tab', { name: 'History' }))
    expect(within(el).getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).queryByText('Name (113)')).toBeNull()
    expect(within(el).getByTestId('tools-tab-History')).toBeInTheDocument()
  })

  it('opens a row into the tool detail route', async () => {
    const user = userEvent.setup()
    renderToolsScreen()
    await user.click(screen.getByText('Action name 001'))
    // ToolsScreen has no /tools/:id route in this isolated router, so the
    // navigation attempt itself (no crash) confirms onOpen is wired; the
    // actual detail render is covered by tools.routes.test.tsx.
    expect(screen.queryByTestId('screen-tools')).toBeNull()
  })
})
