import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TicketSourcesTab } from './TicketSourcesTab'
import { AUTOMATION_DETAILS } from './automation-data'

describe('TicketSourcesTab', () => {
  it('renders the first ticket id, metrics, and both message blocks', () => {
    render(<TicketSourcesTab detail={AUTOMATION_DETAILS['Reactivate account']} />)
    expect(screen.getByText(/Ticket ID: 1274/)).toBeInTheDocument()
    expect(screen.getByText('Customer request')).toBeInTheDocument()
    expect(screen.getByText('Agent response')).toBeInTheDocument()
  })

  it('advances to the next ticket via the pager (wrapping)', async () => {
    const user = userEvent.setup()
    render(<TicketSourcesTab detail={AUTOMATION_DETAILS['Account Linking and Updating']} />)
    // single-ticket topic wraps back to the same ticket; pager label stays "1 of 1"
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next ticket/i }))
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
  })

  it('advances through multiple tickets and wraps around', async () => {
    const user = userEvent.setup()
    render(<TicketSourcesTab detail={AUTOMATION_DETAILS['Account Lock Issues']} />)
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByText(/Ticket ID: 1288/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next ticket/i }))
    expect(screen.getByText('2 of 2')).toBeInTheDocument()
    expect(screen.getByText(/Ticket ID: 1291/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next ticket/i }))
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByText(/Ticket ID: 1288/)).toBeInTheDocument()
  })
})
