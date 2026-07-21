import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('CreateOrgFlow', () => {
  it('renders the full-page create form with Company name and section headings', () => {
    renderApp('/organization/new')
    expect(screen.getByText('Organization Setup')).toBeInTheDocument()
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /messaging/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^voice$/i })).toBeInTheDocument()
  })

  it('disables Save until a name and a channel are provided', async () => {
    const user = userEvent.setup()
    renderApp('/organization/new')
    const save = screen.getByRole('button', { name: /save/i })
    expect(save).toBeDisabled()

    await user.type(screen.getByLabelText(/company name/i), 'Acme')
    expect(save).toBeDisabled() // name only, no channel

    await user.click(screen.getByRole('button', { name: /^widget$/i }))
    expect(save).toBeEnabled()
  })

  it('collapses a section to hide its cards', async () => {
    const user = userEvent.setup()
    renderApp('/organization/new')
    // "Web Call" lives in the Voice section and is visible by default.
    expect(screen.getByRole('button', { name: /web call/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^voice$/i }))
    expect(screen.queryByRole('button', { name: /web call/i })).not.toBeInTheDocument()
  })

  it('creates an org and returns to the dashboard listing it', async () => {
    const user = userEvent.setup()
    renderApp('/organization/new')
    await user.type(screen.getByLabelText(/company name/i), 'Acme')
    await user.click(screen.getByRole('button', { name: /^widget$/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await screen.findByRole('heading', { name: /organization/i })
    const dashboard = screen.getByTestId('screen-organization')
    expect(within(dashboard).getByText('Acme')).toBeInTheDocument()
  })
})
