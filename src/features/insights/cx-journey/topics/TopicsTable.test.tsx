import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TopicsTable } from './TopicsTable'

describe('TopicsTable view toggle', () => {
  it('shows the table view by default', () => {
    render(<TopicsTable />)
    expect(screen.queryByTestId('topics-treemap')).not.toBeInTheDocument()
    expect(screen.getByText('Account Management')).toBeInTheDocument()
  })

  it('switches to the treemap view when the treemap toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<TopicsTable />)
    const toggle = screen.getByRole('button', { name: 'Treemap view' })
    await user.click(toggle)
    expect(screen.getByTestId('topics-treemap')).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches back to the table view on a second click', async () => {
    const user = userEvent.setup()
    render(<TopicsTable />)
    const toggle = screen.getByRole('button', { name: 'Treemap view' })
    await user.click(toggle)
    await user.click(toggle)
    expect(screen.queryByTestId('topics-treemap')).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })
})
