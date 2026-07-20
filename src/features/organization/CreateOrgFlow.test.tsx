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
  it('renders the create-org form at /organization/new', () => {
    renderApp('/organization/new')
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
  })

  it('creates an org and returns to the dashboard listing it', async () => {
    const user = userEvent.setup()
    renderApp('/organization/new')
    await user.type(screen.getByLabelText(/organization name/i), 'Acme')

    // Select at least one channel
    const webWidgetButton = screen.getByRole('button', { name: /widget/i })
    await user.click(webWidgetButton)

    await user.click(screen.getByRole('button', { name: /save/i }))

    // Wait for navigation back to the organization dashboard, then verify the
    // new org is listed in the dashboard itself (not merely present somewhere
    // on the page such as the top-bar org switcher).
    await screen.findByRole('heading', { name: /organization/i })
    const dashboard = screen.getByTestId('screen-organization')
    expect(within(dashboard).getByText('Acme')).toBeInTheDocument()
  })
})
