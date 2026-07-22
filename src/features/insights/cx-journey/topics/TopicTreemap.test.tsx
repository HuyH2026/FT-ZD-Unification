import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TopicTreemap } from './TopicTreemap'
import { TOPIC_ROWS } from './topics-data'

const SIZE = { width: 800, height: 400 }

describe('TopicTreemap', () => {
  it('renders one cell per top-level topic', () => {
    render(<TopicTreemap initialSize={SIZE} />)
    const root = within(screen.getByTestId('topics-treemap'))
    for (const row of TOPIC_ROWS) {
      expect(root.getAllByText(row.name, { exact: false }).length).toBeGreaterThan(0)
    }
  })

  it('shows the tooltip with topic metrics on hover', async () => {
    const user = userEvent.setup()
    render(<TopicTreemap initialSize={SIZE} />)
    await user.hover(screen.getByRole('button', { name: /Account Management/ }))
    // Tooltip-only label proves the card rendered.
    expect(screen.getByText('Avg. first resolution time')).toBeInTheDocument()
  })

  it('drills into a topic on click and shows a breadcrumb back to All topics', async () => {
    const user = userEvent.setup()
    render(<TopicTreemap initialSize={SIZE} />)
    await user.click(screen.getByRole('button', { name: /Account Management/ }))
    const root = within(screen.getByTestId('topics-treemap'))
    // Sub-topics of the generic tree are now the cells.
    expect(root.getByText('Common requests', { exact: false })).toBeInTheDocument()
    expect(root.getByRole('button', { name: 'All topics' })).toBeInTheDocument()
  })

  it('returns to top level when the breadcrumb root is clicked', async () => {
    const user = userEvent.setup()
    render(<TopicTreemap initialSize={SIZE} />)
    await user.click(screen.getByRole('button', { name: /Account Management/ }))
    await user.click(screen.getByRole('button', { name: 'All topics' }))
    const root = within(screen.getByTestId('topics-treemap'))
    // Back at top level: another top-level topic is visible again.
    expect(root.getAllByText('Verification and Security', { exact: false }).length).toBeGreaterThan(0)
  })

  it('shows the sub-topic fallback tooltip when a drilled cell is hovered', async () => {
    const user = userEvent.setup()
    const { container } = render(<TopicTreemap initialSize={SIZE} />)
    await user.click(screen.getByRole('button', { name: /Account Management/ }))
    // Sub-topics have no firstContactResolution, so the card renders the '—' fallback.
    const subCell = container.querySelector('[data-treemap-cell="account-s1"]')
    expect(subCell).not.toBeNull()
    await user.hover(subCell as Element)
    expect(screen.getByText('First contact resolution')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('does not drill further when a sub-topic cell is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<TopicTreemap initialSize={SIZE} />)
    await user.click(screen.getByRole('button', { name: /Account Management/ }))
    const root = within(screen.getByTestId('topics-treemap'))
    // Sub-cells are non-interactive regions, not buttons.
    const subCell = container.querySelector('[data-treemap-cell="account-s1"]')
    expect(subCell?.tagName).toBe('DIV')
    await user.click(subCell as Element)
    // Still on the Account Management drilled level (breadcrumb + sub-topics unchanged).
    expect(root.getByText('Account Management', { exact: false })).toBeInTheDocument()
    expect(root.getAllByText('Common requests', { exact: false }).length).toBeGreaterThan(0)
  })
})
