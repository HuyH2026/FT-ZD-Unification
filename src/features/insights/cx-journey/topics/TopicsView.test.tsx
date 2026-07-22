import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TopicsView } from './TopicsView'

describe('TopicsView', () => {
  it('renders the four zones', () => {
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    expect(view.getByText('Top movers & recommendations')).toBeInTheDocument()
    expect(view.getByText('Categorized tickets')).toBeInTheDocument()
    expect(view.getByText('Group topics')).toBeInTheDocument()
    expect(view.getByText('Account Management')).toBeInTheDocument()
  })

  it('collapses the top-movers panel', async () => {
    const user = userEvent.setup()
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    expect(view.getByText('Top movers by Discover categorized tickets')).toBeInTheDocument()
    await user.click(view.getByRole('button', { name: 'Toggle top movers' }))
    expect(view.queryByText('Top movers by Discover categorized tickets')).not.toBeInTheDocument()
  })

  it('expands a top-level topic row to reveal its nested sub-rows', async () => {
    const user = userEvent.setup()
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    // Account Management starts collapsed (only Payment Management is open).
    expect(view.queryByText('Common requests')).not.toBeInTheDocument()
    await user.click(view.getByRole('button', { name: /Account Management/ }))
    expect(view.getByText('Common requests')).toBeInTheDocument()
  })

  it('shows Payment Management expanded by default with its refund sub-tree', () => {
    render(<TopicsView />)
    const view = within(screen.getByTestId('view-cx-topics'))
    expect(view.getByText('Refund Requests and Inquiries')).toBeInTheDocument()
    // pm-refund sub-topic is open by default → its leaf rows are visible.
    expect(view.getByText('Refund Status Check')).toBeInTheDocument()
  })
})
