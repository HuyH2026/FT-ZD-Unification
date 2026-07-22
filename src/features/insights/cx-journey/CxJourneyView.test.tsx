import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CxJourneyView } from './CxJourneyView'

describe('CxJourneyView', () => {
  it('renders the three section headings', () => {
    render(<CxJourneyView />)
    const view = within(screen.getByTestId('view-cx-journey'))
    expect(view.getByText('Total conversations (AI + Human)')).toBeInTheDocument()
    expect(view.getByText('Agent efficiency & CSAT')).toBeInTheDocument()
    expect(view.getByText('Trends (AI + Human)')).toBeInTheDocument()
  })

  it('renders the three agent row labels', () => {
    render(<CxJourneyView />)
    const view = within(screen.getByTestId('view-cx-journey'))
    expect(view.getByText('AI + Human')).toBeInTheDocument()
    expect(view.getByRole('cell', { name: 'AI' })).toBeInTheDocument()
    expect(view.getByRole('cell', { name: 'Human' })).toBeInTheDocument()
  })

  it('lets the user switch the trends granularity', async () => {
    const user = userEvent.setup()
    render(<CxJourneyView />)
    const view = within(screen.getByTestId('view-cx-journey'))
    const weekly = view.getByRole('tab', { name: 'Weekly' })
    const monthly = view.getByRole('tab', { name: 'Monthly' })
    expect(weekly).toHaveAttribute('aria-selected', 'true')
    await user.click(monthly)
    expect(monthly).toHaveAttribute('aria-selected', 'true')
    expect(weekly).toHaveAttribute('aria-selected', 'false')
  })

  it('switches to the Automation tab and back to Overview', async () => {
    const user = userEvent.setup()
    render(<CxJourneyView />)
    const view = within(screen.getByTestId('view-cx-journey'))
    await user.click(view.getByRole('tab', { name: 'Automation' }))
    expect(view.getByText('6,908')).toBeInTheDocument()
    expect(view.getByText('Reactivate account')).toBeInTheDocument()
    expect(view.queryByText('Total conversations (AI + Human)')).not.toBeInTheDocument()
    await user.click(view.getByRole('tab', { name: 'Overview' }))
    expect(view.getByText('Total conversations (AI + Human)')).toBeInTheDocument()
  })
})
