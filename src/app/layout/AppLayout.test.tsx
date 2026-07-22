import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { OrgProvider } from '@/app/org-context'
import { routes } from '@/routes'
import { AppLayout } from './AppLayout'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

function renderLayout() {
  const router = createMemoryRouter(
    [{ path: '/', element: <OrgProvider><AppLayout /></OrgProvider>, children: [{ index: true, element: <div>home</div> }] }],
    { initialEntries: ['/'] },
  )
  return render(<RouterProvider router={router} />)
}

describe('routing + layout', () => {
  it('renders the Home screen at /', () => {
    renderAt('/')
    expect(screen.getByTestId('screen-home')).toBeInTheDocument()
  })

  it('renders the Placeholder for an undesigned destination', () => {
    renderAt('/knowledge')
    expect(screen.getByText('Knowledge')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('marks the active nav item based on the URL', () => {
    renderAt('/insights')
    expect(screen.getByRole('link', { name: /insights/i })).toHaveAttribute('aria-current', 'page')
  })
})

describe('AppLayout AI Studio toggle', () => {
  it('toggles the topic suggestions panel from the TopBar AI button', async () => {
    renderLayout()
    const button = screen.getByLabelText('AI assistant')
    expect(screen.queryByTestId('ai-studio-topics-panel')).not.toBeInTheDocument()
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button)
    expect(screen.getByTestId('ai-studio-topics-panel')).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(button)
    expect(screen.queryByTestId('ai-studio-topics-panel')).not.toBeInTheDocument()
  })

  it('closes the panel from its own close button', async () => {
    renderLayout()
    await userEvent.click(screen.getByLabelText('AI assistant'))
    expect(screen.getByTestId('ai-studio-topics-panel')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Close AI Studio'))
    expect(screen.queryByTestId('ai-studio-topics-panel')).not.toBeInTheDocument()
  })
})
