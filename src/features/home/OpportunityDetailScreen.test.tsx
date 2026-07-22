import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { OpportunityDetailScreen } from './OpportunityDetailScreen'

function stubStorage() {
  const map = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(), key: () => null, length: 0,
  })
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/opportunity/:id', element: <OpportunityDetailScreen /> },
      { path: '/', element: <div data-testid="home-landing">Home</div> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('OpportunityDetailScreen', () => {
  beforeEach(() => stubStorage())
  afterEach(() => vi.unstubAllGlobals())

  it('renders the SCIM opportunity by id', () => {
    renderAt('/opportunity/o2')
    const screenEl = within(screen.getByTestId('screen-opportunity-detail'))
    expect(screenEl.getByText(/SCIM auto-provisioning/i)).toBeInTheDocument()
    expect(screenEl.getByText('164')).toBeInTheDocument()          // volume
    expect(screenEl.getByLabelText('Impact 78')).toBeInTheDocument() // donut
  })

  it('shows a not-found state for an unknown id', () => {
    renderAt('/opportunity/bogus')
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })

  it('back button navigates home', async () => {
    const user = userEvent.setup()
    renderAt('/opportunity/o2')
    await user.click(screen.getByRole('button', { name: /product recommendations|back/i }))
    expect(screen.getByTestId('home-landing')).toBeInTheDocument()
  })

  it('Add to tool: connecting flips the action to Added', async () => {
    const user = userEvent.setup()
    renderAt('/opportunity/o2')
    const detail = within(screen.getByTestId('screen-opportunity-detail'))
    await user.click(detail.getByRole('button', { name: /add to jira|connect/i }))
    await user.click(screen.getByRole('button', { name: /^Jira$/i }))
    await user.click(detail.getByRole('button', { name: /add to jira/i }))
    expect(detail.getByRole('button', { name: /added/i })).toBeInTheDocument()
  })

  it('dismissing the linked-item alert hides it', async () => {
    const user = userEvent.setup()
    renderAt('/opportunity/o2')
    const detail = within(screen.getByTestId('screen-opportunity-detail'))
    expect(detail.getByText(/possible related issue/i)).toBeInTheDocument()
    await user.click(detail.getByRole('button', { name: /dismiss/i }))
    expect(detail.queryByText(/possible related issue/i)).not.toBeInTheDocument()
    expect(detail.getByText(/no issues linked yet/i)).toBeInTheDocument()
  })
})
